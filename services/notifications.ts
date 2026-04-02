import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

// Tell the app how to handle notifications while the app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// 1. Register Push Token (Fails gracefully in Expo Go)
export const registerPushToken = async (uid: string) => {
  // Prevent Expo Go SDK 53 from crashing
  if (Constants.appOwnership === "expo" || !Device.isDevice) {
    console.log("Bypassing Push Notifications because you are in Expo Go.");
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== "granted") return null;

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) return null;

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    await setDoc(doc(db, "users", uid), { pushToken: tokenData.data }, { merge: true });
    
    return tokenData.data;
  } catch (error) {
    console.warn("Could not register push token:", error);
    return null;
  }
};

// 2. Schedule Local Alarm (This is what was missing!)
export const scheduleLocalAlarm = async (time: Date, title: string) => {
  try {
    const triggerInSeconds = (time.getTime() - Date.now()) / 1000;
    if (triggerInSeconds <= 0) return null; // Time is in the past

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ Alarm!",
        body: title,
        sound: true, 
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: triggerInSeconds,
      },
    });
    return id;
  } catch (e) {
    console.warn("Could not schedule local alarm:", e);
    return null;
  }
};

// 3. Cancel Local Alarm
export const cancelLocalAlarm = async (localId: string) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(localId);
  } catch (e) {
    console.warn("Could not cancel local alarm:", e);
  }
};

// 4. Send Remote Push to a Friend
export const sendPushToUser = async (pushToken: string, time: Date, fromUid: string) => {
  try {
    const message = {
      to: pushToken,
      sound: "default",
      title: "⏰ New Alarm Set!",
      body: `${fromUid} set an alarm for you at ${time.toLocaleTimeString()}`,
    };

    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });
  } catch (e) {
    console.warn("Could not send remote push notification:", e);
  }
};
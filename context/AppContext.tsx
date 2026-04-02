import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  updateDoc,
  deleteDoc,
  Timestamp,
  setDoc,
  getDocs,
} from "firebase/firestore";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../services/firebase";
import {
  registerPushToken,
  scheduleLocalAlarm,
  cancelLocalAlarm,
  sendPushToUser,
} from "../services/notifications";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FriendStatus = "pending" | "approved";
export type FriendDirection = "sent" | "received";

export type Friend = {
  id: string;           // Firestore document ID of the friendRequest
  uid: string;          // The other person's Firebase UID
  displayName: string;  // Their UID (short) used as display name
  status: FriendStatus;
  direction: FriendDirection;
};

export type Alarm = {
  id: string;           // Firestore document ID
  time: Date;
  forUser: string;      // UID of recipient ("Me" if self)
  forUserName: string;  // Display label
  fromUser: string;     // UID of sender
  localId?: string;     // Expo notification identifier (for local alarms)
  isMine: boolean;      // Did I create this alarm?
};

type AppContextType = {
  uid: string | null;
  isReady: boolean;
  friends: Friend[];
  alarms: Alarm[];
  sendRequest: (toUid: string) => Promise<void>;
  approveRequest: (requestId: string) => Promise<void>;
  rejectRequest: (requestId: string) => Promise<void>;
  addAlarm: (time: Date, toUid: string, toName: string) => Promise<void>;
  deleteAlarm: (alarm: Alarm) => Promise<void>;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [uid, setUid] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);

  // ── Helper: shorten UID for display ─────────────────────────────────────────
  const shortUid = (id: string) => id.slice(0, 8).toUpperCase();

  // ── 1. Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        await registerPushToken(user.uid);
        setIsReady(true);
      } else {
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.error("Auth error:", e);
        }
      }
    });
    return unsub;
  }, []);

  // ── 2. Listen to friend requests ─────────────────────────────────────────────
  useEffect(() => {
    if (!uid) return;

    let sentList: Friend[] = [];
    let receivedList: Friend[] = [];

    const merge = () => {
      // Deduplicate: if same UID appears in both, keep approved
      const all = [...sentList, ...receivedList];
      const seen = new Map<string, Friend>();
      for (const f of all) {
        const existing = seen.get(f.uid);
        if (!existing || f.status === "approved") {
          seen.set(f.uid, f);
        }
      }
      setFriends(Array.from(seen.values()));
    };

    const sentQ = query(
      collection(db, "friendRequests"),
      where("fromUid", "==", uid)
    );
    const receivedQ = query(
      collection(db, "friendRequests"),
      where("toUid", "==", uid)
    );

    const unsubSent = onSnapshot(sentQ, (snap) => {
      sentList = snap.docs.map((d) => ({
        id: d.id,
        uid: d.data().toUid as string,
        displayName: d.data().toName || shortUid(d.data().toUid),
        status: d.data().status as FriendStatus,
        direction: "sent",
      }));
      merge();
    });

    const unsubReceived = onSnapshot(receivedQ, (snap) => {
      receivedList = snap.docs.map((d) => ({
        id: d.id,
        uid: d.data().fromUid as string,
        displayName: d.data().fromName || shortUid(d.data().fromUid),
        status: d.data().status as FriendStatus,
        direction: "received",
      }));
      merge();
    });

    return () => {
      unsubSent();
      unsubReceived();
    };
  }, [uid]);

  // ── 3. Listen to alarms (mine + ones set for me) ─────────────────────────────
  useEffect(() => {
    if (!uid) return;

    let myAlarms: Alarm[] = [];
    let forMeAlarms: Alarm[] = [];

    const merge = () => {
      // Merge, dedup by id
      const map = new Map<string, Alarm>();
      [...myAlarms, ...forMeAlarms].forEach((a) => map.set(a.id, a));
      const sorted = Array.from(map.values()).sort(
        (a, b) => a.time.getTime() - b.time.getTime()
      );
      setAlarms(sorted);
    };

    // Alarms I created
    const myQ = query(
      collection(db, "alarms"),
      where("fromUid", "==", uid)
    );
    // Alarms others set for me
    const forMeQ = query(
      collection(db, "alarms"),
      where("toUid", "==", uid),
      where("fromUid", "!=", uid)
    );

    const unsubMine = onSnapshot(myQ, (snap) => {
      myAlarms = snap.docs.map((d) => ({
        id: d.id,
        time: (d.data().time as Timestamp).toDate(),
        forUser: d.data().toUid,
        forUserName: d.data().toName || (d.data().toUid === uid ? "Me" : shortUid(d.data().toUid)),
        fromUser: uid,
        localId: d.data().localId,
        isMine: true,
      }));
      merge();
    });

    const unsubForMe = onSnapshot(forMeQ, (snap) => {
      forMeAlarms = snap.docs.map((d) => ({
        id: d.id,
        time: (d.data().time as Timestamp).toDate(),
        forUser: uid,
        forUserName: "Me",
        fromUser: d.data().fromUid,
        localId: d.data().localId,
        isMine: false,
      }));
      merge();
    });

    return () => {
      unsubMine();
      unsubForMe();
    };
  }, [uid]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const sendRequest = useCallback(
    async (toUid: string) => {
      if (!uid) throw new Error("Not authenticated");
      if (toUid === uid) throw new Error("You can't add yourself");

      const already = friends.find((f) => f.uid === toUid);
      if (already) throw new Error("Request already exists");

      await addDoc(collection(db, "friendRequests"), {
        fromUid: uid,
        fromName: shortUid(uid),
        toUid,
        toName: shortUid(toUid),
        status: "pending",
        createdAt: Timestamp.now(),
      });
    },
    [uid, friends]
  );

  const approveRequest = useCallback(async (requestId: string) => {
    await updateDoc(doc(db, "friendRequests", requestId), {
      status: "approved",
      approvedAt: Timestamp.now(),
    });
  }, []);

  const rejectRequest = useCallback(async (requestId: string) => {
    await deleteDoc(doc(db, "friendRequests", requestId));
  }, []);

  const addAlarm = useCallback(
    async (time: Date, toUid: string, toName: string) => {
      if (!uid) throw new Error("Not authenticated");

      const isSelf = toUid === uid || toUid === "Me";
      const targetUid = isSelf ? uid : toUid;

      // Schedule a local notification on THIS device
      const localId = await scheduleLocalAlarm(
        time,
        isSelf ? "Your Alarm" : `Alarm for ${toName}`
      );

      // Save alarm to Firestore
      const docRef = await addDoc(collection(db, "alarms"), {
        fromUid: uid,
        toUid: targetUid,
        toName: isSelf ? "Me" : toName,
        time: Timestamp.fromDate(time),
        localId,
        createdAt: Timestamp.now(),
      });

      // If sending to a friend, also push-notify them
      if (!isSelf) {
        try {
          const userSnap = await getDoc(doc(db, "users", targetUid));
          const pushToken = userSnap.data()?.pushToken;
          if (pushToken) {
            await sendPushToUser(pushToken, time, shortUid(uid));
          }
        } catch (e) {
          console.warn("Could not send push to friend:", e);
          // Don't fail the whole operation if push fails
        }
      }
    },
    [uid]
  );

  const deleteAlarm = useCallback(
    async (alarm: Alarm) => {
      // Cancel local notification if it exists
      if (alarm.localId) {
        await cancelLocalAlarm(alarm.localId);
      }
      // Delete from Firestore
      await deleteDoc(doc(db, "alarms", alarm.id));
    },
    []
  );

  return (
    <AppContext.Provider
      value={{
        uid,
        isReady,
        friends,
        alarms,
        sendRequest,
        approveRequest,
        rejectRequest,
        addAlarm,
        deleteAlarm,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
};

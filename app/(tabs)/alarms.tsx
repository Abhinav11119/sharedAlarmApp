import DateTimePicker from "@react-native-community/datetimepicker";
import { Audio } from "expo-av";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useApp } from "../../context/AppContext";

export default function Alarms() {
  const { uid, friends, addAlarm, alarms, deleteAlarm, isReady } = useApp();

  const [time, setTime] = useState(new Date());
  const [show, setShow] = useState(false);
  const [selectedUid, setSelectedUid] = useState("Me");
  const [selectedName, setSelectedName] = useState("Me");
  const [saving, setSaving] = useState(false);

  // --- FOREGROUND ALARM AUDIO STATE ---
  const [sound, setSound] = useState<Audio.Sound>();
  const [triggeredAlarms, setTriggeredAlarms] = useState<Set<string>>(new Set());

  // 1. Unload sound from memory when the component unmounts
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  // 2. Watch the clock every 5 seconds to play the loud sound
  useEffect(() => {
    const timer = setInterval(async () => {
      const now = new Date();

      for (const alarm of alarms) {
        const isTime =
          alarm.time.getHours() === now.getHours() &&
          alarm.time.getMinutes() === now.getMinutes();

        // If it's time and we haven't already triggered this specific alarm
        if (isTime && !triggeredAlarms.has(alarm.id)) {
          setTriggeredAlarms((prev) => new Set(prev).add(alarm.id));

          try {
            // Force sound to play even if the phone is on silent mode
            await Audio.setAudioModeAsync({
              playsInSilentModeIOS: true,
              staysActiveInBackground: true,
              shouldDuckAndroid: true,
            });

            console.log("Playing alarm sound for:", alarm.forUserName);

            // Fetch a loud alarm sound from the web
            const { sound: newSound } = await Audio.Sound.createAsync(
              { uri: "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg" }
            );
            setSound(newSound);

            // Loop the sound so it keeps ringing
            await newSound.setIsLoopingAsync(true);
            await newSound.playAsync();

            Alert.alert(
              "⏰ ALARM!",
              alarm.forUserName === "Me"
                ? "Your alarm is ringing!"
                : `Alarm for ${alarm.forUserName}!`,
              [
                {
                  text: "Stop",
                  onPress: () => newSound.stopAsync(),
                },
              ]
            );
          } catch (e) {
            console.warn("Could not play sound:", e);
          }
        }
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [alarms, triggeredAlarms]);
  // --- END FOREGROUND ALARM AUDIO ---

  const approvedFriends = friends.filter((f) => f.status === "approved");

  const onChange = (_: any, selectedDate?: Date) => {
    setShow(false);
    if (selectedDate) setTime(selectedDate);
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const handleSave = async () => {
    if (time <= new Date()) {
      Alert.alert("Invalid Time", "Please set a future time for the alarm.");
      return;
    }

    setSaving(true);
    try {
      await addAlarm(time, selectedUid, selectedName);
      Alert.alert(
        "✅ Alarm Set!",
        selectedUid === "Me"
          ? `Your alarm is set for ${formatTime(time)}`
          : `Alarm set for ${selectedName} at ${formatTime(time)}`
      );
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not set alarm.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (alarm: any) => {
    Alert.alert("Delete Alarm", "Remove this alarm?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAlarm(alarm);
          } catch (e) {
            Alert.alert("Error", "Could not delete alarm.");
          }
        },
      },
    ]);
  };

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Setting up…</Text>
      </View>
    );
  }

  const myAlarms = alarms.filter((a) => a.isMine && a.forUser === uid);
  const alarmsForFriends = alarms.filter((a) => a.isMine && a.forUser !== uid);
  const alarmsFromFriends = alarms.filter((a) => !a.isMine);

  const renderAlarmCard = (item: any, showFor = true, canDelete = true) => (
    <View key={item.id} style={styles.alarmCard}>
      <View style={styles.alarmRow}>
        <Text style={styles.alarmTime}>{formatTime(item.time)}</Text>
        {canDelete && (
          <TouchableOpacity
            onPress={() => handleDelete(item)}
            style={styles.deleteBtn}
          >
            <Text style={styles.deleteText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      {showFor && <Text style={styles.alarmMeta}>For: {item.forUserName}</Text>}
      {!item.isMine && (
        <Text style={styles.alarmFrom}>
          Set by: {item.fromUser.slice(0, 8).toUpperCase()}
        </Text>
      )}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text style={styles.title}>⏰ Set Alarm</Text>

      {/* YOUR ID */}
      <View style={styles.uidBox}>
        <Text style={styles.uidLabel}>Your ID (share with friends)</Text>
        <Text selectable style={styles.uidText}>
          {uid?.slice(0, 8).toUpperCase()}
        </Text>
      </View>

      {/* USER SELECT */}
      <Text style={styles.section}>Set alarm for</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[{ uid: "Me", displayName: "Me" }, ...approvedFriends].map((item) => (
          <TouchableOpacity
            key={item.uid}
            style={[
              styles.userChip,
              selectedUid === item.uid && styles.selectedChip,
            ]}
            onPress={() => {
              setSelectedUid(item.uid);
              setSelectedName(item.displayName);
            }}
          >
            <Text
              style={[
                styles.chipText,
                selectedUid === item.uid && styles.selectedChipText,
              ]}
            >
              {item.displayName}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {approvedFriends.length === 0 && (
        <Text style={styles.hint}>
          Add friends in the Friends tab to set alarms for them.
        </Text>
      )}

      {/* TIME PICKER */}
      <Text style={styles.section}>Time</Text>
      <TouchableOpacity style={styles.timeBox} onPress={() => setShow(true)}>
        <Text style={styles.timeText}>{formatTime(time)}</Text>
        <Text style={styles.timeHint}>Tap to change</Text>
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={time}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={onChange}
        />
      )}

      {/* SAVE BUTTON */}
      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveText}>
            {selectedUid === "Me"
              ? "Set Alarm for Myself"
              : `Set Alarm for ${selectedName}`}
          </Text>
        )}
      </TouchableOpacity>

      {/* MY ALARMS */}
      {myAlarms.length > 0 && (
        <>
          <Text style={styles.section}>My Alarms</Text>
          {myAlarms.map((a) => renderAlarmCard(a, false, true))}
        </>
      )}

      {/* ALARMS I SET FOR FRIENDS */}
      {alarmsForFriends.length > 0 && (
        <>
          <Text style={styles.section}>Alarms I Set for Friends</Text>
          {alarmsForFriends.map((a) => renderAlarmCard(a, true, true))}
        </>
      )}

      {/* ALARMS FRIENDS SET FOR ME */}
      {alarmsFromFriends.length > 0 && (
        <>
          <Text style={styles.section}>Alarms Set for Me</Text>
          {alarmsFromFriends.map((a) => renderAlarmCard(a, false, false))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop: 30,
    backgroundColor: "#f5f5f5",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#666",
    fontSize: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  uidBox: {
    backgroundColor: "#e8f4fd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  uidLabel: {
    fontSize: 12,
    color: "#555",
    marginBottom: 4,
  },
  uidText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1565C0",
    letterSpacing: 2,
  },
  section: {
    marginTop: 18,
    marginBottom: 10,
    fontWeight: "700",
    fontSize: 15,
    color: "#333",
  },
  userChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#ddd",
    borderRadius: 20,
    marginRight: 10,
  },
  selectedChip: {
    backgroundColor: "#2196F3",
  },
  chipText: {
    fontWeight: "600",
    color: "#333",
  },
  selectedChipText: {
    color: "#fff",
  },
  hint: {
    color: "#999",
    fontSize: 12,
    marginTop: 8,
    fontStyle: "italic",
  },
  timeBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  timeText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  timeHint: {
    fontSize: 12,
    color: "#aaa",
    marginTop: 4,
  },
  saveBtn: {
    marginTop: 20,
    backgroundColor: "#2196F3",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnDisabled: {
    backgroundColor: "#90CAF9",
  },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  alarmCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  alarmRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  alarmTime: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  alarmMeta: {
    color: "#555",
    marginTop: 4,
    fontSize: 13,
  },
  alarmFrom: {
    color: "#2196F3",
    marginTop: 4,
    fontSize: 13,
    fontStyle: "italic",
  },
  deleteBtn: {
    backgroundColor: "#FFEBEE",
    borderRadius: 20,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: {
    color: "#E53935",
    fontWeight: "bold",
    fontSize: 14,
  },
});
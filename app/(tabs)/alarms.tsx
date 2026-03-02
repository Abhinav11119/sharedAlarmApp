import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useApp } from "../../context/AppContext";

export default function Alarms() {
  const { friends, addAlarm, alarms } = useApp();

  const [time, setTime] = useState(new Date());
  const [show, setShow] = useState(false);
  const [selectedUser, setSelectedUser] = useState("Me");

  const approvedFriends = friends
    .filter((f) => f.status === "approved")
    .map((f) => f.name);

  const onChange = (event: any, selectedDate?: Date) => {
    setShow(false);
    if (selectedDate) setTime(selectedDate);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>⏰ Set Alarm</Text>

      {/* USER SELECT */}
      <Text style={styles.section}>Select User</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={["Me", ...approvedFriends]}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.userChip,
              selectedUser === item && styles.selectedChip,
            ]}
            onPress={() => setSelectedUser(item)}
          >
            <Text>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {/* TIME PICKER */}
      <Text style={styles.section}>Time</Text>
      <TouchableOpacity
        style={styles.timeBox}
        onPress={() => setShow(true)}
      >
        <Text style={styles.timeText}>{formatTime(time)}</Text>
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
        style={styles.saveBtn}
        onPress={() => addAlarm(time, selectedUser)}
      >
        <Text style={styles.saveText}>Save Alarm</Text>
      </TouchableOpacity>

      {/* ALARM LIST */}
      <Text style={styles.section}>Your Alarms</Text>
      <FlatList
        data={alarms}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View style={styles.alarmCard}>
            <Text style={styles.alarmTime}>
              {formatTime(item.time)}
            </Text>
            <Text style={styles.alarmUser}>
              For: {item.forUser}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop: 30,
    backgroundColor: "#f5f5f5",
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },

  section: {
    marginTop: 15,
    marginBottom: 8,
    fontWeight: "600",
  },

  userChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "#ddd",
    borderRadius: 20,
    marginRight: 10,
  },

  selectedChip: {
    backgroundColor: "#4CAF50",
  },

  timeBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
  },

  timeText: {
    fontSize: 28,
    fontWeight: "bold",
  },

  saveBtn: {
    marginTop: 20,
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  alarmCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    elevation: 2,
  },

  alarmTime: {
    fontSize: 20,
    fontWeight: "bold",
  },

  alarmUser: {
    color: "gray",
    marginTop: 5,
  },
});
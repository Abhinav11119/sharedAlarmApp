import React, { useState } from "react";
import { View, Text, Button, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function Index() {
  const [time, setTime] = useState(new Date());
  const [show, setShow] = useState(false);
  const [alarms, setAlarms] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("Me");

  const users = ["Me", "Alex", "John", "Sara"];
  const [allowedUsers, setAllowedUsers] = useState<string[]>(["Me"]);

  const togglePermission = (user: string) => {
    if (allowedUsers.includes(user)) {
      setAllowedUsers(allowedUsers.filter(u => u !== user));
    } else {
      setAllowedUsers([...allowedUsers, user]);
    }
  };

  const addAlarm = () => {
    if (!allowedUsers.includes(selectedUser)) {
      alert("❌ Not allowed");
      return;
    }

    setAlarms([...alarms, { time, by: selectedUser }]);
    setShow(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>⏰ Shared Alarm</Text>

      <Text style={styles.subtitle}>Set as:</Text>
      <FlatList
        horizontal
        data={users}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.userBtn, selectedUser === item && styles.selected]}
            onPress={() => setSelectedUser(item)}
          >
            <Text>{item}</Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.subtitle}>Permissions:</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => togglePermission(item)}>
            <Text>
              {allowedUsers.includes(item) ? "✅" : "❌"} {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      <Button title="Set Alarm" onPress={() => setShow(true)} />

      {show && (
        <DateTimePicker
          value={time}
          mode="time"
          is24Hour={false}
          onChange={(e, selected) => selected && setTime(selected)}
        />
      )}

      <Button title="Save Alarm" onPress={addAlarm} />

      <FlatList
        data={alarms}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <Text style={styles.alarm}>
            {item.time.toLocaleTimeString()} (by {item.by})
          </Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, marginTop: 40 },
  title: { fontSize: 26, textAlign: "center" },
  subtitle: { marginTop: 10, fontWeight: "bold" },
  userBtn: { padding: 10, margin: 5, borderWidth: 1, borderRadius: 8 },
  selected: { backgroundColor: "#ddd" },
  alarm: { textAlign: "center", marginTop: 10 }
});
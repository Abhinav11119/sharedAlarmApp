import { View, Text, Button, FlatList } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { useApp } from "../../context/AppContext";

export default function Alarms() {
  const { friends, addAlarm, alarms } = useApp();
  const [time, setTime] = useState(new Date());
  const [show, setShow] = useState(false);
  const [selectedUser, setSelectedUser] = useState("Me");

  const approvedFriends = friends
    .filter(f => f.status === "approved")
    .map(f => f.name);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text>Set alarm for:</Text>

      {approvedFriends.map(name => (
        <Button key={name} title={name} onPress={() => setSelectedUser(name)} />
      ))}

      <Button title="Pick Time" onPress={() => setShow(true)} />

      {show && (
        <DateTimePicker
          value={time}
          mode="time"
          onChange={(e, selected) => selected && setTime(selected)}
        />
      )}

      <Button title="Save Alarm" onPress={() => addAlarm(time, selectedUser)} />

      <FlatList
        data={alarms}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <Text>
            {item.time.toLocaleTimeString()} → {item.forUser}
          </Text>
        )}
      />
    </View>
  );
}
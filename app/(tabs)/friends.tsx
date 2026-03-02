import { View, Text, Button, FlatList } from "react-native";
import { useApp } from "../../context/AppContext";

export default function Friends() {
  const { friends, sendRequest, approveRequest } = useApp();

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 15 }}>
            <Text>{item.name} — {item.status}</Text>

            {item.status === "none" && (
              <Button title="Send Request" onPress={() => sendRequest(item.name)} />
            )}

            {item.status === "requested" && (
              <Button title="Approve (simulate)" onPress={() => approveRequest(item.name)} />
            )}
          </View>
        )}
      />
    </View>
  );
}
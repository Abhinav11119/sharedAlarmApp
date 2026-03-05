import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useApp } from "../../context/AppContext";

export default function Friends() {
  const { friends, sendRequest, approveRequest } = useApp();

  const [inputId, setInputId] = useState("");

  const handleSend = () => {
    if (!inputId.trim()) return;

    sendRequest(inputId.trim());
    setInputId("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👥 Friends & Permissions</Text>

      {/* SEND REQUEST */}
      <Text style={styles.section}>Send Friend Request</Text>

      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Enter friend ID"
          value={inputId}
          onChangeText={setInputId}
        />

        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>

      {/* REQUEST LIST */}
      <Text style={styles.section}>Requests / Friends</Text>

      <FlatList
        data={friends}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>

            <Text style={styles.status}>Status: {item.status}</Text>

            {item.status === "requested" && (
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => approveRequest(item.name)}
              >
                <Text style={styles.acceptText}>Accept (Simulate)</Text>
              </TouchableOpacity>
            )}

            {item.status === "approved" && (
              <Text style={styles.approved}>✅ Approved</Text>
            )}
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
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },

  section: {
    fontWeight: "600",
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    marginBottom: 20,
  },

  input: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginRight: 10,
  },

  sendBtn: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 20,
    justifyContent: "center",
    borderRadius: 10,
  },

  sendText: {
    color: "#fff",
    fontWeight: "600",
  },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },

  name: {
    fontSize: 16,
    fontWeight: "600",
  },

  status: {
    color: "gray",
    marginTop: 4,
  },

  acceptBtn: {
    marginTop: 10,
    backgroundColor: "#4CAF50",
    padding: 8,
    borderRadius: 6,
    alignSelf: "flex-start",
  },

  acceptText: {
    color: "#fff",
  },

  approved: {
    marginTop: 8,
    color: "green",
    fontWeight: "600",
  },
});
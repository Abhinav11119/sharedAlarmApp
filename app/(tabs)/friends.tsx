import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Clipboard,
} from "react-native";
import { useApp } from "../../context/AppContext";

export default function Friends() {
  const { uid, friends, sendRequest, approveRequest, rejectRequest, isReady } =
    useApp();

  const [inputId, setInputId] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const trimmed = inputId.trim().toUpperCase();
    if (!trimmed) return;

    // Accept short 8-char IDs — we'll try to match them
    // In production you'd look up the full UID by short ID
    setSending(true);
    try {
      await sendRequest(trimmed);
      setInputId("");
      Alert.alert("✅ Request Sent", `Friend request sent to ${trimmed}`);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not send request.");
    } finally {
      setSending(false);
    }
  };

  const handleApprove = async (id: string, name: string) => {
    try {
      await approveRequest(id);
      Alert.alert("✅ Friend Added", `${name} is now your friend!`);
    } catch (e) {
      Alert.alert("Error", "Could not approve request.");
    }
  };

  const handleReject = async (id: string) => {
    Alert.alert("Remove", "Remove this friend request?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await rejectRequest(id);
          } catch (e) {
            Alert.alert("Error", "Could not remove request.");
          }
        },
      },
    ]);
  };

  const copyUid = () => {
    if (uid) {
      Clipboard.setString(uid.slice(0, 8).toUpperCase());
      Alert.alert("Copied!", "Your ID has been copied to clipboard.");
    }
  };

  const pending = friends.filter(
    (f) => f.status === "pending" && f.direction === "received"
  );
  const sentPending = friends.filter(
    (f) => f.status === "pending" && f.direction === "sent"
  );
  const approved = friends.filter((f) => f.status === "approved");

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text style={styles.title}>👥 Friends</Text>

      {/* YOUR ID */}
      <View style={styles.uidBox}>
        <Text style={styles.uidLabel}>Your ID — share this with friends</Text>
        <TouchableOpacity onPress={copyUid} style={styles.uidRow}>
          <Text selectable style={styles.uidText}>
            {uid?.slice(0, 8).toUpperCase()}
          </Text>
          <Text style={styles.copyBtn}>📋 Copy</Text>
        </TouchableOpacity>
        <Text style={styles.uidHint}>
          Friends enter this ID to send you a request
        </Text>
      </View>

      {/* SEND REQUEST */}
      <Text style={styles.section}>Add a Friend</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Enter friend's 8-char ID"
          value={inputId}
          onChangeText={(t) => setInputId(t.toUpperCase())}
          autoCapitalize="characters"
          maxLength={8}
        />
        <TouchableOpacity
          style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sendText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* INCOMING REQUESTS */}
      {pending.length > 0 && (
        <>
          <Text style={styles.section}>Incoming Requests</Text>
          {pending.map((item) => (
            <View key={item.id} style={[styles.card, styles.pendingCard]}>
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.displayName.slice(0, 2)}
                  </Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.name}>{item.displayName}</Text>
                  <Text style={styles.statusText}>Wants to be friends</Text>
                </View>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => handleApprove(item.id, item.displayName)}
                >
                  <Text style={styles.acceptText}>✓ Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => handleReject(item.id)}
                >
                  <Text style={styles.rejectText}>✕ Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </>
      )}

      {/* SENT PENDING */}
      {sentPending.length > 0 && (
        <>
          <Text style={styles.section}>Sent Requests</Text>
          {sentPending.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={[styles.avatar, { backgroundColor: "#E3F2FD" }]}>
                  <Text style={[styles.avatarText, { color: "#1565C0" }]}>
                    {item.displayName.slice(0, 2)}
                  </Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.name}>{item.displayName}</Text>
                  <Text style={styles.statusText}>⏳ Awaiting response</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => handleReject(item.id)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}

      {/* APPROVED FRIENDS */}
      {approved.length > 0 && (
        <>
          <Text style={styles.section}>Friends ({approved.length})</Text>
          {approved.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={[styles.avatar, { backgroundColor: "#E8F5E9" }]}>
                  <Text style={[styles.avatarText, { color: "#2E7D32" }]}>
                    {item.displayName.slice(0, 2)}
                  </Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.name}>{item.displayName}</Text>
                  <Text style={[styles.statusText, { color: "#2E7D32" }]}>
                    ✅ Friend — can set alarms for each other
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </>
      )}

      {friends.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🤝</Text>
          <Text style={styles.emptyText}>No friends yet</Text>
          <Text style={styles.emptyHint}>
            Share your ID above or enter a friend's ID to get started
          </Text>
        </View>
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
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  uidBox: {
    backgroundColor: "#e8f4fd",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    alignItems: "center",
  },
  uidLabel: {
    fontSize: 12,
    color: "#555",
    marginBottom: 6,
  },
  uidRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  uidText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1565C0",
    letterSpacing: 3,
  },
  copyBtn: {
    fontSize: 14,
    color: "#1976D2",
  },
  uidHint: {
    fontSize: 11,
    color: "#888",
    marginTop: 6,
  },
  section: {
    marginTop: 20,
    marginBottom: 10,
    fontWeight: "700",
    fontSize: 15,
    color: "#333",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    letterSpacing: 2,
    fontWeight: "600",
  },
  sendBtn: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 20,
    justifyContent: "center",
    borderRadius: 10,
    minWidth: 70,
    alignItems: "center",
  },
  sendBtnDisabled: {
    backgroundColor: "#90CAF9",
  },
  sendText: {
    color: "#fff",
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  pendingCard: {
    borderLeftWidth: 3,
    borderLeftColor: "#FF9800",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF3E0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#E65100",
  },
  cardInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
  },
  statusText: {
    color: "#888",
    marginTop: 2,
    fontSize: 13,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  acceptText: {
    color: "#fff",
    fontWeight: "700",
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: "#FFEBEE",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  rejectText: {
    color: "#E53935",
    fontWeight: "700",
  },
  cancelBtn: {
    marginTop: 10,
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelText: {
    color: "#888",
    fontSize: 13,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 60,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#555",
  },
  emptyHint: {
    color: "#999",
    textAlign: "center",
    fontSize: 13,
    marginTop: 4,
  },
});

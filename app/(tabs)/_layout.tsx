import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2196F3",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#eee",
        },
      }}
    >
      <Tabs.Screen
        name="alarms"
        options={{
          title: "Alarms",
          tabBarIcon: ({ color }) => (
            <TabIcon emoji="⏰" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: "Friends",
          tabBarIcon: ({ color }) => (
            <TabIcon emoji="👥" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

// Simple emoji tab icon component
function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  const { Text } = require("react-native");
  return <Text style={{ fontSize: 20, opacity: color === "#2196F3" ? 1 : 0.5 }}>{emoji}</Text>;
}

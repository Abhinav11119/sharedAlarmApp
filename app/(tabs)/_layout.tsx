import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="alarms" options={{ title: "Alarms" }} />
      <Tabs.Screen name="friends" options={{ title: "Friends" }} />
    </Tabs>
  );
}
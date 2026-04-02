import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// 🔴 REPLACE these with your Firebase project config
// Get them from: Firebase Console → Project Settings → Your Apps → SDK setup
const firebaseConfig = {
  apiKey: "AIzaSyAA_fnSb0kdaI_Z1R6ypCzz9jwYxEWhEr0",
  authDomain: "sharedalarmapp-6c83d.firebaseapp.com",
  projectId: "sharedalarmapp-6c83d",
  storageBucket: "sharedalarmapp-6c83d.firebasestorage.app",
  messagingSenderId: "1085023666748",
  appId: "1:1085023666748:web:6f70d9422cb12852907939",
  measurementId: "G-BXPN1CVHGJ"
};
// Prevent re-initialization on hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 🔥 FIX: Use React Native Persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);

export { app, auth, db };

# sharedAlarmApp — Backend Setup Guide

## What's included in these files

| File | Purpose |
|---|---|
| `services/firebase.ts` | Firebase init — **add your config here** |
| `services/notifications.ts` | Push token registration + local alarm scheduling |
| `context/AppContext.tsx` | All app state, Firebase reads/writes, push logic |
| `app/_layout.tsx` | Root layout wrapping AppProvider |
| `app/(tabs)/_layout.tsx` | Tab bar config |
| `app/(tabs)/alarms.tsx` | Alarm creation + list screen |
| `app/(tabs)/friends.tsx` | Friend requests + approval screen |
| `app/index.tsx` | Redirect to alarms tab |

---

## Step 1 — Install dependencies

```bash
npx expo install firebase expo-notifications expo-device
npx expo install @react-native-community/datetimepicker
```

---

## Step 2 — Create a Firebase project

1. Go to https://console.firebase.google.com
2. Click **Add project** → give it a name → create
3. In the project dashboard:
   - Click **Authentication** → **Get started** → enable **Anonymous** sign-in
   - Click **Firestore Database** → **Create database** → start in **test mode**
4. Click the **</>** (Web) icon to register a web app
5. Copy the `firebaseConfig` object into `services/firebase.ts`

---

## Step 3 — Firestore security rules

In Firebase Console → Firestore → Rules, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Click **Publish**.

---

## Step 4 — Run on a real device (required for notifications)

```bash
npx expo start
```

Scan the QR code with Expo Go on your phone. Notifications **do not work** in the simulator.

---

## How the app works

### User Identity
- Each user gets an anonymous Firebase UID on first launch
- Their first 8 characters (e.g. `A3F2B1C9`) are their "display ID"
- Users share this ID with friends

### Friend Requests
1. User A copies their ID, shares it with User B
2. User B enters User A's ID in the Friends tab → taps Send
3. User A sees an incoming request → taps Accept
4. Both can now set alarms for each other

### Setting Alarms
- **For yourself**: Select "Me" → pick time → Save
  - Schedules a local notification on your device
  - Saved to Firestore
- **For a friend**: Select their name → pick time → Save
  - Schedules a local notification on your device (as confirmation)
  - Sends a push notification directly to their device via Expo Push API
  - Saved to Firestore so they see it in their alarm list

### Alarm List
- **My Alarms**: alarms you set for yourself
- **Alarms I Set for Friends**: alarms you created for others
- **Alarms Set for Me**: alarms friends created for you

---

## Firestore data structure

```
users/
  {uid}/
    pushToken: "ExponentPushToken[xxx]"
    updatedAt: timestamp

friendRequests/
  {docId}/
    fromUid: "abc123"
    fromName: "ABC123"    ← short display name
    toUid: "xyz789"
    toName: "XYZ789"
    status: "pending" | "approved"
    createdAt: timestamp

alarms/
  {docId}/
    fromUid: "abc123"
    toUid: "xyz789"       ← same as fromUid if alarm is for self
    toName: "Me" | "XYZ789"
    time: timestamp
    localId: "expo-notif-id"
    createdAt: timestamp
```

---

## Known limitations / next steps

- **Short IDs**: The 8-char display ID is a prefix of the full UID. Friend lookup
  currently stores the full UID in the request. For production, add a
  `usersByShortId` index or use phone number auth.
- **Background alarms**: For alarms to fire when the app is killed, use
  `expo-task-manager` with a background fetch task.
- **Names**: Replace short UIDs with real display names by adding a username
  field to the `users` collection.

# Ludo Champion – Build and Release Instructions

This document provides step-by-step instructions for developing, testing, and building production Android binaries (**APK** and **AAB**) for **Ludo Champion**.

---

## 1. Project Specifications

- **App Name:** Ludo Champion
- **Package Identifier:** `com.ludochampion.game`
- **Framework:** React Native (Expo Managed Workflow)
- **Navigation:** Expo Router
- **Orientation:** Portrait
- **Target OS:** Android (compatible with Android 5.0+ / API level 21+)

---

## 2. Running Locally for Development

### Start the Expo development server:
```bash
npx expo start
```

- Press `a` in the terminal to open the app on a connected Android phone or Android emulator.
- Scan the displayed QR code with the Expo Go app on an Android device to test instantly.

### Run Automated Tests:
```bash
npm test
```
All 19 game engine and movement test suites validate:
- Dice rolls (1-6)
- Yard exit logic (rolling 6)
- Clockwise path progression
- Safe square protection (8 star cells)
- Opponent token capture and yard resets
- 3 consecutive sixes forfeiture rule
- Exact roll home entry
- Victory conditions and ranking assignments

---

## 3. Building an Android APK (For Direct Device Testing)

To install and play the game directly on any physical Android smartphone without an app store:

### Step 1: Install EAS CLI
```bash
npx eas-cli@latest --version
```

### Step 2: Log in to your Expo account
```bash
npx eas-cli@latest login
```

### Step 3: Run the Preview APK Build
```bash
npx eas-cli@latest build -p android --profile preview
```

EAS Build will compile the native Android APK in the cloud. Once completed, a download link and QR code for the `.apk` file will be provided in the terminal.

---

## 4. Building an Android App Bundle (AAB) for Google Play Console

Google Play requires the **Android App Bundle (.aab)** format for store submission.

### Run the Production Release Build:
```bash
npx eas-cli@latest build -p android --profile production
```

This generates an optimized, signed `.aab` file ready for upload to:
- **Google Play Console** -> **Production** / **Internal Testing** track.

---

## 5. Google Play Store Submission Checklist

1. **Target Audience & Content:**
   - Select **Families** and **All Ages** (3+ / Everyone).
   - Under Store Presence -> Privacy Policy, provide the link to [`PRIVACY_POLICY.md`](./PRIVACY_POLICY.md).
2. **Permissions:**
   - The app only declares `android.permission.VIBRATE` (no camera, no location, no contacts, no audio recording).
3. **App Details:**
   - Title: **Ludo Champion**
   - Short Description: Classic Royal Indian Ludo board game for friends and family.
   - Category: Board Games / Casual

# Android Testing Guide

This guide explains how to build, install, and test the Detox Duel app on a real Android device using EAS Build.

## Prerequisites

- Node.js installed (v18+ recommended)
- **Yarn** installed (required for workspace setup):
  ```bash
  npm install -g yarn
  ```
- EAS CLI installed: `npm install -g eas-cli`
- Logged in to Expo account: `eas login`
- Project configured: `eas build:configure` (already done)
- **expo-dev-client installed** (required for development builds only):
  ```bash
  cd detox-duel
  yarn install
  ```
- Physical Android device or emulator with Android 8.0+

## Project Structure (Yarn Workspaces)

This project uses **Yarn Workspaces** to manage local modules:
- `expo-app-blocker` - Custom Android app blocking module
- `expo-screen-time` - Screen time tracking module

All dependencies are managed from the root directory.

## First-Time Setup

```bash
# 1. Navigate to project root (where package.json is)
cd C:\Users\aceve\detox-duel

# 2. Install all dependencies using yarn
yarn install

# 3. (Optional) Run prebuild to generate native code
cd detox-duel
npx expo prebuild --platform android --clean
```

## Project Structure (Yarn Workspaces)

This project uses **Yarn Workspaces** to manage local modules:
- `expo-app-blocker` - Custom Android app blocking module
- `expo-screen-time` - Screen time tracking module

All dependencies are managed from the root directory.

## First-Time Setup

```bash
# 1. Navigate to project root (where package.json is)
cd C:\Users\aceve\detox-duel

# 2. Install all dependencies using yarn
yarn install

# 3. (Optional) Run prebuild to generate native code
cd detox-duel
npx expo prebuild --platform android --clean
```

---

## Build the APK

### Development Build (with Dev Tools)

Build a development client with debugging tools enabled:

```bash
cd detox-duel
npm run build:dev
```

**What this creates:**
- Development client APK (~50-80 MB)
- Includes React Native DevTools, Fast Refresh, and debugging features
- Loads JS bundle from dev server (requires computer running)

**Build time:** 10-20 minutes

### Preview Build (Standalone APK)

Build a standalone preview APK for distribution:

```bash
cd detox-duel
npm run build:preview
```

**What this creates:**
- Standalone APK (~60-100 MB)
- Includes all native modules (expo-screen-time, expo-app-blocker)
- No dev tools, production-like performance
- Can share with testers via EAS link

**Build time:** 15-25 minutes

### Production Build (App Bundle)

Build production-ready Android App Bundle for Play Store:

```bash
cd detox-duel
npm run build:prod
```

**What this creates:**
- Android App Bundle (AAB) for Play Store submission
- Optimized and minified code
- No debugging features

**Build time:** 20-30 minutes

---

## Install the APK

### Method 1: Download Link (Easiest)

After build completes, EAS provides a download link:

1. Copy the URL from the terminal output
2. Open it in your Android device's browser
3. Download and install the APK
4. Allow installation from unknown sources if prompted

### Method 2: Install from Computer

```bash
# Download APK to computer
eas build:list --limit=1 --platform=android

# Install via ADB (requires USB debugging)
adb install detox-duel-1.0.0.apk
```

### Method 3: EAS Orbit (Fastest for Team)

1. Install EAS Orbit app on your device: https://expo.dev/orbit
2. Scan QR code from build output
3. Install automatically

---

## Grant Required Permissions

After installation, the app requires several special permissions to function properly:

### 1. Usage Access (Critical)

**Required for:** Screen time tracking, Quick Duels

**How to grant:**
1. Open Settings on your device
2. Navigate to **Apps** → **Detox Duel**
3. Tap **Special access**
4. Tap **Usage access**
5. Toggle **Detox Duel** to ON
6. Confirm by tapping **Allow**

**Verification:** The app should show "Usage Access: Granted" in Profile → Development Tools.

### 2. System Alert Window (Critical)

**Required for:** App blocking overlays, Quick Duels

**How to grant:**
1. Open Settings on your device
2. Navigate to **Apps** → **Detox Duel**
3. Tap **Special access**
4. Tap **Display over other apps**
5. Toggle **Detox Duel** to ON
6. Confirm by tapping **Allow**

**Verification:** Try blocking an app - you should see the blocking overlay.

### 3. Notifications (Recommended)

**Required for:** Challenge notifications, duel reminders

**How to grant:**
1. Open Settings on your device
2. Navigate to **Apps** → **Detox Duel**
3. Tap **Notifications**
4. Toggle notifications to ON
5. (Android 13+) Tap **Allow notifications** when prompted

**Verification:** Send yourself a test notification from the app.

### 4. Autostart (Optional)

**Required for:** Background challenges, reminders

**How to grant:**
1. Open Settings on your device
2. Navigate to **Apps** → **Detox Duel**
3. Tap **Battery** (or **Battery optimization**)
4. Toggle **Allow background activity** to ON
5. Add to **Autostart** list (varies by device)

**Note:** This setting varies by device manufacturer (Samsung, Xiaomi, etc.).

---

## Test a Quick Duel

A Quick Duel blocks a specific app for a set duration. Here's how to test it:

### Step 1: Select Target App

1. Open Detox Duel
2. Navigate to **Quick Duel** screen
3. Choose an app to block (e.g., Instagram, TikTok)
4. Set duel duration (e.g., 10 minutes)

### Step 2: Start the Duel

1. Tap **Start Duel**
2. App should show "Duel Active" screen with countdown timer
3. Verify timer is counting down

### Step 3: Test App Blocking

1. Try opening the blocked app from your home screen
2. **Expected behavior:**
   - Blocked app opens briefly
   - Detox Duel overlay appears
   - Overlay shows "This app is blocked" with remaining time
   - After ~3 seconds, you're returned to home screen

3. **Try opening a different app:**
   - Other apps should work normally
   - Only the blocked app is affected

### Step 4: Complete or Cancel Duel

1. Wait for timer to expire OR tap **End Duel Early**
2. Blocked app should now work normally
3. Verify duel history is updated in Profile

### Step 5: Check Screen Time

1. Navigate to Profile → Development Tools
2. Tap **Check Screen Time**
3. Verify all installed apps are listed with usage stats
4. Verify usage data is accurate (check against device's Digital Wellbeing)

---

## Known Limitations

### Accessibility Service

The accessibility service feature is **not fully implemented** in the current build. This means:

- ❌ Cannot automatically block apps when opened
- ❌ Cannot detect when apps are switched to
- ❌ Cannot enforce duels without manual blocking overlay

**Workaround:** The Quick Duel feature uses the `SYSTEM_ALERT_WINDOW` permission to show blocking overlays when you try to open blocked apps.

### Device Compatibility

- **Minimum Android version:** 8.0 (API level 26)
- **Recommended Android version:** 10.0+ (API level 29+)
- **Known issues:**
  - Some custom ROMs (MIUI, OxygenOS) may have different permission workflows
  - Battery optimization settings vary by manufacturer

### Build Limitations

- **Development builds:** Require dev server running on computer
- **Preview builds:** Cannot hot-reload (must rebuild for code changes)
- **Build time:** First build takes 15-25 minutes (subsequent builds are faster with caching)

---

## Troubleshooting

### Build Fails

**Error:** "Missing permission in manifest"
```bash
# Solution: Clean prebuild and rebuild
cd detox-duel
npx expo prebuild --platform android --clean
npm run build:preview
```

**Error:** "Gradle build failed"
```bash
# Solution: Clear Gradle cache and retry
rm -rf android/.gradle android/app/build
npm run build:preview
```

### App Crashes on Launch

**Cause:** Missing Supabase configuration
```bash
# Solution: Check .env file has valid credentials
cd detox-duel
cat .env
```

**Cause:** Native module not linked
```bash
# Solution: Clean prebuild and rebuild
npx expo prebuild --platform android --clean
npm run build:preview
```

### Permissions Not Working

**Issue:** "Usage Access not granted" error

**Solution:**
1. Verify you granted Usage Access (see section above)
2. Restart the app after granting permission
3. Check device settings → Usage access → Detox Duel

**Issue:** "Cannot display overlay" error

**Solution:**
1. Verify SYSTEM_ALERT_WINDOW permission granted
2. Check if overlay is blocked by other apps
3. Disable battery optimization for Detox Duel

### Screen Time Tracking Not Working

**Issue:** No usage data appears

**Solution:**
1. Verify Usage Access permission granted
2. Wait at least 1 hour (Android updates usage stats periodically)
3. Check device's Digital Wellbeing app to verify data is being collected
4. Restart the app and try again

### App Blocking Not Working

**Issue:** Blocked app still opens

**Solution:**
1. Verify SYSTEM_ALERT_WINDOW permission granted
2. Check if overlay permission was revoked
3. Try starting a new Quick Duel
4. Verify overlay appears when opening blocked app

---

## Development Workflow

### Running with Dev Server (Development Builds Only)

For development builds with hot-reload:

```bash
# Terminal 1: Start dev server
cd detox-duel
npm start

# Terminal 2: Build development APK
npm run build:dev

# Install development APK on device
# Scan QR code from terminal or download link

# On device:
# 1. Open Detox Duel development build
# 2. Shake device to open Dev Menu
# 3. Tap "Go to dev server"
# 4. Scan QR code from Terminal 1
```

### Rebuilding After Code Changes

For preview builds:

```bash
# Make code changes
cd detox-duel

# Commit changes (recommended)
git add .
git commit -m "Update features"

# Rebuild APK
npm run build:preview
```

---

## Testing Checklist

Before considering the app ready for testing:

- [ ] APK builds successfully with `npm run build:preview`
- [ ] APK installs on physical Android device
- [ ] Usage Access permission granted and verified
- [ ] System Alert Window permission granted and verified
- [ ] Notifications permission granted
- [ ] Quick Duel starts successfully
- [ ] Blocked app shows overlay when opened
- [ ] Other apps continue to work normally
- [ ] Timer counts down correctly
- [ ] Duel completes successfully
- [ ] Screen time data appears in Development Tools
- [ ] App doesn't crash when switching between apps
- [ ] App works correctly when minimized and reopened

---

## Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Android Permissions Guide](https://developer.android.com/guide/topics/permissions/overview)
- [Detox Duel README](../README.md)
- [EAS Build Guide](./EAS_BUILD_GUIDE.md)
- [Development Builds Guide](./DEVELOPMENT_BUILDS.md)

---

**Last updated:** 2026-05-19
**App version:** 1.0.0
**Expo SDK:** 54
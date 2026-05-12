# Development Builds Setup Guide

This guide explains how to set up development builds for the Detox Duel app to enable full `expo-notifications` functionality.

## Why Development Builds?

Since Expo SDK 53, push notification functionality was removed from Expo Go. Development builds provide:
- Full `expo-notifications` support
- Access to native modules without limitations
- Better performance for production-like testing

## Prerequisites

1. Install EAS CLI globally:
   ```bash
   npm install -g eas-cli
   ```

2. Login to your Expo account:
   ```bash
   eas login
   ```

3. Configure your project (if not already done):
   ```bash
   eas build:configure
   ```

## Building Development Clients

### For Android (Physical Device)

```bash
cd detox-duel
npm run dev:android
```

This will:
- Build an APK with development client
- Install on your connected Android device
- Provide a download link for manual installation

### For iOS (Physical Device)

```bash
cd detox-duel
npm run dev:ios
```

This will:
- Build an IPA with development client
- Require Apple Developer credentials
- Install on your connected iOS device via TestFlight or direct install

### For iOS Simulator

```bash
cd detox-duel
npm run dev:ios-sim
```

This will:
- Build a development build for iOS Simulator
- Faster than physical device builds
- No Apple Developer account required

## Running the Development Build

After building, you can run your app with the development build:

### Start the development server:
```bash
npm start
```

### Scan the QR code:
1. Open Expo Go (or your new development build)
2. Scan the QR code from the terminal
3. The app will load with full native module support

## Troubleshooting

### "expo-notifications not available" warning
- Make sure you're using the development build, not Expo Go
- The app should show "Expo Development Client" in the splash screen

### Build fails on iOS
- Ensure you have a valid Apple Developer account
- Check that your bundle identifier is configured correctly in app.json

### Build fails on Android
- Ensure your Android device has USB debugging enabled
- Check that you have the Android SDK installed

## Switching Back to Expo Go

If you need to test with Expo Go temporarily:
```bash
npm start
```

Then scan with Expo Go instead of the development build.

Note: Push notifications won't work with Expo Go.

## Next Steps

After setting up development builds, the app will have:
- ✅ Full push notification support
- ✅ Real-time challenge updates
- ✅ No more "functionality removed" warnings
- ✅ Production-like testing environment

For more information, visit: https://docs.expo.dev/develop/development-builds/introduction/

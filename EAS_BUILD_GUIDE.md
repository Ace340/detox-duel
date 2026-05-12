# EAS Build Instructions for Testing

## Install EAS CLI

```bash
npm install -g eas-cli
```

## Configure EAS (First Time Only)

```bash
cd detox-duel
eas build:configure
```

## Build Android APK

```bash
eas build --platform android --profile preview
```

This will:
- Create a standalone Android APK
- Include all native modules (expo-screen-time)
- Can be installed on any Android device

## Install APK on Device

1. Download the APK from the link provided
2. Transfer to your Android device
3. Install the APK
4. Grant the required permissions when prompted

## Testing with Standalone App

1. Open the installed app
2. Sign in with your Supabase account
3. Navigate to Profile → Development Tools → Test Screen Time Tracking
4. Follow the same testing steps as Expo Go

## Advantages of Standalone Build

- ✅ No need to keep computer running
- ✅ Works offline (except for Supabase auth)
- ✅ Better performance
- ✅ Easier to share for testing
- ✅ Full access to native permissions

## Disadvantages

- ⏱️ Build takes 10-30 minutes
- 📦 Larger download size
- 🔧 Need to rebuild for changes

## Rebuilding

After making code changes:

```bash
eas build --platform android --profile preview
```

The build will increment the version automatically.

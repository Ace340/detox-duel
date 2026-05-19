# expo-screen-time

Expo module for tracking app usage time on Android and iOS.

## Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| Android | ✅ Full support | Uses `UsageStatsManager` API |
| iOS | ⚠️ Mock data | Requires Apple's Family Controls entitlement |
| Web | ❌ Not supported | Not applicable |

## Installation

```bash
npm install expo-screen-time
# or
yarn add expo-screen-time
```

## Android Setup

### 1. Add Permission

The `PACKAGE_USAGE_STATS` permission is automatically added to your `AndroidManifest.xml` by this module.

### 2. Request Permission

Users must manually grant "Usage access" permission in system settings:

```typescript
import { ScreenTimeTracker } from './src/services/screenTimeTracker';

// Check if permission is granted
const hasPermission = await ScreenTimeTracker.checkPermission();

if (!hasPermission) {
  // Open system settings to request permission
  ScreenTimeTracker.requestPermission();
}
```

## iOS Setup

**Important**: iOS implementation requires Apple's [Family Controls](https://developer.apple.com/documentation/screen_time) entitlement, which needs special approval from Apple.

For now, this module returns mock data on iOS. To implement real screen time tracking:

1. Request Family Controls entitlement from Apple
2. Add the entitlement to your Apple Developer account
3. Implement `DeviceActivity` framework in `ExpoScreenTimeModule.swift`
4. Follow Apple's guidelines for parental control features

See `TODO` comments in `ios/ExpoScreenTimeModule.swift` for implementation details.

## Usage

### Basic Example

```typescript
import { ScreenTimeTracker } from './src/services/screenTimeTracker';

// Get usage for specific apps in the last 24 hours
const packageNames = [
  'com.instagram.android',
  'com.twitter.android',
  'com.facebook.katana'
];

const sinceTimestamp = Date.now() - 86400000; // 24 hours ago

const usage = await ScreenTimeTracker.getUsageForApps(
  packageNames,
  sinceTimestamp
);

console.log(usage);
// Output:
// {
//   "com.instagram.android": 3600,  // 1 hour
//   "com.twitter.android": 1800,    // 30 minutes
//   "com.facebook.katana": 900      // 15 minutes
// }
```

### Check Time Limit

```typescript
// Check if user exceeded a 2-hour limit for banned apps
const hasExceeded = await ScreenTimeTracker.hasExceededLimit(
  packageNames,
  sinceTimestamp,
  7200 // 2 hours in seconds
);

if (hasExceeded) {
  console.log('User exceeded time limit!');
}
```

### Get Total Usage

```typescript
const totalSeconds = await ScreenTimeTracker.getTotalUsage(
  packageNames,
  sinceTimestamp
);

const minutes = Math.floor(totalSeconds / 60);
const hours = Math.floor(minutes / 60);

console.log(`Total usage: ${hours}h ${minutes % 60}m`);
```

## API Reference

### `ScreenTimeTracker.checkPermission()`

Check if the app has permission to access usage stats.

**Returns:** `Promise<boolean>`

**Example:**
```typescript
const hasPermission = await ScreenTimeTracker.checkPermission();
```

### `ScreenTimeTracker.requestPermission()`

Open system settings to request usage stats permission.

**Returns:** `void`

**Example:**
```typescript
ScreenTimeTracker.requestPermission();
```

### `ScreenTimeTracker.getUsageForApps(packageNames, sinceTimestamp)`

Get screen time usage for specified apps since a given timestamp.

**Parameters:**
- `packageNames` (`string[]`): Array of package names to query
- `sinceTimestamp` (`number`): Timestamp in milliseconds since epoch

**Returns:** `Promise<AppUsageStats>` - Map of package name to total time in seconds

**Example:**
```typescript
const usage = await ScreenTimeTracker.getUsageForApps(
  ['com.instagram.android'],
  Date.now() - 86400000
);
```

### `ScreenTimeTracker.getTotalUsage(packageNames, sinceTimestamp)`

Get total screen time across all specified apps.

**Parameters:**
- `packageNames` (`string[]`): Array of package names to query
- `sinceTimestamp` (`number`): Timestamp in milliseconds since epoch

**Returns:** `Promise<number>` - Total time in seconds

**Example:**
```typescript
const total = await ScreenTimeTracker.getTotalUsage(
  ['com.instagram.android', 'com.twitter.android'],
  Date.now() - 86400000
);
```

### `ScreenTimeTracker.hasExceededLimit(packageNames, sinceTimestamp, limitSeconds)`

Check if user has exceeded time limit for banned apps.

**Parameters:**
- `packageNames` (`string[]`): Array of banned app package names
- `sinceTimestamp` (`number`): Timestamp in milliseconds since epoch
- `limitSeconds` (`number`): Time limit in seconds

**Returns:** `Promise<boolean>` - `true` if limit is exceeded

**Example:**
```typescript
const exceeded = await ScreenTimeTracker.hasExceededLimit(
  ['com.instagram.android'],
  Date.now() - 86400000,
  3600 // 1 hour limit
);
```

### `ScreenTimeTracker.isSupported()`

Check if screen time tracking is supported on current platform.

**Returns:** `boolean`

**Example:**
```typescript
if (!ScreenTimeTracker.isSupported()) {
  console.warn('Screen time tracking is not supported on this platform');
}
```

## Integration with Detox Duel

This module is designed to track screen time for banned apps during duels:

```typescript
import { ScreenTimeTracker } from './src/services/screenTimeTracker';
import { supabase } from './src/services/supabase';

// When a duel starts
const startDuel = async (duelId: string, bannedApps: string[]) => {
  const startTime = Date.now();

  // Track screen time periodically
  const interval = setInterval(async () => {
    const usage = await ScreenTimeTracker.getUsageForApps(
      bannedApps,
      startTime
    );

    const totalSeconds = Object.values(usage).reduce((sum, secs) => sum + secs, 0);

    // Update duel progress in Supabase
    await supabase
      .from('duel_participants')
      .update({ screen_time_seconds: totalSeconds })
      .eq('duel_id', duelId);

    // Check if limit is exceeded
    const duel = await supabase
      .from('duels')
      .select('*')
      .eq('id', duelId)
      .single();

    const limitSeconds = duel.duration_hours * 3600;

    if (totalSeconds > limitSeconds) {
      clearInterval(interval);
      // Handle limit exceeded
    }
  }, 60000); // Check every minute

  return interval;
};
```

## Android Permissions

The module automatically adds the following permission to your `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.PACKAGE_USAGE_STATS" />
```

This permission is classified as "special" and requires user to manually grant it in system settings.

## Common Package Names

Here are some common Android package names for popular apps:

| App | Package Name |
|-----|--------------|
| Instagram | `com.instagram.android` |
| Twitter | `com.twitter.android` |
| Facebook | `com.facebook.katana` |
| TikTok | `com.zhiliaoapp.musically` |
| YouTube | `com.google.android.youtube` |
| Netflix | `com.netflix.mediaclient` |
| Snapchat | `com.snapchat.android` |
| WhatsApp | `com.whatsapp` |
| Telegram | `org.telegram.messenger` |

## Troubleshooting

### Permission Not Granted

If `checkPermission()` returns `false`:

1. Call `requestPermission()` to open system settings
2. Find your app in the list
3. Enable "Allow usage access"

### No Usage Data Returned

If `getUsageForApps()` returns empty data:

1. Ensure the app has been granted usage access permission
2. Check that the app has actually been used in the specified time range
3. On Android, usage data may not be immediately available

### iOS Returns Mock Data

This is expected behavior. Real screen time tracking on iOS requires:
- Apple's Family Controls entitlement
- Approval from Apple
- Implementation of DeviceActivity framework

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

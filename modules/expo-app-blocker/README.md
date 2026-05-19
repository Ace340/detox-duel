# expo-app-blocker

Expo module for blocking apps on Android during duels.

## Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| Android | ✅ Full support | Uses AccessibilityService API |
| iOS | ❌ Not supported | iOS does not support app blocking via AccessibilityService |
| Web | ❌ Not supported | Not applicable |

## Installation

```bash
npm install expo-app-blocker
# or
yarn add expo-app-blocker
```

## Android Setup

### 1. Add Permissions

The `SYSTEM_ALERT_WINDOW` permission is automatically added to your `AndroidManifest.xml` by this module.

### 2. Enable Accessibility Service

Users must manually enable the Accessibility Service in system settings:

```typescript
import ExpoAppBlocker from 'expo-app-blocker';

// Start blocking when a duel begins
await ExpoAppBlocker.startBlocking(
  ['com.instagram.android', 'com.twitter.android'],
  'duel-id-123'
);

// Stop blocking when duel ends
await ExpoAppBlocker.stopBlocking();

// Check if blocking is active
const isActive = await ExpoAppBlocker.isBlockingActive();
```

## API Reference

### `startBlocking(packageNames, duelId)`

Start monitoring for banned apps.

**Parameters:**
- `packageNames` (`string[]`): Array of package names to block
- `duelId` (`string`): Identifier for the current duel

**Returns:** `Promise<void>`

**Example:**
```typescript
await ExpoAppBlocker.startBlocking(
  ['com.instagram.android', 'com.twitter.android'],
  'duel-id-123'
);
```

### `stopBlocking()`

Stop monitoring for banned apps.

**Returns:** `Promise<void>`

**Example:**
```typescript
await ExpoAppBlocker.stopBlocking();
```

### `isBlockingActive()`

Check if blocking is currently active.

**Returns:** `Promise<boolean>` - `true` if blocking is active

**Example:**
```typescript
const isActive = await ExpoAppBlocker.isBlockingActive();
console.log('Blocking active:', isActive);
```

## Common Package Names

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

## Integration with Detox Duel

This module is designed to block banned apps during duels:

```typescript
import ExpoAppBlocker from 'expo-app-blocker';

// When a duel starts
const startDuel = async (duelId: string, bannedApps: string[]) => {
  await ExpoAppBlocker.startBlocking(bannedApps, duelId);
};

// When a duel ends
const endDuel = async () => {
  await ExpoAppBlocker.stopBlocking();
};
```

## License

MIT
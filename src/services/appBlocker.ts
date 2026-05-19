import { Platform, PermissionsAndroid, Linking, Alert } from 'react-native';

import { BlockingState } from '../../modules/expo-app-blocker/src/AppBlocker.types';

/**
 * Lazy-load expo-app-blocker to avoid crashes in Expo Go.
 * Static imports evaluate native code at startup — lazy import defers
 * until first use and catches the failure gracefully.
 */

type AppBlockerModule = typeof import('expo-app-blocker');

let cachedModule: AppBlockerModule | null = null;
let loadAttempted = false;
let isAvailable = false;

async function getAppBlockerModule(): Promise<AppBlockerModule | null> {
  if (loadAttempted) return isAvailable ? cachedModule : null;
  loadAttempted = true;

  try {
    const mod = await import('expo-app-blocker');
    if (mod.default === null) {
      console.warn(
        'expo-app-blocker native module not available. ' +
        'App blocking requires a development build.'
      );
      return null;
    }
    cachedModule = mod;
    isAvailable = true;
    return mod;
  } catch {
    console.warn(
      'expo-app-blocker not available. ' +
      'App blocking requires a development build.'
    );
    return null;
  }
}

/**
 * App blocking service for Android duels
 *
 * Uses native module to block specified apps during active duels.
 * When a blocked app is opened, a blocking overlay is shown.
 *
 * On Android: Full support with Accessibility Service
 * On iOS: No-op (requires native permission patterns not available)
 * On Web: No-op (not supported)
 * In Expo Go: Returns safe defaults (native module not available)
 */
export class AppBlocker {
  /**
   * Check if the app has required permissions
   *
   * This checks two permissions:
   * 1. SYSTEM_ALERT_WINDOW - for displaying the blocking overlay
   * 2. Accessibility Service - for detecting app changes
   *
   * On Android: Checks both permissions and returns true only if both are granted
   * On iOS/Web: Returns false (not supported)
   *
   * @returns Promise<boolean> - true if all permissions are granted
   *
   * @example
   * ```typescript
   * const hasPermission = await AppBlocker.hasPermission();
   * if (!hasPermission) {
   *   await AppBlocker.requestPermission();
   * }
   * ```
   */
  static async hasPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    const mod = await getAppBlockerModule();
    if (!mod) {
      return false;
    }

    try {
      return await mod.default.hasPermission();
    } catch (error) {
      console.warn('Failed to check app blocker permissions:', error);
      return false;
    }
  }

  /**
   * Request required permissions from the user
   *
   * This method guides users to enable both required permissions:
   * 1. SYSTEM_ALERT_WINDOW - for displaying overlays
   * 2. Accessibility Service - for detecting app changes
   *
   * Both permissions must be manually enabled by the user in Android Settings.
   * This method opens the appropriate settings pages with clear instructions.
   *
   * On Android: Opens system settings with clear instructions
   * On iOS/Web: Logs warning and returns (not supported)
   *
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await AppBlocker.requestPermission();
   * // User is guided to enable permissions in settings
   * ```
   */
  static async requestPermission(): Promise<void> {
    if (Platform.OS !== 'android') {
      console.warn('App blocking is only available on Android');
      return;
    }

    const mod = await getAppBlockerModule();
    if (!mod) {
      console.warn('App blocking not available (requires development build)');
      return;
    }

    try {
      // Check SYSTEM_ALERT_WINDOW permission
      const hasSystemAlertPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.SYSTEM_ALERT_WINDOW
      );

      if (!hasSystemAlertPermission) {
        Alert.alert(
          'Permission Required',
          'Please enable "Draw over other apps" to block distracting apps during duels.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings()
            }
          ]
        );
        return;
      }

      // Check Accessibility Service and guide user if not enabled
      const hasAccessibilityPermission = await mod.default.hasPermission();

      if (!hasAccessibilityPermission) {
        Alert.alert(
          'Enable Accessibility Service',
          'To block apps during duels, you must enable the Detox Duel Accessibility Service.\n\n' +
          'Go to Settings → Accessibility → Detox Duel → Enable',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                Linking.sendIntent('android.settings.ACCESSIBILITY_SETTINGS');
              }
            }
          ]
        );
        return;
      }
    } catch (error) {
      console.warn('Failed to request app blocker permissions:', error);
    }
  }

  /**
   * Start blocking specified apps for a duel
   *
   * This method enables monitoring for the specified app package names.
   * When any of these apps are opened while blocking is active, a blocking
   * overlay will be displayed to the user.
   *
   * @param packageNames - Array of Android package names to block (e.g., ["com.instagram.android"])
   * @param duelId - The ID of the active duel
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await AppBlocker.startBlocking(
   *   ["com.instagram.android", "com.twitter.android"],
   *   "duel_123"
   * );
   * ```
   */
  static async startBlocking(packageNames: string[], duelId: string): Promise<void> {
    const mod = await getAppBlockerModule();
    if (!mod || Platform.OS === 'web') {
      console.warn('App blocking not available (requires development build)');
      return;
    }

    if (Platform.OS === 'ios') {
      console.warn('App blocking is not available on iOS');
      return;
    }

    try {
      // Validate inputs
      if (!packageNames || packageNames.length === 0) {
        throw new Error('Blocked package names list cannot be empty');
      }

      if (!duelId || duelId.trim().length === 0) {
        throw new Error('Duel ID cannot be empty');
      }

      await mod.default.startBlocking(packageNames, duelId);
    } catch (error) {
      console.error('Failed to start blocking:', error);
      throw error;
    }
  }

  /**
   * Stop all blocking and clear the blocking state
   *
   * This method disables all app blocking and clears the active duel state.
   * Call this when a duel ends or the user leaves the duel screen.
   *
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await AppBlocker.stopBlocking();
   * ```
   */
  static async stopBlocking(): Promise<void> {
    const mod = await getAppBlockerModule();
    if (!mod || Platform.OS === 'web') {
      console.warn('App blocking not available (requires development build)');
      return;
    }

    if (Platform.OS === 'ios') {
      console.warn('App blocking is not available on iOS');
      return;
    }

    try {
      await mod.default.stopBlocking();
    } catch (error) {
      console.error('Failed to stop blocking:', error);
      throw error;
    }
  }

  /**
   * Check if blocking is currently active
   *
   * This method returns the current blocking state, which includes:
   * - Whether blocking is active
   * - The current duel ID
   * - The list of blocked package names
   *
   * @returns Promise<boolean> - true if blocking is active
   *
   * @example
   * ```typescript
   * const isActive = await AppBlocker.isBlockingActive();
   * if (isActive) {
   *   console.log('Blocking is active for a duel');
   * }
   * ```
   */
  static async isBlockingActive(): Promise<boolean> {
    const mod = await getAppBlockerModule();
    if (!mod || Platform.OS === 'web') {
      return false;
    }

    if (Platform.OS === 'ios') {
      return false;
    }

    try {
      return await mod.default.isBlockingActive();
    } catch (error) {
      console.warn('Failed to check blocking state:', error);
      return false;
    }
  }

  /**
   * Get the current blocking state
   *
   * This method returns detailed information about the current blocking state,
   * including the active duel ID and list of blocked apps.
   *
   * @returns Promise<BlockingState> - The current blocking state
   *
   * @example
   * ```typescript
   * const state = await AppBlocker.getBlockingState();
   * console.log('Active duel:', state.duelId);
   * console.log('Blocked apps:', state.blockedApps);
   * ```
   */
  static async getBlockingState(): Promise<BlockingState> {
    const mod = await getAppBlockerModule();
    if (!mod || Platform.OS === 'web') {
      return {
        isActive: false,
        duelId: null,
        blockedApps: []
      };
    }

    if (Platform.OS === 'ios') {
      return {
        isActive: false,
        duelId: null,
        blockedApps: []
      };
    }

    try {
      return await mod.default.getBlockingState();
    } catch (error) {
      console.warn('Failed to get blocking state:', error);
      return {
        isActive: false,
        duelId: null,
        blockedApps: []
      };
    }
  }

  /**
   * Check if app blocking is supported on current platform
   *
   * @returns boolean - true if app blocking is supported (Android with native module)
   *
   * @example
   * ```typescript
   * if (AppBlocker.isSupported()) {
   *   // Enable app blocking features
   * }
   * ```
   */
  static isSupported(): boolean {
    return isAvailable && Platform.OS === 'android';
  }

  /**
   * Check if SYSTEM_ALERT_WINDOW permission is granted
   *
   * This is a helper method to specifically check the overlay permission
   * needed to display the blocking screen.
   *
   * @returns Promise<boolean> - true if permission is granted
   *
   * @example
   * ```typescript
   * const hasOverlayPermission = await AppBlocker.hasOverlayPermission();
   * if (!hasOverlayPermission) {
   *   // Guide user to enable it in settings
   * }
   * ```
   */
  static async hasOverlayPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      return await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.SYSTEM_ALERT_WINDOW
      );
    } catch (error) {
      console.warn('Failed to check overlay permission:', error);
      return false;
    }
  }

  /**
   * Check if Accessibility Service is enabled
   *
   * This is a helper method to specifically check if the Detox Duel
   * Accessibility Service is enabled in Android Settings.
   *
   * @returns Promise<boolean> - true if Accessibility Service is enabled
   *
   * @example
   * ```typescript
   * const hasAccessibilityPermission = await AppBlocker.hasAccessibilityPermission();
   * if (!hasAccessibilityPermission) {
   *   // Guide user to enable it in settings
   * }
   * ```
   */
  static async hasAccessibilityPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    const mod = await getAppBlockerModule();
    if (!mod) {
      return false;
    }

    try {
      return await mod.default.hasPermission();
    } catch (error) {
      console.warn('Failed to check accessibility permission:', error);
      return false;
    }
  }
}
import { Platform, Linking, Alert } from 'react-native';

import { BlockingConfig, BlockingState } from '../../modules/expo-app-blocker/src/AppBlocker.types';

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
 * Granular permission status for Android app blocking.
 * Both `overlay` and `accessibility` must be true for blocking to work.
 */
export interface PermissionStatus {
  /** SYSTEM_ALERT_WINDOW — can draw the blocking overlay over other apps */
  overlay: boolean;
  /** Accessibility Service — can detect when banned apps are opened */
  accessibility: boolean;
  /** Convenience: true only when both permissions are granted */
  allGranted: boolean;
}

/**
 * App blocking service for Android duels
 *
 * Uses native module to block specified apps during active duels.
 * When a blocked app is opened, a blocking overlay is shown.
 *
 * Two permissions are required:
 *   1. SYSTEM_ALERT_WINDOW (overlay) — to show the blocking screen on top of other apps
 *   2. Accessibility Service — to detect when the user switches to a banned app
 *
 * On Android: Full support with Accessibility Service
 * On iOS: No-op (requires native permission patterns not available)
 * On Web: No-op (not supported)
 * In Expo Go: Returns safe defaults (native module not available)
 */
export class AppBlocker {
  // ---------------------------------------------------------------
  // Permission helpers
  // ---------------------------------------------------------------

  /**
   * Check both required permissions independently.
   *
   * Returns a `PermissionStatus` so callers can tell exactly which
   * permission is missing and guide the user accordingly.
   */
  static async getPermissionStatus(): Promise<PermissionStatus> {
    if (Platform.OS !== 'android') {
      return { overlay: false, accessibility: false, allGranted: false };
    }

    // Check overlay via native module (Settings.canDrawOverlays).
    // PermissionsAndroid.PERMISSIONS.SYSTEM_ALERT_WINDOW is undefined —
    // SYSTEM_ALERT_WINDOW is an AppOps-level permission, not a standard
    // runtime permission, so React Native's PermissionsAndroid cannot
    // check it.  We must use the native Android API instead.
    let overlay = false;
    const overlayMod = await getAppBlockerModule();
    if (overlayMod) {
      try {
        overlay = await overlayMod.default.hasOverlayPermission();
      } catch (error) {
        console.warn('[AppBlocker] Failed to check overlay permission:', error);
      }
    }

    // Check accessibility (native module flag-file + Settings.Secure)
    let accessibility = false;
    const mod = await getAppBlockerModule();
    if (mod) {
      try {
        accessibility = await mod.default.hasPermission();
      } catch (error) {
        console.warn('[AppBlocker] Failed to check accessibility permission:', error);
      }
    }

    const allGranted = overlay && accessibility;

    console.debug(
      `[AppBlocker] Permission status: overlay=${overlay}, accessibility=${accessibility}, allGranted=${allGranted}`
    );

    return { overlay, accessibility, allGranted };
  }

  /**
   * Convenience: returns true only when BOTH permissions are granted.
   */
  static async hasPermission(): Promise<boolean> {
    const status = await AppBlocker.getPermissionStatus();
    return status.allGranted;
  }

  /**
   * Guide the user through enabling both required permissions.
   *
   * Checks each permission in order and shows a targeted alert for the
   * first missing one, so the user is never confused about what to do.
   *
   * Returns the current `PermissionStatus` after showing any alerts.
   */
  static async requestPermission(): Promise<PermissionStatus> {
    if (Platform.OS !== 'android') {
      console.warn('App blocking is only available on Android');
      return { overlay: false, accessibility: false, allGranted: false };
    }

    const status = await AppBlocker.getPermissionStatus();

    // Step 1: Overlay permission
    if (!status.overlay) {
      Alert.alert(
        'Permission Required: Display Over Other Apps',
        'Detox Duel needs permission to show a blocking screen over other apps.\n\n' +
        'Please enable "Display over other apps" (or "Draw over other apps") in Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => Linking.openSettings(),
          },
        ]
      );
      return status;
    }

    // Step 2: Accessibility service
    if (!status.accessibility) {
      Alert.alert(
        'Enable Accessibility Service',
        'To detect when you open banned apps, please enable the Detox Duel Accessibility Service.\n\n' +
        'Settings → Accessibility → Installed Services → Detox Duel App Blocker → Enable',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Accessibility Settings',
            onPress: () => {
              Linking.sendIntent('android.settings.ACCESSIBILITY_SETTINGS');
            },
          },
        ]
      );
      return status;
    }

    return status;
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
   * @param config - Supabase & duel metadata the AccessibilityService needs for violation reporting
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await AppBlocker.startBlocking(
   *   ["com.instagram.android", "com.twitter.android"],
   *   "duel_123",
   *   { supabaseUrl, supabaseKey, userId, duelType: "quick_duel", isQuickDuel: true }
   * );
   * ```
   */
  static async startBlocking(
    packageNames: string[],
    duelId: string,
    config: BlockingConfig,
  ): Promise<void> {
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

      await mod.default.startBlocking(packageNames, duelId, config);
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

    const mod = await getAppBlockerModule();
    if (!mod) {
      return false;
    }

    try {
      return await mod.default.hasOverlayPermission();
    } catch (error) {
      console.warn('[AppBlocker] Failed to check overlay permission:', error);
      return false;
    }
  }

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
      console.warn('[AppBlocker] Failed to check accessibility permission:', error);
      return false;
    }
  }
}
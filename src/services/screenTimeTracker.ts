import { Platform } from 'react-native';
import ExpoScreenTime from 'expo-screen-time';
import type { AppUsageStats } from 'expo-screen-time';

/**
 * Screen time tracking service for Android
 *
 * Uses native module to query Android's UsageStatsManager for app usage data.
 *
 * On iOS: Returns mock data (requires Apple's Family Controls entitlement)
 * On Android: Returns real screen time data from UsageStatsManager
 */
export class ScreenTimeTracker {
  /**
   * Check if the app has permission to access usage stats
   *
   * @returns Promise<boolean> - true if permission is granted
   */
  static async checkPermission(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }

    return ExpoScreenTime.checkPermission();
  }

  /**
   * Open system settings to request usage stats permission
   *
   * On Android: Opens "Usage access" settings
   * On iOS: No-op (requires special entitlement)
   */
  static requestPermission(): void {
    if (Platform.OS === 'web') {
      console.warn('Screen time tracking is not supported on web');
      return;
    }

    if (Platform.OS === 'ios') {
      console.warn(
        'iOS screen time tracking requires Apple Family Controls entitlement. ' +
        'See TODO in ExpoScreenTimeModule.swift for implementation details.'
      );
      return;
    }

    ExpoScreenTime.requestPermission();
  }

  /**
   * Get screen time usage for specified apps since a given timestamp
   *
   * @param packageNames - Array of package names to query (e.g., ["com.instagram.android", "com.twitter.android"])
   * @param sinceTimestamp - Timestamp in milliseconds since epoch
   * @returns Promise<AppUsageStats> - Map of package name to total time in seconds
   *
   * @example
   * ```typescript
   * const usage = await ScreenTimeTracker.getUsageForApps(
   *   ["com.instagram.android", "com.twitter.android"],
   *   Date.now() - 86400000 // Last 24 hours
   * );
   * // Returns: { "com.instagram.android": 3600, "com.twitter.android": 1800 }
   * ```
   */
  static async getUsageForApps(
    packageNames: string[],
    sinceTimestamp: number
  ): Promise<AppUsageStats> {
    if (Platform.OS === 'web') {
      console.warn('Screen time tracking is not supported on web');
      return {};
    }

    if (Platform.OS === 'ios') {
      console.warn(
        'iOS screen time tracking requires Apple Family Controls entitlement. ' +
        'Returning mock data for demonstration.'
      );
    }

    // Convert milliseconds to seconds for the native call (expects timestamp in ms)
    const usageStats = await ExpoScreenTime.getUsageForApps(
      packageNames,
      sinceTimestamp
    );

    // The native module returns time in milliseconds, convert to seconds
    return Object.entries(usageStats).reduce((acc, [packageName, ms]) => {
      acc[packageName] = Math.floor(ms / 1000);
      return acc;
    }, {} as AppUsageStats);
  }

  /**
   * Check if screen time tracking is supported on current platform
   */
  static isSupported(): boolean {
    return Platform.OS === 'android' || Platform.OS === 'ios';
  }

  /**
   * Get total screen time across all specified apps
   *
   * @param packageNames - Array of package names to query
   * @param sinceTimestamp - Timestamp in milliseconds since epoch
   * @returns Promise<number> - Total time in seconds
   */
  static async getTotalUsage(
    packageNames: string[],
    sinceTimestamp: number
  ): Promise<number> {
    const usageStats = await this.getUsageForApps(packageNames, sinceTimestamp);

    return Object.values(usageStats).reduce((total, seconds) => total + seconds, 0);
  }

  /**
   * Check if user has exceeded time limit for banned apps
   *
   * @param packageNames - Array of banned app package names
   * @param sinceTimestamp - Timestamp in milliseconds since epoch
   * @param limitSeconds - Time limit in seconds
   * @returns Promise<boolean> - true if limit is exceeded
   */
  static async hasExceededLimit(
    packageNames: string[],
    sinceTimestamp: number,
    limitSeconds: number
  ): Promise<boolean> {
    const totalUsage = await this.getTotalUsage(packageNames, sinceTimestamp);
    return totalUsage > limitSeconds;
  }
}

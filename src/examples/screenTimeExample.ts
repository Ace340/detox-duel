/**
 * Example usage of ScreenTimeTracker for Detox Duel
 *
 * This file demonstrates how to use the ScreenTimeTracker service
 * to monitor app usage during duels.
 */

import { ScreenTimeTracker } from '../services/screenTimeTracker';
import type { Duel } from '../types/duel';

/**
 * Example: Check permission and request if needed
 */
export async function ensureScreenTimePermission(): Promise<boolean> {
  const hasPermission = await ScreenTimeTracker.checkPermission();

  if (!hasPermission) {
    console.log('Screen time permission not granted. Requesting...');

    // Open system settings
    ScreenTimeTracker.requestPermission();

    // Note: User must manually grant permission in settings
    // You should show a UI prompt explaining this to the user
    console.log('Please grant "Usage access" permission in system settings');

    return false;
  }

  return true;
}

/**
 * Example: Start tracking screen time for a duel
 */
export async function startDuelScreenTimeTracking(
  duel: Duel
): Promise<void> {
  // Ensure permission is granted
  const hasPermission = await ensureScreenTimePermission();
  if (!hasPermission) {
    console.warn('Cannot track screen time without permission');
    return;
  }

  const startTime = Date.now();
  const bannedApps = duel.banned_apps;

  console.log(`Starting screen time tracking for duel ${duel.id}`);
  console.log(`Tracking apps: ${bannedApps.join(', ')}`);

  // Track screen time every minute
  const interval = setInterval(async () => {
    try {
      const usage = await ScreenTimeTracker.getUsageForApps(
        bannedApps,
        startTime
      );

      const totalSeconds = Object.values(usage).reduce((sum, secs) => sum + secs, 0);

      console.log(`Total screen time: ${totalSeconds} seconds`);

      // Update duel participant progress (you'd save this to Supabase)
      // await updateDuelProgress(duel.id, totalSeconds);

      // Check if limit is exceeded
      const limitSeconds = duel.duration_hours * 3600;
      if (totalSeconds > limitSeconds) {
        console.warn('Screen time limit exceeded!');
        clearInterval(interval);
        // Handle limit exceeded (end duel, notify user, etc.)
      }
    } catch (error) {
      console.error('Error tracking screen time:', error);
    }
  }, 60000); // Check every minute

  return interval;
}

/**
 * Example: Check if user exceeded time limit
 */
export async function checkDuelLimit(
  duel: Duel
): Promise<boolean> {
  if (!duel.started_at) {
    return false;
  }

  const startTime = new Date(duel.started_at).getTime();
  const limitSeconds = duel.duration_hours * 3600;

  const hasExceeded = await ScreenTimeTracker.hasExceededLimit(
    duel.banned_apps,
    startTime,
    limitSeconds
  );

  if (hasExceeded) {
    console.log(`User exceeded ${duel.duration_hours}h limit for banned apps`);
  }

  return hasExceeded;
}

/**
 * Example: Get detailed usage breakdown
 */
export async function getUsageBreakdown(
  packageNames: string[],
  hours: number = 24
): Promise<{ [packageName: string]: number }> {
  const sinceTimestamp = Date.now() - (hours * 3600 * 1000);

  const usage = await ScreenTimeTracker.getUsageForApps(
    packageNames,
    sinceTimestamp
  );

  // Format for display
  console.log('\n=== Usage Breakdown (Last 24h) ===');
  Object.entries(usage).forEach(([packageName, seconds]) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const displayHours = hours > 0 ? `${hours}h ` : '';
    const displayMinutes = hours > 0 ? `${minutes % 60}m` : `${minutes}m`;

    console.log(`${packageName}: ${displayHours}${displayMinutes}`);
  });

  return usage;
}

/**
 * Example: Common package names for popular apps
 */
export const COMMON_PACKAGE_NAMES = {
  instagram: 'com.instagram.android',
  twitter: 'com.twitter.android',
  facebook: 'com.facebook.katana',
  tiktok: 'com.zhiliaoapp.musically',
  youtube: 'com.google.android.youtube',
  netflix: 'com.netflix.mediaclient',
  snapchat: 'com.snapchat.android',
  whatsapp: 'com.whatsapp',
  telegram: 'org.telegram.messenger',
  reddit: 'com.reddit.frontpage',
};

/**
 * Example: Run a complete workflow
 */
export async function runScreenTimeExample(): Promise<void> {
  console.log('=== Screen Time Tracking Example ===\n');

  // 1. Check permission
  const hasPermission = await ScreenTimeTracker.checkPermission();
  console.log(`Has permission: ${hasPermission}`);

  // 2. Request if needed
  if (!hasPermission) {
    console.log('\nTo enable screen time tracking:');
    console.log('1. ScreenTimeTracker.requestPermission() will open settings');
    console.log('2. Find this app in the list');
    console.log('3. Enable "Allow usage access"');
    console.log('4. Return to the app\n');
    return;
  }

  // 3. Get usage for popular apps
  const popularApps = Object.values(COMMON_PACKAGE_NAMES);
  const usage = await getUsageBreakdown(popularApps, 24);

  // 4. Check total time
  const totalSeconds = await ScreenTimeTracker.getTotalUsage(
    popularApps,
    Date.now() - 86400000 // Last 24 hours
  );

  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);

  console.log(`\nTotal usage: ${totalHours}h ${totalMinutes % 60}m`);

  // 5. Check if exceeds 2-hour limit
  const exceededLimit = await ScreenTimeTracker.hasExceededLimit(
    popularApps,
    Date.now() - 86400000,
    7200 // 2 hours
  );

  console.log(`Exceeds 2-hour limit: ${exceededLimit ? 'Yes 😢' : 'No 🎉'}`);
}

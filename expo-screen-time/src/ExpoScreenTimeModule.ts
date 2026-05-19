import { NativeModule, requireNativeModule } from 'expo';

import { ScreenTimeEvents } from './ExpoScreenTime.types';
import { AppUsageStats } from './ExpoScreenTime.types';

declare class ExpoScreenTimeModule extends NativeModule<ScreenTimeEvents> {
  checkPermission(): boolean;
  requestPermission(): void;
  getUsageForApps(packageNames: string[], sinceTimestamp: number): Promise<AppUsageStats>;
}

// Returns null in Expo Go (no native module) instead of throwing.
let module: ExpoScreenTimeModule | null = null;
try {
  module = requireNativeModule<ExpoScreenTimeModule>('ExpoScreenTime');
} catch {
  // Native module not available (e.g. running in Expo Go)
}

export default module;

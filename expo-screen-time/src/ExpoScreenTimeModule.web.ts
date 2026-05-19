import { registerWebModule, NativeModule } from 'expo';

import type { ScreenTimeEvents } from './ExpoScreenTime.types';
import type { AppUsageStats } from './ExpoScreenTime.types';

class ExpoScreenTimeModule extends NativeModule<ScreenTimeEvents> {
  // Screen time tracking is not supported on web
  checkPermission(): boolean {
    return false;
  }

  requestPermission(): void {
    console.warn('Screen time tracking is not supported on web');
  }

  async getUsageForApps(_packageNames: string[], _sinceTimestamp: number): Promise<AppUsageStats> {
    console.warn('Screen time tracking is not supported on web');
    return {};
  }
}

export default registerWebModule(ExpoScreenTimeModule, 'ExpoScreenTimeModule');

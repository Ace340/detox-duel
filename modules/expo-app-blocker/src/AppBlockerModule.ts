import { NativeModule, requireNativeModule } from 'expo';

import { AppBlockerEvents, BlockingConfig, BlockingState } from './AppBlocker.types';

declare class ExpoAppBlockerModule extends NativeModule<AppBlockerEvents> {
  // Core blocking methods
  startBlocking(
    packageNames: string[],
    duelId: string,
    config: BlockingConfig,
  ): Promise<void>;
  stopBlocking(): Promise<void>;
  isBlockingActive(): Promise<boolean>;

  // Permission methods
  hasPermission(): Promise<boolean>;
  requestPermission(): Promise<void>;

  // Blocking state
  getBlockingState(): Promise<BlockingState>;
}

// Returns null in Expo Go (no native module) instead of throwing.
let module: ExpoAppBlockerModule | null = null;
try {
  module = requireNativeModule<ExpoAppBlockerModule>('ExpoAppBlocker');
} catch {
  // Native module not available (e.g. running in Expo Go)
}

export default module;
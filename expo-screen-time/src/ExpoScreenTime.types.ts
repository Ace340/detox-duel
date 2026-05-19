import type { StyleProp, ViewStyle } from 'react-native';

export type AppUsageStats = {
  [packageName: string]: number; // Map of package name to total time in milliseconds
};

export type ScreenTimeEvents = {
  // No events for now, but can be extended for real-time monitoring
};

// View-related types (keep for compatibility)
export type ExpoScreenTimeModuleEvents = ScreenTimeEvents;

export type ExpoScreenTimeViewProps = {
  style?: StyleProp<ViewStyle>;
};

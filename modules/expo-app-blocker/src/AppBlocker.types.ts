// App blocker module types
export type AppBlockerEvents = {
  // Events that can be emitted from the native module
  onBlockedAppOpened?: (data: { packageName: string; duelId: string }) => void;
};

export type BlockingState = {
  isActive: boolean;
  duelId: string | null;
  blockedApps: string[];
};
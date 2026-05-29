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

/**
 * Extra configuration passed to startBlocking so the AccessibilityService
 * can report violations to Supabase without needing the JS runtime.
 */
export type BlockingConfig = {
  /** Supabase project URL (e.g. https://xxx.supabase.co) */
  supabaseUrl: string;
  /** Supabase anon key (public, safe to store in SharedPreferences) */
  supabaseKey: string;
  /** Authenticated user ID for the Supabase PATCH */
  userId: string;
  /** Duel type label (e.g. "focus_sprint", "quick_duel") */
  duelType?: string;
  /** Whether this is a Quick Duel (instant loss on violation) */
  isQuickDuel?: boolean;
};
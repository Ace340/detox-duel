export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  created_at: string;
}

export interface FocusSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  duration_minutes: number;
  blocked_apps: string[];
  status: 'active' | 'completed' | 'cancelled';
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
}

export interface WeeklyScore {
  user_id: string;
  username: string;
  avatar_url?: string;
  total_focus_minutes: number;
  streak: number;
}

export interface AppInfo {
  name: string;
  package_name: string;
  icon?: string;
  selected: boolean;
}

// Export duel feature types
export * from './duel';

// =====================================================
// STREAKS TRACKING TYPES
// =====================================================

/**
 * User streak data from database
 */
export interface UserStreaks {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Streak milestone definition
 */
export interface Milestone {
  days: number;
  emoji: string;
  label: string;
}

/**
 * Result when checking for milestone
 */
export interface MilestoneResult {
  milestone: Milestone | null;
  reached: boolean;
}

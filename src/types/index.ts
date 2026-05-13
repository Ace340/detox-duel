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

// =====================================================
// BADGES SYSTEM TYPES
// =====================================================

/**
 * Badge data from badges table
 */
export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: string;
  condition: BadgeCondition;
  created_at: string;
  updated_at: string;
}

/**
 * Badge condition JSONB structure
 */
export interface BadgeCondition {
  sessions_completed?: number;
  streak_days?: number;
  duels_won?: number;
  friends_added?: number;
  leaderboard_position?: number;
  focus_hours?: number;
}

/**
 * User badge data from user_badges table
 */
export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
}

/**
 * User metrics for badge checking
 */
export interface UserMetrics {
  sessions_completed?: number;
  streak_days?: number;
  duels_won?: number;
  friends_added?: number;
  leaderboard_position?: number;
  focus_hours?: number;
}

// =====================================================
// NOTIFICATIONS SYSTEM TYPES
// =====================================================

/**
 * Notification type enumeration
 */
export type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'duel_challenge'
  | 'duel_result'
  | 'badge_earned'
  | 'streak_milestone'
  | 'weekly_summary';

/**
 * Notification data from database
 */
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, any>;
  read: boolean;
  from_user_id?: string;
  created_at: string;
  updated_at: string;
  from_username?: string; // Fetched from users table
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  id: string;
  user_id: string;
  duel_challenges: boolean;
  duel_results: boolean;
  badges: boolean;
  streaks: boolean;
  weekly_summary: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Notification data payload types
 */
export interface DuelChallengeData {
  duel_id: string;
  from_username?: string;
}

export interface DuelResultData {
  duel_id: string;
  won: boolean;
  score?: number;
}

export interface BadgeEarnedData {
  badge_id: string;
  badge_name: string;
  badge_emoji: string;
}

export interface StreakMilestoneData {
  days: number;
  emoji: string;
}

export interface FriendRequestData {
  from_user_id: string;
  from_username?: string;
}

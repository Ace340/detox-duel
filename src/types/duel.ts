/**
 * Duel Feature Type Definitions
 *
 * These types correspond to the Supabase tables created in create-duels-schema.sql
 * TypeScript interfaces use snake_case to match database column names directly
 */

// =====================================================
// ENUM TYPES
// =====================================================

/**
 * Type of duel match
 * - focus_sprint: Short duration focused session competition
 * - weekly_war: Week-long screen time reduction battle
 * - streak_battle: Competition based on maintaining streak days
 * - quick_duel: Rapid single-round challenge
 */
export type DuelType = 'focus_sprint' | 'weekly_war' | 'streak_battle' | 'quick_duel';

/**
 * Current status of a duel
 * - pending: Created but not started yet
 * - active: Currently in progress
 * - completed: Successfully finished with a winner
 * - cancelled: Cancelled by one of the participants
 * - expired: Time limit reached without completion
 */
export type DuelStatus = 'pending' | 'active' | 'completed' | 'cancelled' | 'expired';

/**
 * Type of reward earned from a duel
 * - streak_boost: Bonus multiplier for streak calculations
 * - badge: Achievement badge for profile
 */
export type RewardType = 'streak_boost' | 'badge';

// =====================================================
// DATABASE TYPES
// =====================================================

/**
 * JSON type for flexible data storage
 * Matches Supabase's generated Json type
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Represents a single duel between users
 */
export interface Duel {
  id: string;
  creator_id: string;
  opponent_id: string;
  duel_type: DuelType;
  status: DuelStatus;
  banned_apps: string[];
  duration_hours: number;
  started_at: string | null;
  ended_at: string | null;
  winner_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Data for creating a new duel
 */
export interface DuelInsert {
  creator_id: string;
  opponent_id: string;
  duel_type: DuelType;
  status?: DuelStatus;
  banned_apps?: string[];
  duration_hours: number;
  started_at?: string | null;
  ended_at?: string | null;
  winner_id?: string | null;
}

/**
 * Data for updating an existing duel
 */
export interface DuelUpdate {
  status?: DuelStatus;
  banned_apps?: string[];
  started_at?: string | null;
  ended_at?: string | null;
  winner_id?: string | null;
}

/**
 * Represents a user's participation in a duel
 */
export interface DuelParticipant {
  duel_id: string;
  user_id: string;
  screen_time_seconds: number;
  streak_days: number;
  is_loser: boolean;
  joined_at: string;
  updated_at: string;
}

/**
 * Data for creating a new duel participant
 */
export interface DuelParticipantInsert {
  duel_id: string;
  user_id: string;
  screen_time_seconds?: number;
  streak_days?: number;
  is_loser?: boolean;
}

/**
 * Data for updating a duel participant's progress
 */
export interface DuelParticipantUpdate {
  screen_time_seconds?: number;
  streak_days?: number;
  is_loser?: boolean;
}

/**
 * Represents a reward earned from completing a duel
 */
export interface DuelReward {
  duel_id: string;
  user_id: string;
  reward_type: RewardType;
  reward_data: Json;
  awarded_at: string;
}

/**
 * Data for creating a new duel reward
 */
export interface DuelRewardInsert {
  duel_id: string;
  user_id: string;
  reward_type: RewardType;
  reward_data?: Json;
}

/**
 * Data for updating a duel reward
 */
export interface DuelRewardUpdate {
  reward_data?: Json;
}

// =====================================================
// COMPOSITE TYPES
// =====================================================

/**
 * Duel with full participant information
 */
export interface DuelWithParticipants extends Duel {
  participants: Array<DuelParticipant & { username?: string; avatar_url?: string }>;
}

/**
 * Duel with rewards information
 */
export interface DuelWithRewards extends Duel {
  rewards: DuelReward[];
}

/**
 * Complete duel information with participants and rewards
 */
export interface DuelComplete extends Duel {
  participants: Array<DuelParticipant & { username?: string; avatar_url?: string }>;
  rewards: DuelReward[];
}

/**
 * Leaderboard entry for a duel
 */
export interface DuelLeaderboardEntry {
  user_id: string;
  username: string;
  screen_time_seconds: number;
  streak_days: number;
  is_loser: boolean;
}

/**
 * Active duel summary for a user
 */
export interface ActiveDuelSummary {
  id: string;
  creator_id: string;
  opponent_id: string;
  duel_type: DuelType;
  duration_hours: number;
  started_at: string | null;
  creator_username?: string;
  opponent_username?: string;
}

/**
 * Duel statistics for a user
 */
export interface DuelStats {
  totalDuels: number;
  wins: number;
  losses: number;
  currentStreak: number;
  longestStreak: number;
  totalRewards: number;
}

/**
 * A single duel history entry for display in the DuelHistoryScreen
 */
export interface DuelHistoryEntry {
  duel: Duel;
  opponentUsername: string;
  opponentAvatarUrl?: string;
  outcome: 'won' | 'lost' | 'draw';
  myScreenTimeSeconds: number;
  opponentScreenTimeSeconds: number;
  myStreakDays: number;
  opponentStreakDays: number;
  myRewards: DuelReward[];
}

/**
 * Leaderboard ranking entry computed from duel results
 */
export interface LeaderboardRanking {
  user_id: string;
  username: string;
  avatar_url?: string;
  totalWins: number;
  totalLosses: number;
  totalDuels: number;
  currentStreak: number;
  longestStreak: number;
  badgesEarned: number;
  winRate: number;
}

// =====================================================
// UTILITY TYPES
// =====================================================

/**
 * Status that indicates a duel can be started
 */
export type StartableDuelStatus = 'pending';

/**
 * Status that indicates a duel is in progress
 */
export type ActiveDuelStatus = 'active';

/**
 * Status that indicates a duel is finished
 */
export type FinishedDuelStatus = 'completed' | 'cancelled' | 'expired';

/**
 * Type guard to check if a duel is startable
 */
export function isDuelStartable(status: DuelStatus): status is StartableDuelStatus {
  return status === 'pending';
}

/**
 * Type guard to check if a duel is active
 */
export function isDuelActive(status: DuelStatus): status is ActiveDuelStatus {
  return status === 'active';
}

/**
 * Type guard to check if a duel is finished
 */
export function isDuelFinished(status: DuelStatus): status is FinishedDuelStatus {
  return ['completed', 'cancelled', 'expired'].includes(status);
}

/**
 * Calculate screen time in minutes from seconds
 */
export function screenTimeMinutes(seconds: number): number {
  return Math.floor(seconds / 60);
}

/**
 * Calculate screen time in hours from seconds
 */
export function screenTimeHours(seconds: number): number {
  return Math.floor(seconds / 3600);
}

/**
 * Format duel type for display
 */
export function formatDuelType(type: DuelType): string {
  const labels: Record<DuelType, string> = {
    focus_sprint: 'Focus Sprint',
    weekly_war: 'Weekly War',
    streak_battle: 'Streak Battle',
    quick_duel: 'Quick Duel',
  };
  return labels[type];
}

/**
 * Format duel status for display
 */
export function formatDuelStatus(status: DuelStatus): string {
  const labels: Record<DuelStatus, string> = {
    pending: 'Pending',
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
    expired: 'Expired',
  };
  return labels[status];
}

/**
 * Format reward type for display
 */
export function formatRewardType(type: RewardType): string {
  const labels: Record<RewardType, string> = {
    streak_boost: 'Streak Boost',
    badge: 'Badge',
  };
  return labels[type];
}

// =====================================================
// SCREEN TIME TRACKING TYPES
// =====================================================

/**
 * Screen time usage for a single app
 */
export interface AppScreenTime {
  packageName: string;
  appName: string;
  secondsUsed: number;
}

/**
 * Screen time tracking result for a duel
 */
export interface DuelScreenTimeResult {
  totalSeconds: number;
  apps: AppScreenTime[];
  timestamp: number;
}

/**
 * Permission status for screen time tracking
 */
export type ScreenTimePermissionStatus =
  | 'granted'
  | 'denied'
  | 'not_requested'
  | 'unsupported';

/**
 * Screen time tracking configuration for a duel
 */
export interface ScreenTimeConfig {
  bannedApps: string[];
  sinceTimestamp: number; // Milliseconds since epoch
  limitSeconds: number;
}

/**
 * Group Challenge Feature Type Definitions
 *
 * These types correspond to the Supabase tables created in group_challenges schema
 * TypeScript interfaces use snake_case to match database column names directly
 */

// =====================================================
// ENUM TYPES
// =====================================================

/**
 * Type of group challenge
 * - lowest_screen_time: Competition to reduce screen time the most
 * - most_focus_sessions: Competition to complete the most focus sessions
 * - longest_streak: Competition to maintain the longest consecutive streak
 */
export type ChallengeType = 'lowest_screen_time' | 'most_focus_sessions' | 'longest_streak';

/**
 * Current status of a group challenge
 * - pending: Created but not started yet
 * - active: Currently in progress
 * - completed: Successfully finished with winners determined
 */
export type ChallengeStatus = 'pending' | 'active' | 'completed';

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
 * Represents a single group challenge
 */
export interface GroupChallenge {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  challenge_type: ChallengeType;
  target_metric: number;
  start_date: string;
  end_date: string;
  status: ChallengeStatus;
  max_participants: number;
  created_at: string;
  updated_at: string;
}

/**
 * Data for creating a new group challenge
 */
export interface GroupChallengeInsert {
  creator_id: string;
  title: string;
  description?: string | null;
  challenge_type: ChallengeType;
  target_metric: number;
  start_date: string;
  end_date: string;
  status?: ChallengeStatus;
  max_participants: number;
}

/**
 * Data for updating an existing group challenge
 */
export interface GroupChallengeUpdate {
  title?: string;
  description?: string | null;
  target_metric?: number;
  status?: ChallengeStatus;
  max_participants?: number;
}

/**
 * Represents a user's participation in a group challenge
 */
export interface GroupChallengeParticipant {
  challenge_id: string;
  user_id: string;
  score: number;
  joined_at: string;
}

/**
 * Data for creating a new group challenge participant
 */
export interface GroupChallengeParticipantInsert {
  challenge_id: string;
  user_id: string;
  score?: number;
}

/**
 * Data for updating a group challenge participant's score
 */
export interface GroupChallengeParticipantUpdate {
  score?: number;
}

// =====================================================
// COMPOSITE TYPES
// =====================================================

/**
 * Minimal user information for display in challenges
 */
export interface User {
  id: string;
  email?: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
}

/**
 * Group challenge with full participant information
 */
export interface GroupChallengeWithParticipants extends GroupChallenge {
  participants: Array<GroupChallengeParticipant & { user: User }>;
}

/**
 * Leaderboard entry for a group challenge
 */
export interface GroupChallengeLeaderboard {
  rank: number;
  user: User;
  score: number;
  joined_at: string;
  is_creator: boolean;
}

// =====================================================
// UTILITY TYPES
// =====================================================

/**
 * Type guard to check if a challenge is startable
 */
export function isChallengeStartable(status: ChallengeStatus): boolean {
  return status === 'pending';
}

/**
 * Type guard to check if a challenge is active
 */
export function isChallengeActive(status: ChallengeStatus): boolean {
  return status === 'active';
}

/**
 * Type guard to check if a challenge is finished
 */
export function isChallengeFinished(status: ChallengeStatus): boolean {
  return status === 'completed';
}

/**
 * Format challenge type for display
 */
export function formatChallengeType(type: ChallengeType): string {
  const formats: Record<ChallengeType, string> = {
    lowest_screen_time: 'Lowest Screen Time',
    most_focus_sessions: 'Most Focus Sessions',
    longest_streak: 'Longest Streak',
  };
  return formats[type];
}

/**
 * Format challenge status for display
 */
export function formatChallengeStatus(status: ChallengeStatus): string {
  const formats: Record<ChallengeStatus, string> = {
    pending: 'Pending',
    active: 'Active',
    completed: 'Completed',
  };
  return formats[status];
}

/**
 * Calculate the number of days between start and end date
 */
export function calculateChallengeDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Points System Type Definitions
 *
 * These types correspond to the Supabase tables for the points and rank tier system
 * TypeScript interfaces use snake_case to match database column names directly
 */

// =====================================================
// TRANSACTION REASONS
// =====================================================

/**
 * Type-safe enumeration of valid point transaction reasons
 * Maps to the reason column in point_transactions table
 */
export type PointTransactionReason =
  | 'session_complete'
  | 'duel_win'
  | 'streak_milestone'
  | 'friend_added'
  | 'badge_earned';

// =====================================================
// DATABASE TYPES
// =====================================================

/**
 * Represents a single point transaction in the system
 * Corresponds to point_transactions table in Supabase
 */
export interface PointTransaction {
  id: string;
  user_id: string;
  amount: number;
  reason: PointTransactionReason;
  related_duel_id: string | null;
  related_session_id: string | null;
  created_at: string;
}

/**
 * Represents the current points state for a user
 * Corresponds to user_points table in Supabase
 */
export interface UserPoints {
  id: string;
  user_id: string;
  total_points: number;
  created_at: string;
  updated_at: string;
}

// =====================================================
// RANK TIER TYPES
// =====================================================

/**
 * Represents a rank tier with point range and display information
 */
export interface RankTier {
  name: string;
  emoji: string;
  minPoints: number;
  maxPoints: number;
}

/**
 * Rank tier key for RANK_TIERS constant
 */
export type RankTierKey = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

// =====================================================
// RANK TIER CONSTANTS
// =====================================================

/**
 * All available rank tiers with their point ranges and display information
 * Tiers are inclusive of minPoints and maxPoints values
 */
export const RANK_TIERS: Record<RankTierKey, RankTier> = {
  bronze: {
    name: 'Bronze',
    emoji: '🥉',
    minPoints: 0,
    maxPoints: 999,
  },
  silver: {
    name: 'Silver',
    emoji: '🥈',
    minPoints: 1000,
    maxPoints: 4999,
  },
  gold: {
    name: 'Gold',
    emoji: '🥇',
    minPoints: 5000,
    maxPoints: 14999,
  },
  platinum: {
    name: 'Platinum',
    emoji: '💎',
    minPoints: 15000,
    maxPoints: 49999,
  },
  diamond: {
    name: 'Diamond',
    emoji: '👑',
    minPoints: 50000,
    maxPoints: Infinity,
  },
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Get the rank tier for a given point value
 * Handles edge cases including negative points and infinity
 *
 * @param points - The total points to determine rank tier for
 * @returns The rank tier information for the given points
 *
 * @example
 * getRankTier(0)       // { name: 'Bronze', emoji: '🥉', minPoints: 0, maxPoints: 999 }
 * getRankTier(1200)    // { name: 'Silver', emoji: '🥈', minPoints: 1000, maxPoints: 4999 }
 * getRankTier(50000)   // { name: 'Diamond', emoji: '👑', minPoints: 50000, maxPoints: Infinity }
 * getRankTier(-100)    // { name: 'Bronze', emoji: '🥉', minPoints: 0, maxPoints: 999 }
 */
export function getRankTier(points: number): RankTier {
  // Handle edge cases: negative or non-finite points
  if (!Number.isFinite(points) || points < 0) {
    return RANK_TIERS.bronze;
  }

  // Find the matching tier by checking point ranges
  const tierKeys: RankTierKey[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
  const matchedTier = tierKeys.find(key => {
    const tier = RANK_TIERS[key];
    return points >= tier.minPoints && points <= tier.maxPoints;
  });

  // Default to diamond for very high points (shouldn't happen with Infinity check)
  return matchedTier ? RANK_TIERS[matchedTier] : RANK_TIERS.diamond;
}

/**
 * Calculate progress percentage towards the next rank tier
 * Returns 100 for diamond tier (maximum tier)
 *
 * @param points - Current total points
 * @returns Progress percentage from 0 to 100
 *
 * @example
 * getTierProgress(0)      // 0
 * getTierProgress(500)    // 50 (500/1000 to reach Silver)
 * getTierProgress(1200)   // 5 (200/4000 to reach Gold)
 * getTierProgress(50000)  // 100 (max tier)
 */
export function getTierProgress(points: number): number {
  // Handle edge cases: negative or non-finite points
  if (!Number.isFinite(points) || points < 0) {
    return 0;
  }

  const currentTier = getRankTier(points);

  // Diamond is maximum tier - always 100%
  if (currentTier.name === 'Diamond') {
    return 100;
  }

  // Find the next tier key
  const tierKeys: RankTierKey[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
  const currentIndex = tierKeys.findIndex(key => RANK_TIERS[key].name === currentTier.name);
  const nextTierKey = tierKeys[currentIndex + 1];

  if (!nextTierKey) {
    return 100;
  }

  const nextTier = RANK_TIERS[nextTierKey];
  const tierRange = nextTier.minPoints - currentTier.minPoints;
  const currentProgress = points - currentTier.minPoints;

  // Calculate percentage with bounds checking
  const progress = Math.max(0, Math.min(100, (currentProgress / tierRange) * 100));
  return Math.round(progress);
}
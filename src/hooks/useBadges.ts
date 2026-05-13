import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import type { Badge, UserBadge, UserMetrics } from '../types';
import { useBadgeMetrics } from './useBadgeMetrics';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface UseBadgesReturn {
  badges: Badge[] | null;
  userBadges: UserBadge[] | null;
  loading: boolean;
  error: string | null;
  newBadge: (Badge & { earned_at: string }) | null;
  fetchBadges: () => Promise<void>;
  fetchUserBadges: () => Promise<void>;
  checkAndAwardBadge: (badgeId: string, metrics: UserMetrics) => Promise<void>;
  checkAllBadges: () => Promise<void>;
  dismissNewBadge: () => void;
}

// =====================================================
// CUSTOM HOOK
// =====================================================

/**
 * useBadges Hook
 *
 * Custom hook for fetching and managing user badge data.
 * Handles badge fetching, user badges, badge checking and awarding, and realtime updates.
 *
 * @param userId - The user ID to fetch badges for (undefined if not authenticated)
 * @returns Badges data, user badges, state, and functions to manage badges
 *
 * @example
 * const { badges, userBadges, loading, checkAndAwardBadge } = useBadges(userId);
 *
 * // Check and award badge after user completes session
 * await checkAndAwardBadge(badgeId, { sessions_completed: 5 });
 */
export function useBadges(userId: string | undefined): UseBadgesReturn {
  const [badges, setBadges] = useState<Badge[] | null>(null);
  const [userBadges, setUserBadges] = useState<UserBadge[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newBadge, setNewBadge] = useState<(Badge & { earned_at: string }) | null>(null);

  /**
   * Fetch all badges from badges table
   */
  const fetchBadges = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('badges')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setBadges(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch user's earned badges with earned_at timestamp, ordered by earned_at DESC
   */
  const fetchUserBadges = useCallback(async () => {
    if (!userId) {
      setUserBadges(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setUserBadges(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Check badge conditions against user metrics and award if met
   *
   * @param badgeId - The badge ID to check
   * @param metrics - User's current metrics
   */
  const checkAndAwardBadge = useCallback(
    async (badgeId: string, metrics: UserMetrics) => {
      if (!userId) {
        setError('User ID is required');
        return;
      }

      try {
        setError(null);

        // Fetch the badge to check its conditions
        const { data: badge, error: fetchError } = await supabase
          .from('badges')
          .select('*')
          .eq('id', badgeId)
          .single();

        if (fetchError) {
          setError(fetchError.message);
          return;
        }

        if (!badge) {
          setError('Badge not found');
          return;
        }

        // Extract condition values
        const {
          sessions_completed: requiredSessions,
          streak_days: requiredStreak,
          duels_won: requiredDuels,
          friends_added: requiredFriends,
          leaderboard_position: requiredPosition,
          focus_hours: requiredHours,
        } = badge.condition;

        // Check if all required conditions are met
        const conditionsMet =
          (!requiredSessions || (metrics.sessions_completed ?? 0) >= requiredSessions) &&
          (!requiredStreak || (metrics.streak_days ?? 0) >= requiredStreak) &&
          (!requiredDuels || (metrics.duels_won ?? 0) >= requiredDuels) &&
          (!requiredFriends || (metrics.friends_added ?? 0) >= requiredFriends) &&
          (!requiredPosition || (metrics.leaderboard_position ?? Infinity) <= requiredPosition) &&
          (!requiredHours || (metrics.focus_hours ?? 0) >= requiredHours);

        if (!conditionsMet) {
          // Badge conditions not met, do nothing
          return;
        }

        // Check if user already has this badge
        const { data: existingBadge } = await supabase
          .from('user_badges')
          .select('*')
          .eq('user_id', userId)
          .eq('badge_id', badgeId)
          .single();

        if (existingBadge) {
          // User already has this badge
          return;
        }

        // Award the badge
        const { data: newUserBadge, error: insertError } = await supabase
          .from('user_badges')
          .insert([
            {
              user_id: userId,
              badge_id: badgeId,
            },
          ])
          .select('*')
          .single();

        if (insertError) {
          // Handle unique constraint violation (badge already exists)
          if (insertError.code === '23505') {
            // Badge already exists, ignore
            return;
          }
          setError(insertError.message);
          return;
        }

        // Set newBadge state to trigger celebration
        if (newUserBadge && badges) {
          const awardedBadge = badges.find((b) => b.id === badgeId);
          if (awardedBadge) {
            setNewBadge({
              ...awardedBadge,
              earned_at: newUserBadge.earned_at,
            });
          }
        }

        // Update userBadges list
        await fetchUserBadges();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    },
    [userId, badges, fetchUserBadges]
  );

  // Initialize badge metrics hook
  const { fetchUserMetrics } = useBadgeMetrics(userId);

  /**
   * Check all unearned badges and award any that meet conditions
   *
   * This is the main function to call after user actions:
   * - After completing a focus session
   * - After winning a duel
   * - After adding a friend
   * - After reaching leaderboard position
   *
   * Fetches user's current metrics and checks all badges they haven't earned yet.
   * Awards any badges that meet the conditions.
   *
   * Note: This is a fire-and-forget operation. Errors are logged but don't block the calling flow.
   */
  const checkAllBadges = useCallback(async () => {
    if (!userId || !badges || !userBadges) {
      return;
    }

    try {
      // Fetch user's current metrics
      const metrics = await fetchUserMetrics();

      // Get badges user hasn't earned yet
      const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));
      const unearnedBadges = badges.filter(badge => !earnedBadgeIds.has(badge.id));

      if (unearnedBadges.length === 0) {
        // All badges earned, nothing to check
        return;
      }

      // Check each unearned badge in parallel
      await Promise.all(
        unearnedBadges.map(badge =>
          checkAndAwardBadge(badge.id, metrics)
        )
      );
    } catch (err) {
      // Log error but don't break the calling flow
      console.error('Error checking badges:', err);
    }
  }, [userId, badges, userBadges, fetchUserMetrics, checkAndAwardBadge]);

  /**
   * Dismiss the new badge celebration
   *
   * Clears the newBadge state to hide the celebration popup.
   */
  const dismissNewBadge = useCallback(() => {
    setNewBadge(null);
  }, []);

  /**
   * Fetch badges and user badges on mount, and set up realtime subscription
   */
  useEffect(() => {
    // Fetch initial data
    fetchBadges();
    fetchUserBadges();

    // Set up realtime subscription for new badges
    const channel = supabase
      .channel('user_badges_insert')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_badges',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          // New badge awarded, fetch full badge details
          const { data: badge } = await supabase
            .from('badges')
            .select('*')
            .eq('id', payload.new.badge_id)
            .single();

          if (badge) {
            setNewBadge({
              ...badge,
              earned_at: payload.new.earned_at,
            });
          }

          // Refresh user badges list
          fetchUserBadges();
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchBadges, fetchUserBadges]);

  return {
    badges,
    userBadges,
    loading,
    error,
    newBadge,
    fetchBadges,
    fetchUserBadges,
    checkAndAwardBadge,
    checkAllBadges,
    dismissNewBadge,
  };
}

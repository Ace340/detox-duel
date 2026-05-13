import { useCallback } from 'react';
import { supabase } from '../services/supabase';
import type { UserMetrics } from '../types';

/**
 * useBadgeMetrics Hook
 *
 * Helper hook to fetch user's current metrics for badge checking.
 * Aggregates data from multiple sources (sessions, duels, friendships, streaks, focus time).
 *
 * @param userId - The user ID to fetch metrics for
 * @returns Object with fetchUserMetrics function and loading state
 *
 * @example
 * const { fetchUserMetrics } = useBadgeMetrics(userId);
 * const metrics = await fetchUserMetrics();
 * // metrics = { sessions_completed: 10, duels_won: 2, ... }
 */
export function useBadgeMetrics(userId: string | undefined) {
  /**
   * Fetch user's current metrics for badge checking
   *
   * Queries multiple tables in parallel to get:
   * - Total completed sessions (from focus_sessions)
   * - Total duels won (from duel_participants where is_loser=false)
   * - Total friends added (from friendships where status='accepted')
   * - Current streak (from user_streaks)
   * - Total focus hours (from focus_sessions, sum of duration_minutes / 60)
   *
   * @returns Promise resolving to UserMetrics object
   */
  const fetchUserMetrics = useCallback(async (): Promise<UserMetrics> => {
    if (!userId) {
      console.error('fetchUserMetrics: userId is required');
      return {};
    }

    try {
      // Fetch all metrics in parallel for efficiency
      const [
        sessionsResult,
        duelsResult,
        friendshipsResult,
        streaksResult,
      ] = await Promise.all([
        // Fetch completed sessions
        supabase
          .from('focus_sessions')
          .select('id, duration_minutes')
          .eq('user_id', userId)
          .eq('status', 'completed'),

        // Fetch duels won (is_loser=false)
        supabase
          .from('duel_participants')
          .select('id')
          .eq('user_id', userId)
          .eq('is_loser', false),

        // Fetch accepted friendships
        supabase
          .from('friendships')
          .select('id')
          .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
          .eq('status', 'accepted'),

        // Fetch current streak
        supabase
          .from('user_streaks')
          .select('current_streak')
          .eq('user_id', userId)
          .single(),
      ]);

      const { data: sessions, error: sessionsError } = sessionsResult;
      const { data: duels, error: duelsError } = duelsResult;
      const { data: friendships, error: friendshipsError } = friendshipsResult;
      const { data: streaks, error: streaksError } = streaksResult;

      // Log errors but continue with partial data
      if (sessionsError) console.error('Error fetching sessions:', sessionsError);
      if (duelsError) console.error('Error fetching duels:', duelsError);
      if (friendshipsError) console.error('Error fetching friendships:', friendshipsError);
      if (streaksError && streaksError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is ok for new users
        console.error('Error fetching streaks:', streaksError);
      }

      // Calculate metrics
      const sessions_completed = sessions?.length ?? 0;
      const duels_won = duels?.length ?? 0;
      const friends_added = friendships?.length ?? 0;
      const streak_days = streaks?.current_streak ?? 0;

      // Calculate total focus hours (sum of duration_minutes / 60)
      const totalMinutes = sessions?.reduce((sum, session) => sum + (session.duration_minutes || 0), 0) ?? 0;
      const focus_hours = Math.floor(totalMinutes / 60);

      return {
        sessions_completed,
        duels_won,
        friends_added,
        streak_days,
        focus_hours,
      };
    } catch (err) {
      console.error('Error fetching user metrics:', err);
      return {};
    }
  }, [userId]);

  return {
    fetchUserMetrics,
  };
}

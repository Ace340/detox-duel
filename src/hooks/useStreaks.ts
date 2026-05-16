import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import {
  calculateStreak,
  isStreakBroken,
  checkMilestoneReached,
  getActiveDatesForMonth,
  type Milestone,
} from '../utils/streakCalculator';
import type { UserStreaks } from '../types';
import { usePoints } from './usePoints';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface UseStreaksReturn {
  streaks: UserStreaks | null;
  loading: boolean;
  error: string | null;
  milestone: Milestone | null;
  fetchStreaks: () => Promise<void>;
  updateStreaks: (activityDate: Date) => Promise<void>;
  checkStreakBroken: () => Promise<boolean>;
}

// =====================================================
// CUSTOM HOOK
// =====================================================

/**
 * useStreaks Hook
 *
 * Custom hook for fetching and updating user streak data.
 * Handles streak calculations, milestone detection, and streak break detection.
 *
 * @param userId - The user ID to fetch streaks for
 * @returns Streaks data and functions to update/check streaks
 *
 * @example
 * const { streaks, loading, updateStreaks } = useStreaks(userId);
 *
 * // Update streaks after activity
 * await updateStreaks(new Date());
 */
export function useStreaks(userId: string): UseStreaksReturn {
  const [streaks, setStreaks] = useState<UserStreaks | null>(null);
  const [previousStreak, setPreviousStreak] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [milestone, setMilestone] = useState<Milestone | null>(null);

  // Initialize points management
  const { awardPoints } = usePoints(userId);

  /**
   * Fetch user's current streak data from database
   */
  const fetchStreaks = useCallback(async () => {
    if (!userId) {
      setError('User ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        // Handle case where streaks don't exist yet
        if (fetchError.code === 'PGRST116') {
          // No streaks record found, create initial record
          const { data: newStreaks, error: insertError } = await supabase
            .from('user_streaks')
            .insert([
              {
                user_id: userId,
                current_streak: 0,
                longest_streak: 0,
                last_active_date: null,
              },
            ])
            .select()
            .single();

          if (insertError) {
            setError(insertError.message);
          } else {
            setStreaks(newStreaks);
          }
        } else {
          setError(fetchError.message);
        }
      } else {
        setStreaks(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Update streaks after user activity
   * Recalculates streak based on recent activity dates
   */
  const updateStreaks = useCallback(
    async (activityDate: Date) => {
      if (!userId) {
        setError('User ID is required');
        return;
      }

      try {
        setError(null);

        // Fetch recent activity dates (last 60 days)
        const activeDates = await getActiveDatesForMonth(userId, 60);

        // Calculate new streak
        const newStreak = calculateStreak(activeDates);

        // Get current streaks record
        let currentStreaks = streaks;

        if (!currentStreaks) {
          // Fetch if not loaded
          const { data, error: fetchError } = await supabase
            .from('user_streaks')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (fetchError && fetchError.code === 'PGRST116') {
            // Create new record
            const { data: newRecord } = await supabase
              .from('user_streaks')
              .insert([
                {
                  user_id: userId,
                  current_streak: 0,
                  longest_streak: 0,
                  last_active_date: null,
                },
              ])
              .select()
              .single();

            currentStreaks = newRecord;
          } else if (fetchError) {
            setError(fetchError.message);
            return;
          } else {
            currentStreaks = data;
          }
        }

        if (!currentStreaks) {
          setError('Failed to fetch or create streaks record');
          return;
        }

        // Check for milestone reached
        const milestoneReached = checkMilestoneReached(
          currentStreaks.current_streak,
          newStreak
        );

        if (milestoneReached) {
          setMilestone(milestoneReached);

          // Award points for streak milestone: 50 points per milestone level
          const milestoneLevel = Math.floor(milestoneReached.days / 3);
          const points = milestoneLevel * 50;
          awardPoints(points, 'streak_milestone').catch((error) => {
            console.error('Failed to award points for streak milestone:', error);
          });
        }

        // Update longest streak if needed
        const newLongestStreak = Math.max(
          currentStreaks.longest_streak,
          newStreak
        );

        // Normalize activity date to midnight
        const normalizedDate = new Date(activityDate);
        normalizedDate.setHours(0, 0, 0, 0);

        // Update streaks record
        const { data: updatedStreaks, error: updateError } = await supabase
          .from('user_streaks')
          .update({
            current_streak: newStreak,
            longest_streak: newLongestStreak,
            last_active_date: normalizedDate.toISOString().split('T')[0],
          })
          .eq('user_id', userId)
          .select()
          .single();

        if (updateError) {
          setError(updateError.message);
        } else {
          setStreaks(updatedStreaks);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    },
    [userId, streaks]
  );

  /**
   * Check if user's streak is broken
   * Compares last_active_date with today
   */
  const checkStreakBroken = useCallback(async (): Promise<boolean> => {
    if (!streaks || !streaks.last_active_date) {
      return false; // No streak to break
    }

    const lastActiveDate = new Date(streaks.last_active_date);
    const broken = isStreakBroken(lastActiveDate);

    if (broken) {
      // Save previous streak for notification
      setPreviousStreak(streaks.current_streak);

      // Reset streak in database
      const { error: updateError } = await supabase
        .from('user_streaks')
        .update({
          current_streak: 0,
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error resetting streak:', updateError);
      } else {
        setStreaks({ ...streaks, current_streak: 0 });
      }
    }

    return broken;
  }, [streaks, userId]);

  /**
   * Fetch streaks on mount
   */
  useEffect(() => {
    fetchStreaks();
  }, [fetchStreaks]);

  return {
    streaks,
    loading,
    error,
    milestone,
    fetchStreaks,
    updateStreaks,
    checkStreakBroken,
  };
}

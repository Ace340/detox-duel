/**
 * Streak Calculator Utility
 *
 * Pure functions for calculating user activity streaks and milestones.
 * All functions are pure: same input = same output, no side effects.
 */

import { supabase } from '../services/supabase';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

/**
 * Represents a streak milestone
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

/**
 * Activity record from database
 */
interface ActivityRecord {
  date: string;
  type: 'focus_session' | 'duel_win';
}

// =====================================================
// CONSTANTS
// =====================================================

/**
 * Milestone definitions for streak celebrations
 */
export const MILESTONES: Milestone[] = [
  { days: 3, emoji: '🔥', label: '3-Day Streak' },
  { days: 7, emoji: '⚡', label: 'Week Warrior' },
  { days: 14, emoji: '💎', label: '2-Week Champion' },
  { days: 30, emoji: '👑', label: '30-Day Legend' },
];

/**
 * One day in milliseconds
 */
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// =====================================================
// PURE FUNCTIONS
// =====================================================

/**
 * Calculate consecutive days from a list of activity dates
 *
 * @param activeDates - List of dates when user was active
 * @returns Number of consecutive days in current streak
 *
 * @example
 * calculateStreak([
 *   new Date('2026-05-10'),
 *   new Date('2026-05-11'),
 *   new Date('2026-05-12')
 * ]); // Returns 3
 */
export const calculateStreak = (activeDates: Date[]): number => {
  if (activeDates.length === 0) {
    return 0;
  }

  // Sort dates descending (newest first)
  const sortedDates = [...activeDates].sort((a, b) =>
    b.getTime() - a.getTime()
  );

  // Normalize dates to midnight to ignore time components
  const normalizedDates = sortedDates.map(date => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  });

  // Remove duplicate dates (same day, different times)
  const uniqueDates = Array.from(new Set(normalizedDates.map(d => d.getTime())))
    .map(timestamp => new Date(timestamp))
    .sort((a, b) => b.getTime() - a.getTime());

  let streak = 1;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  // Check if latest activity is today or yesterday
  const daysSinceLatestActivity =
    (currentDate.getTime() - uniqueDates[0].getTime()) / ONE_DAY_MS;

  if (daysSinceLatestActivity > 1) {
    return 0; // Streak broken
  }

  // Count consecutive days
  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const current = uniqueDates[i];
    const next = uniqueDates[i + 1];

    const daysDifference = (current.getTime() - next.getTime()) / ONE_DAY_MS;

    if (daysDifference <= 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

/**
 * Check if a streak is broken based on last active date
 *
 * @param lastActiveDate - The last date user was active
 * @param today - Today's date (defaults to current date)
 * @returns True if streak is broken, false otherwise
 *
 * @example
 * isStreakBroken(new Date('2026-05-10'), new Date('2026-05-12')); // Returns true
 */
export const isStreakBroken = (
  lastActiveDate: Date | null,
  today: Date = new Date()
): boolean => {
  if (!lastActiveDate) {
    return true; // No activity ever, streak is broken
  }

  const normalizedToday = new Date(today);
  normalizedToday.setHours(0, 0, 0, 0);

  const normalizedLastActive = new Date(lastActiveDate);
  normalizedLastActive.setHours(0, 0, 0, 0);

  const daysSinceLastActivity =
    (normalizedToday.getTime() - normalizedLastActive.getTime()) / ONE_DAY_MS;

  return daysSinceLastActivity > 1;
};

/**
 * Get milestone information for a given streak count
 *
 * @param streak - Current streak count
 * @returns Milestone information or null if not a milestone
 *
 * @example
 * getMilestone(3); // Returns { milestone: { days: 3, emoji: '🔥', label: '3-Day Streak' }, reached: true }
 * getMilestone(5); // Returns { milestone: null, reached: false }
 */
export const getMilestone = (streak: number): MilestoneResult => {
  const milestone = MILESTONES.find(m => m.days === streak);

  if (milestone) {
    return {
      milestone,
      reached: true,
    };
  }

  return {
    milestone: null,
    reached: false,
  };
};

/**
 * Check if previous milestone was just reached
 *
 * @param previousStreak - Previous streak count
 * @param newStreak - New streak count
 * @returns Milestone if reached, null otherwise
 *
 * @example
 * checkMilestoneReached(2, 3); // Returns { days: 3, emoji: '🔥', label: '3-Day Streak' }
 * checkMilestoneReached(3, 4); // Returns null (not a milestone)
 */
export const checkMilestoneReached = (
  previousStreak: number,
  newStreak: number
): Milestone | null => {
  const milestone = MILESTONES.find(m => m.days === newStreak);

  if (milestone && newStreak > previousStreak) {
    return milestone;
  }

  return null;
};

/**
 * Get unique activity dates for a user within a date range
 *
 * @param userId - User ID to fetch activity for
 * @param days - Number of days to look back (default: 30)
 * @returns Promise resolving to array of unique activity dates
 *
 * @example
 * const dates = await getActiveDatesForMonth('user-123', 30);
 */
export const getActiveDatesForMonth = async (
  userId: string,
  days: number = 30
): Promise<Date[]> => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    // Fetch focus sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('focus_sessions')
      .select('end_time')
      .eq('user_id', userId)
      .gte('end_time', startDate.toISOString())
      .lte('end_time', endDate.toISOString())
      .order('end_time', { ascending: false });

    if (sessionsError) {
      console.error('Error fetching focus sessions:', sessionsError);
      return [];
    }

    // Fetch duel wins (duel_participants where is_loser = false)
    const { data: duels, error: duelsError } = await supabase
      .from('duel_participants')
      .select('created_at')
      .eq('user_id', userId)
      .eq('is_loser', false)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (duelsError) {
      console.error('Error fetching duels:', duelsError);
      return [];
    }

    // Combine and extract unique dates
    const sessionDates = sessions
      ?.map(s => new Date(s.end_time || s.created_at))
      .filter(d => !isNaN(d.getTime())) || [];

    const duelDates = duels
      ?.map(d => new Date(d.created_at))
      .filter(d => !isNaN(d.getTime())) || [];

    const allDates = [...sessionDates, ...duelDates];

    // Normalize to midnight and remove duplicates
    const uniqueDatesMap = new Map<number, Date>();

    allDates.forEach(date => {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      const timestamp = normalized.getTime();
      uniqueDatesMap.set(timestamp, normalized);
    });

    return Array.from(uniqueDatesMap.values());
  } catch (error) {
    console.error('Error fetching active dates:', error);
    return [];
  }
};

/**
 * Calculate next milestone for user
 *
 * @param currentStreak - Current streak count
 * @returns Next milestone or null if user has reached all milestones
 *
 * @example
 * getNextMilestone(5); // Returns { days: 7, emoji: '⚡', label: 'Week Warrior' }
 * getNextMilestone(30); // Returns null (all milestones reached)
 */
export const getNextMilestone = (currentStreak: number): Milestone | null => {
  const nextMilestone = MILESTONES.find(m => m.days > currentStreak);

  return nextMilestone || null;
};

/**
 * Calculate progress to next milestone
 *
 * @param currentStreak - Current streak count
 * @returns Progress percentage (0-100) or 100 if all milestones reached
 *
 * @example
 * getMilestoneProgress(5); // Returns 71.43 (5/7 * 100)
 * getMilestoneProgress(30); // Returns 100
 */
export const getMilestoneProgress = (currentStreak: number): number => {
  const previousMilestone =
    MILESTONES.filter(m => m.days <= currentStreak).pop() || null;
  const nextMilestone = getNextMilestone(currentStreak);

  if (!nextMilestone) {
    return 100; // All milestones reached
  }

  const startDay = previousMilestone ? previousMilestone.days : 0;
  const totalDays = nextMilestone.days - startDay;
  const progressDays = currentStreak - startDay;

  return Math.min(100, Math.max(0, (progressDays / totalDays) * 100));
};

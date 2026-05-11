import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import type { Duel, DuelStatus, DuelType } from '../types/duel';

/**
 * Represents a duel with opponent information
 */
export interface DuelWithOpponent extends Duel {
  opponent_username?: string;
  opponent_avatar_url?: string;
}

/**
 * Represents a participant's progress in a duel
 */
export interface DuelParticipantProgress {
  duel_id: string;
  user_id: string;
  screen_time_seconds: number;
  streak_days: number;
  is_loser: boolean;
}

/**
 * Result of who is currently winning a duel
 */
export interface DuelWinner {
  userId: string | null;
  isUser: boolean;
}

/**
 * Grouped duels by status
 */
export interface GroupedDuels {
  pending: DuelWithOpponent[];
  active: DuelWithOpponent[];
  completed: DuelWithOpponent[];
}

/**
 * Custom hook for loading and managing user's duels
 * Fetches duels where user is creator or opponent, groups by status
 *
 * @param userId - The ID of the user to fetch duels for
 * @returns Object containing grouped duels, loading state, error, and refresh function
 */
export function useMyDuels(userId: string) {
  const [duels, setDuels] = useState<GroupedDuels>({
    pending: [],
    active: [],
    completed: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Loads and groups duels by status
   * - Pending: incoming/outgoing challenges waiting for response
   * - Active: live duels in progress
   * - Completed: finished duels (last 10)
   */
  const loadDuels = useCallback(async () => {
    if (!userId) {
      setDuels({ pending: [], active: [], completed: [] });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch all duels where user is creator or opponent
      const { data: duelsData, error: duelsError } = await supabase
        .from('duels')
        .select('*')
        .or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (duelsError) {
        console.error('Failed to fetch duels:', duelsError);
        setError('Failed to fetch duels');
        return;
      }

      if (!duelsData || duelsData.length === 0) {
        setDuels({ pending: [], active: [], completed: [] });
        return;
      }

      // Collect all unique opponent IDs
      const opponentIds = [
        ...new Set([
          ...duelsData.map(d => d.creator_id === userId ? d.opponent_id : d.creator_id),
        ]),
      ].filter(Boolean);

      // Fetch opponent data
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .in('id', opponentIds);

      if (usersError) {
        console.error('Failed to fetch users:', usersError);
        setError('Failed to fetch user data');
        return;
      }

      // Create user lookup map
      const userMap = new Map((users || []).map(u => [u.id, u]));

      // Join duels with opponent data
      const duelsWithOpponents: DuelWithOpponent[] = duelsData.map(duel => {
        const opponentId = duel.creator_id === userId ? duel.opponent_id : duel.creator_id;
        const opponent = userMap.get(opponentId);

        return {
          ...duel,
          opponent_username: opponent?.username,
          opponent_avatar_url: opponent?.avatar_url,
        };
      });

      // Group duels by status
      const pendingDuels = duelsWithOpponents.filter(d => d.status === 'pending');
      const activeDuels = duelsWithOpponents.filter(d => d.status === 'active');
      const completedDuels = duelsWithOpponents
        .filter(d => ['completed', 'cancelled', 'expired'].includes(d.status))
        .slice(0, 10); // Limit to last 10 completed duels

      // Sort active duels by ending soonest
      activeDuels.sort((a, b) => {
        const aEndsAt = calculateEndTime(a);
        const bEndsAt = calculateEndTime(b);
        return aEndsAt - bEndsAt;
      });

      setDuels({
        pending: pendingDuels,
        active: activeDuels,
        completed: completedDuels,
      });
    } catch (err) {
      console.error('Unexpected error fetching duels:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    duels,
    loading,
    error,
    loadDuels,
  };
}

/**
 * Calculates when an active duel ends (Unix timestamp)
 * @param duel - The active duel
 * @returns Unix timestamp when duel ends
 */
function calculateEndTime(duel: DuelWithOpponent): number {
  if (!duel.started_at) return Date.now();
  const startTime = new Date(duel.started_at).getTime();
  const durationMs = duel.duration_hours * 60 * 60 * 1000;
  return startTime + durationMs;
}

/**
 * Calculates time remaining in an active duel in seconds
 * @param duel - The active duel
 * @returns Time remaining in seconds (0 if expired)
 */
export function getTimeRemaining(duel: DuelWithOpponent): number {
  if (duel.status !== 'active' || !duel.started_at) return 0;
  const endTime = calculateEndTime(duel);
  const now = Date.now();
  return Math.max(0, Math.floor((endTime - now) / 1000));
}

/**
 * Determines who is currently winning a duel
 * Compares screen_time_seconds from duel_participants table
 * @param duel - The active duel
 * @param userId - Current user's ID
 * @returns Object with winner info
 */
export async function getDuelWinner(
  duel: DuelWithOpponent,
  userId: string
): Promise<DuelWinner> {
  try {
    const { data: participants, error } = await supabase
      .from('duel_participants')
      .select('user_id, screen_time_seconds')
      .eq('duel_id', duel.id);

    if (error || !participants || participants.length < 2) {
      return { userId: null, isUser: false };
    }

    const creatorProgress = participants.find(p => p.user_id === duel.creator_id);
    const opponentProgress = participants.find(p => p.user_id === duel.opponent_id);

    if (!creatorProgress || !opponentProgress) {
      return { userId: null, isUser: false };
    }

    // Lower screen time = winning (less usage is better)
    const winningUserId =
      creatorProgress.screen_time_seconds <= opponentProgress.screen_time_seconds
        ? duel.creator_id
        : duel.opponent_id;

    return {
      userId: winningUserId,
      isUser: winningUserId === userId,
    };
  } catch (err) {
    console.error('Error getting duel winner:', err);
    return { userId: null, isUser: false };
  }
}

/**
 * Formats time since duel was created
 * @param createdAt - ISO timestamp
 * @returns Formatted time string (e.g., "2h ago", "3d ago")
 */
export function formatTimeSince(createdAt: string): string {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const diffMs = now - created;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

/**
 * Formats time remaining in hours/minutes
 * @param seconds - Time remaining in seconds
 * @returns Formatted time string (e.g., "2h 30m", "15m")
 */
export function formatTimeRemaining(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Determines if user is the creator of a duel
 * @param duel - The duel
 * @param userId - Current user's ID
 * @returns True if user is creator
 */
export function isUserCreator(duel: DuelWithOpponent, userId: string): boolean {
  return duel.creator_id === userId;
}

import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { DuelStatus, DuelType } from '../types/duel';

/**
 * Represents a pending challenge with user information
 */
export interface PendingChallenge {
  id: string;
  creator_id: string;
  opponent_id: string;
  creator_username?: string;
  opponent_username?: string;
  creator_avatar_url?: string;
  opponent_avatar_url?: string;
  duel_type: DuelType;
  banned_apps: string[];
  duration_hours: number;
  created_at: string;
}

/**
 * Custom hook for loading pending challenges
 * Fetches duels where user is creator or opponent with status='pending'
 * and joins with users table to get creator and opponent information
 *
 * @param userId - The ID of the user to fetch pending challenges for
 * @returns Object containing pendingChallenges array, loading state, error, and load function
 */
export function usePendingChallenges(userId: string) {
  const [pendingChallenges, setPendingChallenges] = useState<PendingChallenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Loads pending challenges for the given user
   * Fetches duels where status='pending' AND (creator_id=userId OR opponent_id=userId)
   * and joins with users table to get creator and opponent usernames and avatar_urls
   */
  const loadPendingChallenges = useCallback(async () => {
    if (!userId) {
      setPendingChallenges([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch pending duels where user is creator or opponent
      const { data: duels, error: duelsError } = await supabase
        .from('duels')
        .select('*')
        .eq('status', 'pending' as DuelStatus)
        .or(`creator_id.eq.${userId},opponent_id.eq.${userId}`);

      if (duelsError) {
        console.error('Failed to fetch pending duels:', duelsError);
        setError('Failed to fetch pending challenges');
        return;
      }

      if (!duels || duels.length === 0) {
        setPendingChallenges([]);
        return;
      }

      // Collect all unique user IDs (creators and opponents)
      const userIds = [...new Set([
        ...duels.map(d => d.creator_id),
        ...duels.map(d => d.opponent_id),
      ])];

      // Fetch user data for all involved users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .in('id', userIds);

      if (usersError) {
        console.error('Failed to fetch users:', usersError);
        setError('Failed to fetch user data');
        return;
      }

      // Create user lookup map for efficient access
      const userMap = new Map((users || []).map(u => [u.id, u]));

      // Join duel data with user data
      const challenges: PendingChallenge[] = duels.map(duel => {
        const creator = userMap.get(duel.creator_id);
        const opponent = userMap.get(duel.opponent_id);

        return {
          id: duel.id,
          creator_id: duel.creator_id,
          opponent_id: duel.opponent_id,
          creator_username: creator?.username,
          opponent_username: opponent?.username,
          creator_avatar_url: creator?.avatar_url,
          opponent_avatar_url: opponent?.avatar_url,
          duel_type: duel.duel_type,
          banned_apps: duel.banned_apps || [],
          duration_hours: duel.duration_hours,
          created_at: duel.created_at,
        };
      });

      setPendingChallenges(challenges);
    } catch (err) {
      console.error('Unexpected error fetching pending challenges:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    pendingChallenges,
    loading,
    error,
    loadPendingChallenges,
  };
}

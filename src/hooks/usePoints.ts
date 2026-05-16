import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import type {
  PointTransaction,
  UserPoints,
  RankTier,
} from '../types/points';
import { getRankTier, getTierProgress } from '../types/points';

interface UsePointsReturn {
  userPoints: UserPoints | null;
  recentTransactions: PointTransaction[];
  currentTier: RankTier | null;
  tierProgress: number;
  isLoading: boolean;
  error: string | null;
  refreshPoints: () => Promise<void>;
  awardPoints: (
    amount: number,
    reason: string,
    referenceDuelId?: string,
    referenceSessionId?: string
  ) => Promise<void>;
  getPointsToday: () => Promise<number>;
}

/**
 * Custom hook for managing user points and transactions
 * Fetches user's total points, recent transactions, rank tier, and provides methods to award points
 */
export function usePoints(userId: string): UsePointsReturn {
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<PointTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch user's total points from user_points table
   */
  const fetchUserPoints = useCallback(async () => {
    // Guard: don't query if userId is empty (prevents UUID errors)
    if (!userId || userId.trim() === '') {
      return;
    }

    try {
      setError(null);
      const { data, error } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If no points record exists, create one with 0 points
        if (error.code === 'PGRST116') {
          setUserPoints({
            id: '',
            user_id: userId,
            total_points: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          return;
        }
        throw error;
      }

      setUserPoints(data);
    } catch (err) {
      console.error('Error fetching user points:', err);
      setError('Failed to fetch points');
    }
  }, [userId]);

  /**
   * Fetch recent point transactions (last 10)
   */
  const fetchRecentTransactions = useCallback(async () => {
    // Guard: don't query if userId is empty (prevents UUID errors)
    if (!userId || userId.trim() === '') {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setRecentTransactions(data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  }, [userId]);

  /**
   * Refresh both user points and recent transactions
   */
  const refreshPoints = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchUserPoints(), fetchRecentTransactions()]);
    setIsLoading(false);
  }, [fetchUserPoints, fetchRecentTransactions]);

  /**
   * Award points to user using the database function
   * @param amount - Number of points to award (must be positive)
   * @param reason - Reason for awarding points (session_complete, duel_win, etc.)
   * @param referenceDuelId - Optional duel ID that triggered this award
   * @param referenceSessionId - Optional session ID that triggered this award
   */
  const awardPoints = useCallback(async (
    amount: number,
    reason: string,
    referenceDuelId?: string,
    referenceSessionId?: string
  ) => {
    // Guard: don't proceed if userId is empty (prevents UUID errors)
    if (!userId || userId.trim() === '') {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);

      // Call the database function
      const { data, error } = await supabase.rpc('award_points', {
        p_user_id: userId,
        p_amount: amount,
        p_reason: reason,
        p_reference_duel_id: referenceDuelId || null,
        p_reference_session_id: referenceSessionId || null,
      });

      if (error) throw error;

      // Refresh local state after awarding points
      await refreshPoints();

      return data;
    } catch (err) {
      console.error('Error awarding points:', err);
      setError('Failed to award points');
      throw err;
    }
  }, [userId, refreshPoints]);

  /**
   * Get points earned today
   */
  const getPointsToday = useCallback(async (): Promise<number> => {
    // Guard: don't query if userId is empty (prevents UUID errors)
    if (!userId || userId.trim() === '') {
      return 0;
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('point_transactions')
        .select('amount')
        .eq('user_id', userId)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      const total = (data || []).reduce((sum, t) => sum + t.amount, 0);
      return total;
    } catch (err) {
      console.error('Error getting points today:', err);
      return 0;
    }
  }, [userId]);

  // Calculate current tier and progress
  const currentTier = userPoints ? getRankTier(userPoints.total_points) : null;
  const tierProgress = userPoints ? getTierProgress(userPoints.total_points) : 0;

  // Load data on mount and when userId changes
  useEffect(() => {
    // Only fetch points if userId is a valid UUID string
    if (userId && userId.trim() !== '') {
      refreshPoints();
    }
  }, [userId, refreshPoints]);

  return {
    userPoints,
    recentTransactions,
    currentTier,
    tierProgress,
    isLoading,
    error,
    refreshPoints,
    awardPoints,
    getPointsToday,
  };
}
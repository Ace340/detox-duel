import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { Duel, DuelParticipantInsert } from '../types/duel';

/**
 * Custom hook for duel challenge operations
 * Provides functions to accept or decline pending duel challenges
 */
export function useDuelChallenge() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Validates that the user is either the creator or opponent of the duel
   * @param duel - The duel to validate
   * @param userId - The user ID to check
   * @returns true if user is authorized, false otherwise
   */
  const isUserAuthorized = (duel: Duel | null, userId: string): boolean => {
    if (!duel) return false;
    return duel.creator_id === userId || duel.opponent_id === userId;
  };

  /**
   * Accepts a pending duel challenge
   * Steps:
   * 1. Fetch the duel to validate user authorization
   * 2. Update duel status to 'active' with started_at timestamp
   * 3. Insert duel participant record for the accepting user
   *
   * @param duelId - The ID of the duel to accept
   * @param userId - The ID of the user accepting the challenge
   * @returns Promise<boolean> - true if successful, false otherwise
   */
  const acceptChallenge = useCallback(async (duelId: string, userId: string): Promise<boolean> => {
    // Validate input
    if (!duelId || !userId) {
      console.error('acceptChallenge: duelId and userId are required');
      setError('Duel ID and user ID are required');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Fetch the duel to validate authorization
      const { data: duel, error: fetchError } = await supabase
        .from('duels')
        .select('*')
        .eq('id', duelId)
        .single();

      if (fetchError) {
        console.error('Failed to fetch duel:', fetchError);
        setError('Duel not found');
        return false;
      }

      if (!duel) {
        console.error('Duel not found with ID:', duelId);
        setError('Duel not found');
        return false;
      }

      // Validate user authorization
      if (!isUserAuthorized(duel, userId)) {
        console.error('acceptChallenge: user not authorized to accept this duel');
        setError('You are not authorized to accept this duel');
        return false;
      }

      // Validate duel is in pending state
      if (duel.status !== 'pending') {
        console.error('acceptChallenge: duel is not in pending state');
        setError('This duel cannot be accepted');
        return false;
      }

      // Step 2: Update duel status to 'active' with started_at
      const { error: updateError } = await supabase
        .from('duels')
        .update({
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .eq('id', duelId)
        .eq('status', 'pending')
        .select();

      if (updateError) {
        console.error('Failed to update duel status:', updateError);
        setError('Failed to accept challenge');
        return false;
      }

      // Step 3: Insert duel participant record for the accepting user
      const participantInsert: DuelParticipantInsert = {
        duel_id: duelId,
        user_id: userId,
        screen_time_seconds: 0,
        streak_days: 0,
        is_loser: false,
      };

      const { error: participantError } = await supabase
        .from('duel_participants')
        .insert([participantInsert])
        .select();

      if (participantError) {
        console.error('Failed to insert duel participant:', participantError);
        setError('Failed to add you as a participant');
        return false;
      }

      return true;
    } catch (err) {
      console.error('Unexpected error accepting challenge:', err);
      setError('An unexpected error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Declines a pending duel challenge
   * Steps:
   * 1. Fetch the duel to validate user authorization
   * 2. Update duel status to 'cancelled' with ended_at timestamp
   *
   * @param duelId - The ID of the duel to decline
   * @param userId - The ID of the user declining the challenge
   * @returns Promise<boolean> - true if successful, false otherwise
   */
  const declineChallenge = useCallback(async (duelId: string, userId: string): Promise<boolean> => {
    // Validate input
    if (!duelId || !userId) {
      console.error('declineChallenge: duelId and userId are required');
      setError('Duel ID and user ID are required');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Fetch the duel to validate authorization
      const { data: duel, error: fetchError } = await supabase
        .from('duels')
        .select('*')
        .eq('id', duelId)
        .single();

      if (fetchError) {
        console.error('Failed to fetch duel:', fetchError);
        setError('Duel not found');
        return false;
      }

      if (!duel) {
        console.error('Duel not found with ID:', duelId);
        setError('Duel not found');
        return false;
      }

      // Validate user authorization
      if (!isUserAuthorized(duel, userId)) {
        console.error('declineChallenge: user not authorized to decline this duel');
        setError('You are not authorized to decline this duel');
        return false;
      }

      // Validate duel is in pending state
      if (duel.status !== 'pending') {
        console.error('declineChallenge: duel is not in pending state');
        setError('This duel cannot be declined');
        return false;
      }

      // Step 2: Update duel status to 'cancelled' with ended_at
      const { error: updateError } = await supabase
        .from('duels')
        .update({
          status: 'cancelled',
          ended_at: new Date().toISOString(),
        })
        .eq('id', duelId)
        .eq('status', 'pending')
        .select();

      if (updateError) {
        console.error('Failed to update duel status:', updateError);
        setError('Failed to decline challenge');
        return false;
      }

      return true;
    } catch (err) {
      console.error('Unexpected error declining challenge:', err);
      setError('An unexpected error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    acceptChallenge,
    declineChallenge,
  };
}

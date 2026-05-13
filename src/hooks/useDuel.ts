import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import {
  DuelInsert,
  DuelParticipantInsert,
  DuelType,
  formatDuelType,
} from '../types/duel';
import { useStreaks } from './useStreaks';
import { useBadges } from './useBadges';

/**
 * Configuration for creating a new duel
 */
export interface CreateDuelConfig {
  creatorId: string;
  opponentIds: string[];
  duelType: DuelType;
  durationHours: number;
  bannedApps?: string[];
}

/**
 * Custom hook for duel operations
 * Provides functions to create duels, load duels, and manage duel state
 */
export function useDuel(userId: string = '') {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize streaks tracking for duel wins
  const { updateStreaks: updateStreaksHook } = useStreaks(userId);

  // Initialize badge checking
  const { checkAllBadges } = useBadges(userId);

  /**
   * Creates a new duel with participants and notifications
   * 
   * Steps:
   * 1. Insert duel row to duels table with status='pending'
   * 2. Insert participant row for the creator
   * 3. Create notification for the primary opponent (opponent_id)
   * 4. Create notifications for additional opponents (stored in duel_participants)
   * 
   * @param config - Duel configuration including creator, opponents, type, and duration
   * @returns Promise resolving to the created duel ID or null on error
   */
  const createDuel = useCallback(async (config: CreateDuelConfig): Promise<string | null> => {
    const { creatorId, opponentIds, duelType, durationHours, bannedApps = [] } = config;

    // Validate input
    if (!creatorId) {
      console.error('createDuel: creatorId is required');
      setError('Creator ID is required');
      return null;
    }

    if (!opponentIds || opponentIds.length === 0) {
      console.error('createDuel: at least one opponent is required');
      setError('At least one opponent is required');
      return null;
    }

    if (durationHours <= 0 || durationHours > 168) {
      console.error('createDuel: durationHours must be between 1 and 168');
      setError('Duration must be between 1 and 168 hours');
      return null;
    }

    // Validate all opponent IDs are valid UUIDs
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    for (const opponentId of opponentIds) {
      if (!UUID_REGEX.test(opponentId)) {
        console.error('createDuel: invalid opponent ID format');
        setError('Invalid opponent ID format');
        return null;
      }
    }

    // Ensure creator is not in opponent list
    if (opponentIds.includes(creatorId)) {
      console.error('createDuel: creator cannot be an opponent');
      setError('You cannot duel yourself');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Insert duel row to duels table
      // Use first opponent as the primary opponent_id (schema constraint)
      const primaryOpponentId = opponentIds[0];

      const duelInsert: DuelInsert = {
        creator_id: creatorId,
        opponent_id: primaryOpponentId,
        duel_type: duelType,
        status: 'pending',
        banned_apps: bannedApps,
        duration_hours: durationHours,
      };

      const { data: duelData, error: duelError } = await supabase
        .from('duels')
        .insert([duelInsert])
        .select('id')
        .single();

      if (duelError || !duelData) {
        console.error('Failed to create duel:', duelError);
        setError('Failed to create duel');
        return null;
      }

      const duelId = duelData.id;

      // Step 2: Insert participant row for the creator
      const creatorParticipant: DuelParticipantInsert = {
        duel_id: duelId,
        user_id: creatorId,
        screen_time_seconds: 0,
        streak_days: 0,
        is_loser: false,
      };

      const { error: creatorParticipantError } = await supabase
        .from('duel_participants')
        .insert([creatorParticipant]);

      if (creatorParticipantError) {
        console.error('Failed to add creator as participant:', creatorParticipantError);
        setError('Failed to add creator as participant');
        // Don't return null yet - we may still be able to notify opponents
      }

      // Step 3: Create notification for the primary opponent
      const duelTypeLabel = formatDuelType(duelType);
      const { error: primaryNotificationError } = await supabase
        .from('notifications')
        .insert([{
          user_id: primaryOpponentId,
          from_user_id: creatorId,
          type: 'challenge_invite',
          title: 'New Duel Challenge!',
          body: `You've been challenged to a ${duelTypeLabel}!`,
          data: {
            duel_id: duelId,
            duel_type: duelType,
            duration_hours: durationHours,
            banned_apps: bannedApps,
          },
        }]);

      if (primaryNotificationError) {
        console.error('Failed to create notification for primary opponent:', primaryNotificationError);
        setError('Failed to create notification');
        // Continue anyway - duel is created
      }

      // Step 4: Create notifications for additional opponents (if any)
      if (opponentIds.length > 1) {
        const additionalNotifications = opponentIds.slice(1).map((opponentId) => ({
          user_id: opponentId,
          from_user_id: creatorId,
          type: 'challenge_invite' as const,
          title: 'New Duel Challenge!',
          body: `You've been challenged to a ${duelTypeLabel}!`,
          data: {
            duel_id: duelId,
            duel_type: duelType,
            duration_hours: durationHours,
            banned_apps: bannedApps,
          },
        }));

        const { error: additionalNotificationsError } = await supabase
          .from('notifications')
          .insert(additionalNotifications);

        if (additionalNotificationsError) {
          console.error('Failed to create notifications for additional opponents:', additionalNotificationsError);
          // Continue anyway - primary opponent is notified
        }
      }

      return duelId;
    } catch (err) {
      console.error('Unexpected error creating duel:', err);
      setError('An unexpected error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Records a duel win and updates streaks
   * This should be called when a duel is completed and the current user wins
   *
   * @param duelId - The ID of the completed duel
   * @returns Promise resolving to true if successful, false otherwise
   */
  const recordDuelWin = useCallback(async (duelId: string): Promise<boolean> => {
    if (!userId) {
      console.error('recordDuelWin: userId is required');
      setError('User ID is required');
      return false;
    }

    try {
      // TODO: Implement duel winner logic and database update
      // For now, just update streaks when this function is called
      // This is a placeholder for future implementation of duel completion logic

      console.log(`Recording win for user ${userId} in duel ${duelId}`);

      // Update streaks after winning a duel
      // This is a fire-and-forget operation - don't block on it
      // If it fails, log error but don't break duel flow
      await updateStreaksHook(new Date()).catch((error) => {
        console.error('Failed to update streaks after duel win:', error);
      });

      // Check for badges after winning a duel
      // This is a fire-and-forget operation - don't block on it
      // If it fails, log error but don't break duel flow
      checkAllBadges().catch((error) => {
        console.error('Failed to check badges after duel win:', error);
      });

      return true;
    } catch (err) {
      console.error('Error recording duel win:', err);
      setError('Failed to record duel win');
      return false;
    }
  }, [userId, updateStreaksHook]);

  return {
    loading,
    error,
    createDuel,
    recordDuelWin,
  };
}

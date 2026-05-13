import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { sendNotification } from '../services/notifications';
import type {
  GroupChallenge,
  GroupChallengeInsert,
  GroupChallengeUpdate,
  GroupChallengeParticipantInsert,
  GroupChallengeParticipantUpdate,
  GroupChallengeWithParticipants,
  GroupChallengeLeaderboard,
  ChallengeType,
  ChallengeStatus,
} from '../types/groupChallenge';

/**
 * Custom hook for managing group challenges
 * Provides functions to create, join, load, update, and complete challenges
 * Includes Realtime subscriptions for live updates
 */
export function useGroupChallenges(userId: string = '') {
  const [challenges, setChallenges] = useState<GroupChallengeWithParticipants[]>([]);
  const [currentChallenge, setCurrentChallenge] = useState<GroupChallengeWithParticipants | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Validates UUID format
   * @param id - String to validate
   * @returns True if valid UUID, false otherwise
   */
  const isValidUUID = useCallback((id: string): boolean => {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return UUID_REGEX.test(id);
  }, []);

  /**
   * Creates a new group challenge with participants and notifications
   *
   * Steps:
   * 1. Validate input parameters
   * 2. Insert challenge row to group_challenges table
   * 3. Insert creator as participant
   * 4. Send notifications to invited friends
   *
   * @param title - Challenge title
   * @param description - Challenge description (optional)
   * @param challengeType - Type of challenge
   * @param targetMetric - Target metric value
   * @param startDate - Start date ISO string
   * @param endDate - End date ISO string
   * @param maxParticipants - Maximum number of participants
   * @param invitedFriendIds - Array of friend IDs to invite
   * @param creatorId - ID of the challenge creator
   * @returns Promise resolving to challenge ID or null on error
   */
  const createChallenge = useCallback(async (
    title: string,
    description: string | null,
    challengeType: ChallengeType,
    targetMetric: number,
    startDate: string,
    endDate: string,
    maxParticipants: number,
    invitedFriendIds: string[],
    creatorId: string
  ): Promise<string | null> => {
    // Validation
    if (!title || title.trim().length === 0) {
      setError('Title is required');
      return null;
    }
    if (maxParticipants < 2) {
      setError('At least 2 participants required');
      return null;
    }
    if (invitedFriendIds.length === 0) {
      setError('At least one friend must be invited');
      return null;
    }

    // Validate creator ID
    if (!isValidUUID(creatorId)) {
      setError('Invalid creator ID format');
      return null;
    }

    // Validate all invited friend IDs
    for (const friendId of invitedFriendIds) {
      if (!isValidUUID(friendId)) {
        setError('Invalid friend ID format');
        return null;
      }
    }

    // Ensure creator is not in invited friends list
    if (invitedFriendIds.includes(creatorId)) {
      setError('You cannot invite yourself');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Insert challenge row
      const challengeInsert: GroupChallengeInsert = {
        creator_id: creatorId,
        title: title.trim(),
        description,
        challenge_type: challengeType,
        target_metric: targetMetric,
        start_date: startDate,
        end_date: endDate,
        status: 'pending',
        max_participants: maxParticipants,
      };

      const { data: challenge, error: challengeError } = await supabase
        .from('group_challenges')
        .insert([challengeInsert])
        .select()
        .single();

      if (challengeError || !challenge) {
        throw challengeError || new Error('Failed to create challenge');
      }

      // Step 2: Insert creator as participant
      const creatorParticipant: GroupChallengeParticipantInsert = {
        challenge_id: challenge.id,
        user_id: creatorId,
        score: 0,
      };

      const { error: participantError } = await supabase
        .from('group_challenge_participants')
        .insert([creatorParticipant]);

      if (participantError) {
        console.error('Failed to add creator as participant:', participantError);
        // Don't throw - challenge is created, participant can be added later
      }

      // Step 3: Send notifications to invited friends
      for (const friendId of invitedFriendIds) {
        await sendNotification(
          friendId,
          'challenge_invite',
          `You've been invited to a challenge!`,
          `${title.trim()} - ${challengeType} challenge`,
          { challenge_id: challenge.id, from_user_id: creatorId }
        );
      }

      return challenge.id;
    } catch (err) {
      console.error('Error creating challenge:', err);
      setError(err instanceof Error ? err.message : 'Failed to create challenge');
      return null;
    } finally {
      setLoading(false);
    }
  }, [isValidUUID]);

  /**
   * Joins an existing challenge as a participant
   *
   * @param challengeId - ID of the challenge to join
   * @param userId - ID of the user joining
   * @returns Promise resolving to true if successful, false otherwise
   */
  const joinChallenge = useCallback(async (challengeId: string, userId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Validate IDs
      if (!isValidUUID(challengeId) || !isValidUUID(userId)) {
        setError('Invalid ID format');
        return false;
      }

      // Check if already participant
      const { data: existing, error: checkError } = await supabase
        .from('group_challenge_participants')
        .select()
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existing) {
        setError('Already joined this challenge');
        return false;
      }

      // Join challenge
      const participantInsert: GroupChallengeParticipantInsert = {
        challenge_id: challengeId,
        user_id: userId,
        score: 0,
      };

      const { error } = await supabase
        .from('group_challenge_participants')
        .insert([participantInsert]);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error joining challenge:', err);
      setError(err instanceof Error ? err.message : 'Failed to join challenge');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isValidUUID]);

  /**
   * Loads active challenges for the current user
   * Fetches challenges where user is creator or participant
   * Includes participant data with user information
   *
   * @param statusFilter - Optional filter by challenge status
   */
  const loadActiveChallenges = useCallback(async (statusFilter?: ChallengeStatus) => {
    if (!userId) {
      setError('User ID required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('group_challenges')
        .select(`
          *,
          participants:group_challenge_participants(
            user_id,
            score,
            joined_at,
            user:auth.users(id, email, username, full_name, avatar_url)
          )
        `)
        .or(`creator_id.eq.${userId},participants.user_id.eq.${userId}`);

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      query = query.order('status', { ascending: false })
                    .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setChallenges(data || []);
    } catch (err) {
      console.error('Error loading challenges:', err);
      setError(err instanceof Error ? err.message : 'Failed to load challenges');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Loads detailed information for a specific challenge
   * Calculates ranking based on participant scores
   *
   * @param challengeId - ID of the challenge to load
   * @returns Promise resolving to challenge with participants or null on error
   */
  const loadChallengeDetails = useCallback(async (challengeId: string): Promise<GroupChallengeWithParticipants | null> => {
    setLoading(true);
    setError(null);

    try {
      if (!isValidUUID(challengeId)) {
        setError('Invalid challenge ID format');
        return null;
      }

      const { data, error } = await supabase
        .from('group_challenges')
        .select(`
          *,
          participants:group_challenge_participants(
            user_id,
            score,
            joined_at,
            user:auth.users(id, email, username, full_name, avatar_url)
          )
        `)
        .eq('id', challengeId)
        .single();

      if (error) throw error;

      if (!data) {
        setError('Challenge not found');
        return null;
      }

      // Calculate ranking - immutable approach
      const sortedParticipants = [...data.participants]
        .sort((a, b) => b.score - a.score)
        .map((participant, index) => ({
          ...participant,
          rank: index + 1,
        }));

      const withRanking: GroupChallengeWithParticipants = {
        ...data,
        participants: sortedParticipants,
      };

      setCurrentChallenge(withRanking);
      return withRanking;
    } catch (err) {
      console.error('Error loading challenge details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load challenge');
      return null;
    } finally {
      setLoading(false);
    }
  }, [isValidUUID]);

  /**
   * Updates a participant's score in the database
   * Triggers Realtime update to connected clients
   *
   * @param challengeId - ID of the challenge
   * @param userId - ID of the participant
   * @param score - New score value
   * @returns Promise resolving to true if successful, false otherwise
   */
  const updateParticipantScore = useCallback(async (
    challengeId: string,
    userId: string,
    score: number
  ): Promise<boolean> => {
    setError(null);

    try {
      if (!isValidUUID(challengeId) || !isValidUUID(userId)) {
        setError('Invalid ID format');
        return false;
      }

      const updateData: GroupChallengeParticipantUpdate = { score };

      const { error } = await supabase
        .from('group_challenge_participants')
        .update(updateData)
        .eq('challenge_id', challengeId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating score:', err);
      setError(err instanceof Error ? err.message : 'Failed to update score');
      return false;
    }
  }, [isValidUUID]);

  /**
   * Completes a challenge, determines winner, and notifies participants
   * Winner determination logic:
   * - lowest_screen_time: Lowest score wins
   * - most_focus_sessions: Highest score wins
   * - longest_streak: Highest score wins
   *
   * @param challengeId - ID of the challenge to complete
   * @returns Promise resolving to true if successful, false otherwise
   */
  const completeChallenge = useCallback(async (challengeId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Get challenge details with participants
      const challenge = await loadChallengeDetails(challengeId);
      if (!challenge) {
        setError('Challenge not found');
        return false;
      }

      // Determine winner based on challenge type
      let winnerId: string | null = null;
      let winningScore: number = 0;

      if (challenge.participants.length > 0) {
        if (challenge.challenge_type === 'lowest_screen_time') {
          // Lowest score wins
          const sorted = [...challenge.participants].sort((a, b) => a.score - b.score);
          winnerId = sorted[0].user_id;
          winningScore = sorted[0].score;
        } else {
          // Highest score wins (most_focus_sessions, longest_streak)
          const sorted = [...challenge.participants].sort((a, b) => b.score - a.score);
          winnerId = sorted[0].user_id;
          winningScore = sorted[0].score;
        }
      }

      // Update challenge status
      const updateData: GroupChallengeUpdate = {
        status: 'completed',
      };

      const { error: updateError } = await supabase
        .from('group_challenges')
        .update(updateData)
        .eq('id', challengeId);

      if (updateError) throw updateError;

      // Send notifications to all participants
      const participantIds = challenge.participants.map(p => p.user_id);
      for (const pid of participantIds) {
        const isWinner = pid === winnerId;
        await sendNotification(
          pid,
          'challenge_result',
          isWinner ? '🏆 You won the challenge!' : 'Challenge completed',
          `${challenge.title} - ${isWinner ? `You won with ${winningScore}!` : 'Check the results'}`,
          {
            challenge_id: challengeId,
            winner_id: winnerId,
            is_winner: isWinner,
            winning_score: winningScore,
          }
        );
      }

      return true;
    } catch (err) {
      console.error('Error completing challenge:', err);
      setError(err instanceof Error ? err.message : 'Failed to complete challenge');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadChallengeDetails]);

  /**
   * Realtime subscription for live challenge updates
   * Listens to INSERT/UPDATE events on group_challenges and group_challenge_participants
   */
  useEffect(() => {
    if (!userId) return;

    // Subscribe to group_changes for challenges where user is creator
    const challengesChannel = supabase
      .channel('group-challenges-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_challenges',
          filter: `creator_id=eq.${userId}`,
        },
        () => {
          // Reload challenges on any change
          loadActiveChallenges();
        }
      )
      .subscribe();

    // Subscribe to participants changes for challenges user is part of
    const participantsChannel = supabase
      .channel('group-participants-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_challenge_participants',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Reload challenges on participant changes
          loadActiveChallenges();
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(challengesChannel);
      supabase.removeChannel(participantsChannel);
    };
  }, [userId, loadActiveChallenges]);

  return {
    challenges,
    currentChallenge,
    loading,
    error,
    createChallenge,
    joinChallenge,
    loadActiveChallenges,
    loadChallengeDetails,
    updateParticipantScore,
    completeChallenge,
  };
}

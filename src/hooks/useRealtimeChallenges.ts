import { useEffect, useRef, useState } from 'react';
import { supabase } from '../services/supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Duel } from '../types/duel';

/**
 * Options for useRealtimeChallenges hook
 */
interface UseRealtimeChallengesOptions {
  /** Current user ID to filter challenges for */
  userId: string;
  /** Callback invoked when a new pending challenge is received */
  onNewChallenge: (challenge: Duel) => void;
}

/**
 * Return value for useRealtimeChallenges hook
 */
interface UseRealtimeChallengesReturn {
  /** Active Supabase realtime channel (for manual control if needed) */
  subscription: RealtimeChannel | null;
  /** Whether the realtime subscription is currently connected */
  isConnected: boolean;
  /** Any error that occurred during subscription */
  error: Error | null;
}

/**
 * React hook for subscribing to realtime notifications of new pending challenges
 *
 * Subscribes to INSERT events on the duels table where:
 * - opponent_id matches the current user
 * - status is 'pending'
 *
 * The callback is stored in a ref so the subscription is only recreated
 * when userId changes, not on every parent re-render.
 *
 * @param options - Configuration options including userId and callback
 * @returns Subscription object and connection status
 *
 * @example
 * ```tsx
 * const { isConnected, error } = useRealtimeChallenges({
 *   userId: user.id,
 *   onNewChallenge: (challenge) => {
 *     showNotification(`New challenge from ${challenge.creator_id}`);
 *   }
 * });
 * ```
 */
export function useRealtimeChallenges({
  userId,
  onNewChallenge,
}: UseRealtimeChallengesOptions): UseRealtimeChallengesReturn {
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Stabilize callback in a ref so the useEffect below only depends on
  // userId.  This prevents the realtime channel from being torn down and
  // recreated on every parent re-render (which happens when the parent
  // passes an inline arrow function as onNewChallenge).
  const onNewChallengeRef = useRef(onNewChallenge);
  onNewChallengeRef.current = onNewChallenge;

  useEffect(() => {
    // Validate input
    if (!userId) {
      setError(new Error('userId is required for realtime challenge subscription'));
      return;
    }

    // Create unique channel name for this user's challenges
    // Add random component to prevent channel reuse during remounts
    const channelName = `duels:${userId}:challenges:${Math.random().toString(36).substring(2, 9)}`;

    // Create and configure realtime subscription
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'duels',
          filter: `opponent_id=eq.${userId}&status=eq.pending`,
        },
        (payload: RealtimePostgresChangesPayload<Duel>) => {
          // Extract new duel record from payload
          const newDuel = payload.new;

          // Validate payload contains expected data
          if (!newDuel || !newDuel.id) {
            console.warn('Received invalid challenge payload:', payload);
            return;
          }

          // Invoke callback via stable ref
          try {
            onNewChallengeRef.current(newDuel);
          } catch (callbackError) {
            console.error('Error in onNewChallenge callback:', callbackError);
          }
        },
      )
      .subscribe((status) => {
        // Handle subscription status changes
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          setError(new Error('Failed to subscribe to realtime updates'));
        } else if (status === 'TIMED_OUT') {
          setIsConnected(false);
          setError(new Error('Realtime subscription timed out'));
        } else if (status === 'CLOSED') {
          setIsConnected(false);
        }
      });

    // Store subscription reference
    setSubscription(channel);

    // Cleanup: remove channel when component unmounts or userId changes
    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [userId]);

  return { subscription, isConnected, error };
}

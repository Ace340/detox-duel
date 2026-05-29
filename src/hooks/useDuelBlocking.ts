import { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../services/supabase';
import { AppBlocker } from '../services/appBlocker';
import type { DuelStatus, DuelType } from '../types/duel';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

interface DuelBlockingOptions {
  userId: string;
  enabled?: boolean;
}

/**
 * Subscribes to Supabase realtime changes on the duels table and
 * automatically starts/stops app blocking based on the duel's status
 * and banned_apps for the current user's duels.
 *
 * - When a duel the user participates in goes `active` and has
 *   `banned_apps`, blocking is started.
 * - When the duel goes to any terminal status (`completed`,
 *   `cancelled`, `expired`), blocking is stopped.
 *
 * Only activates on Android. No-ops on all other platforms.
 */
export function useDuelBlocking({ userId, enabled = true }: DuelBlockingOptions) {
  const activeDuelIdRef = useRef<string | null>(null);

  const handleDuelChange = useCallback(async (duel: {
    id: string;
    status: DuelStatus;
    banned_apps: string[];
    creator_id: string;
    opponent_id: string;
    duel_type?: DuelType;
  }) => {
    if (Platform.OS !== 'android' || !enabled) return;

    const isParticipant = duel.creator_id === userId || duel.opponent_id === userId;
    if (!isParticipant) return;

    const hasBannedApps = duel.banned_apps && duel.banned_apps.length > 0;

    // Start blocking when duel becomes active with banned apps
    if (duel.status === 'active' && hasBannedApps) {
      const hasPermission = await AppBlocker.hasPermission();
      if (!hasPermission) {
        console.warn('[useDuelBlocking] Missing permissions — cannot start blocking for duel', duel.id);
        return;
      }

      try {
        const isQuickDuel = duel.duel_type === 'quick_duel';
        await AppBlocker.startBlocking(duel.banned_apps, duel.id, {
          supabaseUrl: SUPABASE_URL,
          supabaseKey: SUPABASE_KEY,
          userId,
          duelType: duel.duel_type,
          isQuickDuel,
        });
        activeDuelIdRef.current = duel.id;
        console.log('[useDuelBlocking] Started blocking for duel', duel.id);
      } catch (error) {
        console.error('[useDuelBlocking] Failed to start blocking:', error);
      }
    }

    // Stop blocking when duel reaches a terminal status
    const isTerminal = duel.status === 'completed'
      || duel.status === 'cancelled'
      || duel.status === 'expired';

    if (isTerminal && activeDuelIdRef.current === duel.id) {
      try {
        await AppBlocker.stopBlocking();
        activeDuelIdRef.current = null;
        console.log('[useDuelBlocking] Stopped blocking for duel', duel.id);
      } catch (error) {
        console.error('[useDuelBlocking] Failed to stop blocking:', error);
      }
    }
  }, [userId, enabled]);

  useEffect(() => {
    if (Platform.OS !== 'android' || !enabled || !userId) return;

    const channel = supabase
      .channel('duel-blocking')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'duels',
          filter: `or(creator_id.eq.${userId},opponent_id.eq.${userId})`,
        },
        (payload) => {
          const duel = payload.new as {
            id: string;
            status: DuelStatus;
            banned_apps: string[];
            creator_id: string;
            opponent_id: string;
            duel_type?: DuelType;
          };
          handleDuelChange(duel);
        },
      )
      .subscribe();

    // On mount, check for any currently active duels that need blocking
    (async () => {
      try {
        const { data: activeDuels } = await supabase
          .from('duels')
          .select('id, status, banned_apps, creator_id, opponent_id, duel_type')
          .or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
          .eq('status', 'active');

        if (activeDuels && activeDuels.length > 0) {
          // Find the first active duel with banned apps
          const duelWithBanned = activeDuels.find(
            (d) => d.banned_apps && d.banned_apps.length > 0
          );
          if (duelWithBanned) {
            await handleDuelChange(duelWithBanned);
          }
        }
      } catch (error) {
        console.error('[useDuelBlocking] Failed to check active duels on mount:', error);
      }
    })();

    return () => {
      supabase.removeChannel(channel);

      // Stop blocking when the hook unmounts (user logs out, app backgrounds, etc.)
      if (activeDuelIdRef.current) {
        AppBlocker.stopBlocking().catch((error) => {
          console.error('[useDuelBlocking] Failed to stop blocking on cleanup:', error);
        });
        activeDuelIdRef.current = null;
      }
    };
  }, [userId, enabled, handleDuelChange]);
}

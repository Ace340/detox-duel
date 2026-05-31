import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { useFocusTimer } from './useFocusTimer';
import {
  saveActiveSession,
  loadActiveSession,
  clearActiveSession,
  saveCompletedSession,
  loadCompletedSessions,
  updateTodayTotal,
  loadTodayTotal,
} from './useFocusStorage';
import {
  saveCompletedSessionToSupabase,
  getWeeklyFocusTotals,
} from './useFocusSupabase';
import { useStreaks } from './useStreaks';
import { useBadges } from './useBadges';
import { usePoints } from './usePoints';
import { AppBlocker } from '../services/appBlocker';
import { FocusSession, WeeklyScore } from '../types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

interface UseFocusSessionReturn {
  currentSession: FocusSession | null;
  todayTotal: number;
  weeklyTotals: WeeklyScore[];
  startSession: (durationMinutes: number, blockedApps: string[]) => void;
  completeSession: () => void;
  cancelSession: () => void;
  isLoading: boolean;
}

export function useFocusSession(userId: string): UseFocusSessionReturn {
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null);
  const [todayTotal, setTodayTotal] = useState<number>(0);
  const [weeklyTotals, setWeeklyTotals] = useState<WeeklyScore[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize streaks tracking
  const { updateStreaks: updateStreaksHook } = useStreaks(userId);

  // Initialize badge checking
  const { checkAllBadges } = useBadges(userId);

  // Initialize points management
  const { awardPoints } = usePoints(userId);

  const { remainingSeconds, isRunning, startTimer, stopTimer, resetTimer } =
    useFocusTimer(0);

  /**
   * Start app blocking for the given package names.
   * Silently fails on non-Android or when the native module is unavailable.
   */
  const startAppBlocking = useCallback(async (packageNames: string[], sessionId: string) => {
    if (Platform.OS !== 'android' || packageNames.length === 0) return;

    try {
      const status = await AppBlocker.getPermissionStatus();
      if (!status.allGranted) {
        console.warn(
          `[useFocusSession] Cannot start blocking — missing permissions: ` +
          `overlay=${status.overlay}, accessibility=${status.accessibility}. ` +
          `Session will run without app blocking.`
        );
        return;
      }

      await AppBlocker.startBlocking(packageNames, sessionId, {
        supabaseUrl: SUPABASE_URL,
        supabaseKey: SUPABASE_KEY,
        userId,
        duelType: 'focus_session',
      });
    } catch (error) {
      console.error('[useFocusSession] Failed to start app blocking:', error);
    }
  }, [userId]);

  /**
   * Stop app blocking. Safe to call even when blocking is not active.
   */
  const stopAppBlocking = useCallback(async () => {
    if (Platform.OS !== 'android') return;

    try {
      await AppBlocker.stopBlocking();
    } catch (error) {
      console.error('[useFocusSession] Failed to stop app blocking:', error);
    }
  }, []);

  const startSession = useCallback(
    async (durationMinutes: number, blockedApps: string[]) => {
      const now = new Date().toISOString();
      const session: FocusSession = {
        id: `local-${Date.now()}`,
        user_id: userId || '00000000-0000-0000-0000-000000000000',
        start_time: now,
        duration_minutes: durationMinutes,
        blocked_apps: blockedApps,
        status: 'active',
      };

      const saved = await saveActiveSession(session);
      if (saved) {
        setCurrentSession(session);
        resetTimer();
        startTimer();

        // Start app blocking for the selected apps
        await startAppBlocking(blockedApps, session.id);
      }
    },
    [userId, resetTimer, startTimer, startAppBlocking],
  );

  const completeSession = useCallback(async () => {
    if (!currentSession) return;

    stopTimer();
    setIsLoading(true);

    const now = new Date().toISOString();
    const completedSession: FocusSession = {
      ...currentSession,
      end_time: now,
      status: 'completed',
    };

    // Save to local storage and Supabase in parallel — both are
    // independent operations so there is no reason to await them
    // sequentially.
    const [savedToStorage, savedToSupabase] = await Promise.all([
      saveCompletedSession(completedSession),
      saveCompletedSessionToSupabase(completedSession),
    ]);

    if (savedToStorage) {
      await updateTodayTotal(currentSession.duration_minutes);
      await clearActiveSession();
      setCurrentSession(null);
      resetTimer();

      // Stop app blocking — session is complete
      await stopAppBlocking();

      // Fetch updated totals in parallel.
      const [newTotal, totals] = await Promise.all([
        loadTodayTotal(),
        getWeeklyFocusTotals(userId),
      ]);

      setTodayTotal(newTotal);
      setWeeklyTotals(totals);

      // Award points for session completion: 10 points per minute
      // This is a fire-and-forget operation - don't block on it
      const pointsEarned = currentSession.duration_minutes * 10;
      awardPoints(pointsEarned, 'session_complete', undefined, completedSession.id).catch((error) => {
        console.error('Failed to award points:', error);
      });

      // Update streaks after successful session completion
      // This is a fire-and-forget operation - don't block on it
      // If it fails, log error but don't break the session flow
      updateStreaksHook(new Date()).catch((error) => {
        console.error('Failed to update streaks:', error);
      });

      // Check for badges after session completion
      // This is a fire-and-forget operation - don't block on it
      // If it fails, log error but don't break the session flow
      checkAllBadges().catch((error) => {
        console.error('Failed to check badges:', error);
      });
    } else if (!savedToSupabase) {
      // Both failed — keep session active so the user can retry.
      console.error('Failed to complete session: both local and remote save failed.');
    }

    setIsLoading(false);
  }, [currentSession, stopTimer, resetTimer, userId, stopAppBlocking, awardPoints, updateStreaksHook, checkAllBadges]);

  const cancelSession = useCallback(async () => {
    if (!currentSession) return;

    stopTimer();

    const cancelledSession: FocusSession = {
      ...currentSession,
      end_time: new Date().toISOString(),
      status: 'cancelled',
    };

    await saveCompletedSession(cancelledSession);
    await clearActiveSession();
    setCurrentSession(null);
    resetTimer();

    // Stop app blocking — session is cancelled
    await stopAppBlocking();
  }, [currentSession, stopTimer, resetTimer, stopAppBlocking]);

  useEffect(() => {
    async function loadInitialData() {
      const session = await loadActiveSession();
      const total = await loadTodayTotal();
      const totals = await getWeeklyFocusTotals(userId);

      setTodayTotal(total);
      setWeeklyTotals(totals);

      if (session && session.status === 'active') {
        setCurrentSession(session);
        startTimer();

        // Restore blocking for the active session's banned apps
        if (session.blocked_apps && session.blocked_apps.length > 0) {
          await startAppBlocking(session.blocked_apps, session.id);
        }
      }
    }

    loadInitialData();
  }, [userId, startTimer, startAppBlocking]);

  return {
    currentSession,
    todayTotal,
    weeklyTotals,
    startSession,
    completeSession,
    cancelSession,
    isLoading,
  };
}

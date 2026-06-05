import { useState, useCallback, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
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
  startSession: (durationMinutes: number, blockedApps: string[]) => Promise<boolean>;
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
   * Returns true if blocking started (or no apps to block).
   * Returns false if permissions are missing — caller must NOT start the session.
   */
  const startAppBlocking = useCallback(async (packageNames: string[], sessionId: string): Promise<boolean> => {
    if (Platform.OS !== 'android' || packageNames.length === 0) return true;

    try {
      const status = await AppBlocker.getPermissionStatus();
      if (!status.allGranted) {
        console.warn(
          `[useFocusSession] Cannot start blocking — missing permissions: ` +
          `overlay=${status.overlay}, accessibility=${status.accessibility}.`
        );
        return false;
      }

      // Request POST_NOTIFICATIONS on Android 13+ for foreground service
      await AppBlocker.requestNotificationsPermission();

      await AppBlocker.startBlocking(packageNames, sessionId, {
        supabaseUrl: SUPABASE_URL,
        supabaseKey: SUPABASE_KEY,
        userId,
        duelType: 'focus_session',
      });
      return true;
    } catch (error) {
      console.error('[useFocusSession] Failed to start app blocking:', error);
      // Blocking failure should not prevent the session — permission was granted
      return true;
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
    async (durationMinutes: number, blockedApps: string[]): Promise<boolean> => {
      // If apps are selected, blocking permissions MUST be granted first
      if (blockedApps.length > 0 && Platform.OS === 'android') {
        const sessionId = `local-${Date.now()}`;
        const blockingOk = await startAppBlocking(blockedApps, sessionId);
        if (!blockingOk) {
          return false; // Permissions missing — session NOT started
        }
      }

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
      }
      return true;
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
        // If permissions were revoked, blocking silently fails — session
        // continues but apps won't be blocked.
        if (session.blocked_apps && session.blocked_apps.length > 0) {
          const ok = await startAppBlocking(session.blocked_apps, session.id);
          if (!ok) {
            console.warn('[useFocusSession] Could not restore blocking — permissions missing');
          }
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

import { useState, useCallback, useEffect } from 'react';
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
import { FocusSession, WeeklyScore } from '../types';

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

  const { remainingSeconds, isRunning, startTimer, stopTimer, resetTimer } =
    useFocusTimer(0);

  const startSession = useCallback(
    async (durationMinutes: number, blockedApps: string[]) => {
      const now = new Date().toISOString();
      // Generate a unique ID for local storage (will be replaced by UUID in Supabase)
      const session: FocusSession = {
        id: `local-${Date.now()}`,
        user_id: userId,
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
    },
    [userId, resetTimer, startTimer]
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

    const savedToStorage = await saveCompletedSession(completedSession);
    const savedToSupabase = await saveCompletedSessionToSupabase(
      completedSession
    );

    if (savedToStorage && savedToSupabase) {
      await updateTodayTotal(currentSession.duration_minutes);
      await clearActiveSession();
      setCurrentSession(null);
      resetTimer();

      const newTotal = await loadTodayTotal();
      setTodayTotal(newTotal);

      const totals = await getWeeklyFocusTotals(userId);
      setWeeklyTotals(totals);
    }

    setIsLoading(false);
  }, [currentSession, stopTimer, resetTimer, userId]);

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
  }, [currentSession, stopTimer, resetTimer]);

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
      }
    }

    loadInitialData();
  }, [userId, startTimer]);

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

import { FocusSession, WeeklyScore } from '../types';

/**
 * Calculate weekly focus totals from sessions
 * @param sessions - Array of focus sessions
 * @returns Array of weekly scores sorted by total focus minutes
 */
export function calculateWeeklyTotals(sessions: FocusSession[]): WeeklyScore[] {
  const completedSessions = sessions.filter(
    (session) => session.status === 'completed'
  );

  if (completedSessions.length === 0) {
    return [];
  }

  const totalsMap = new Map<string, WeeklyScore>();

  for (const session of completedSessions) {
    const userId = session.user_id;
    const username = session.user_id;
    const duration = session.duration_minutes;

    if (totalsMap.has(userId)) {
      const current = totalsMap.get(userId)!;
      totalsMap.set(userId, {
        ...current,
        total_focus_minutes: current.total_focus_minutes + duration,
      });
    } else {
      totalsMap.set(userId, {
        user_id: userId,
        username: username,
        avatar_url: undefined,
        total_focus_minutes: duration,
        streak: 0,
      });
    }
  }

  const totals = Array.from(totalsMap.values());
  const sortedTotals = totals.sort(
    (a, b) => b.total_focus_minutes - a.total_focus_minutes
  );

  return sortedTotals;
}

/**
 * Calculate today's total focus minutes from sessions
 * @param sessions - Array of focus sessions
 * @returns Total minutes focused today
 */
export function calculateTodayTotal(sessions: FocusSession[]): number {
  const today = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter((session) => {
    const sessionDate = session.start_time.split('T')[0];
    return (
      sessionDate === today &&
      session.status === 'completed'
    );
  });

  return todaySessions.reduce(
    (total, session) => total + session.duration_minutes,
    0
  );
}

/**
 * Calculate streak of consecutive days with focus sessions
 * @param sessions - Array of focus sessions
 * @returns Number of consecutive days with at least one session
 */
export function calculateStreak(sessions: FocusSession[]): number {
  const completedSessions = sessions.filter(
    (session) => session.status === 'completed'
  );

  if (completedSessions.length === 0) {
    return 0;
  }

  const sessionDates = completedSessions
    .map((session) => session.start_time.split('T')[0])
    .filter((date, index, arr) => arr.indexOf(date) === index)
    .sort()
    .reverse();

  if (sessionDates.length === 0) {
    return 0;
  }

  let streak = 1;
  const today = new Date().toISOString().split('T')[0];

  if (sessionDates[0] !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];

    if (sessionDates[0] !== yesterdayString) {
      return 0;
    }
  }

  for (let i = 1; i < sessionDates.length; i++) {
    const currentDate = new Date(sessionDates[i - 1]);
    const prevDate = new Date(sessionDates[i]);
    const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

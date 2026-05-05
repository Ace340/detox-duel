import { supabase } from '../services/supabase';
import { FocusSession, WeeklyScore } from '../types';

export async function saveCompletedSessionToSupabase(
  session: FocusSession
): Promise<boolean> {
  try {
    const { error } = await supabase.from('focus_sessions').insert([session]);

    if (error) {
      console.error('Failed to save session to Supabase:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error saving to Supabase:', error);
    return false;
  }
}

export async function getWeeklyFocusTotals(userId: string): Promise<WeeklyScore[]> {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoIso = weekAgo.toISOString();

    // Fetch sessions with user info using a simpler approach
    const { data: sessions, error: sessionsError } = await supabase
      .from('focus_sessions')
      .select('*')
      .gte('start_time', weekAgoIso)
      .eq('status', 'completed');

    if (sessionsError) {
      console.error('Failed to fetch weekly totals:', sessionsError);
      return [];
    }

    if (!sessions || sessions.length === 0) {
      return [];
    }

    // Get unique user IDs
    const userIds = [...new Set(sessions.map((s) => s.user_id))];

    // Fetch user info for all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, avatar_url')
      .in('id', userIds);

    if (usersError) {
      console.error('Failed to fetch users:', usersError);
      return [];
    }

    // Create a map of user ID to user info
    const userMap = new Map<string, { username: string; avatar_url?: string }>();
    for (const user of users || []) {
      userMap.set(user.id, {
        username: user.username,
        avatar_url: user.avatar_url,
      });
    }

    // Calculate totals
    const totalsMap = new Map<string, WeeklyScore>();

    for (const session of sessions) {
      const userId = session.user_id;
      const userInfo = userMap.get(userId);
      const username = userInfo?.username || 'Unknown';
      const avatarUrl = userInfo?.avatar_url;
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
          avatar_url: avatarUrl,
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
  } catch (error) {
    console.error('Unexpected error fetching weekly totals:', error);
    return [];
  }
}

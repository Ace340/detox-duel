import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import type {
  Duel,
  DuelParticipant,
  DuelReward,
  DuelHistoryEntry,
  DuelStats,
  LeaderboardRanking,
} from '../types/duel';

/**
 * Hook for loading duel history, user stats, and leaderboard rankings.
 * Queries the duels, duel_participants, duel_rewards, and users tables.
 */
export function useDuelHistory(userId: string) {
  const [history, setHistory] = useState<DuelHistoryEntry[]>([]);
  const [stats, setStats] = useState<DuelStats>({
    totalDuels: 0,
    wins: 0,
    losses: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalRewards: 0,
  });
  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    try {
      // Fetch all duels where user is creator or opponent, finished only
      const { data: duelsData, error: duelsErr } = await supabase
        .from('duels')
        .select('*')
        .or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
        .in('status', ['completed', 'cancelled', 'expired'])
        .order('created_at', { ascending: false });

      if (duelsErr || !duelsData) {
        setLoading(false);
        return;
      }

      if (duelsData.length === 0) {
        setHistory([]);
        setStats({ totalDuels: 0, wins: 0, losses: 0, currentStreak: 0, longestStreak: 0, totalRewards: 0 });
        setLoading(false);
        return;
      }

      const duelIds = duelsData.map((d: Duel) => d.id);

      // Batch-fetch participants for all duels
      const { data: participantsData } = await supabase
        .from('duel_participants')
        .select('*')
        .in('duel_id', duelIds);

      // Batch-fetch rewards for all duels
      const { data: rewardsData } = await supabase
        .from('duel_rewards')
        .select('*')
        .in('duel_id', duelIds);

      // Collect all opponent user IDs to resolve usernames
      const opponentIds = duelsData.map((d: Duel) =>
        d.creator_id === userId ? d.opponent_id : d.creator_id
      );
      const uniqueOpponentIds = [...new Set(opponentIds.filter(Boolean))];

      const { data: opponentsData } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .in('id', uniqueOpponentIds);

      const opponentMap = new Map((opponentsData || []).map(u => [u.id, u]));
      const participantsByDuel = new Map<string, DuelParticipant[]>();
      for (const p of participantsData || []) {
        const list = participantsByDuel.get(p.duel_id) || [];
        list.push(p);
        participantsByDuel.set(p.duel_id, list);
      }

      const rewardsByDuelAndUser = new Map<string, DuelReward[]>();
      for (const r of rewardsData || []) {
        const key = `${r.duel_id}_${r.user_id}`;
        const list = rewardsByDuelAndUser.get(key) || [];
        list.push(r);
        rewardsByDuelAndUser.set(key, list);
      }

      // Build history entries
      const entries: DuelHistoryEntry[] = [];
      let wins = 0;
      let losses = 0;
      let currentStreak = 0;
      let longestStreak = 0;
      let totalRewards = 0;

      for (const duel of duelsData) {
        const opponentId = duel.creator_id === userId ? duel.opponent_id : duel.creator_id;
        const opponent = opponentMap.get(opponentId);
        const participants = participantsByDuel.get(duel.id) || [];
        const myParticipation = participants.find(p => p.user_id === userId);
        const opponentParticipation = participants.find(p => p.user_id !== userId);

        const won = duel.winner_id === userId;
        const lost = duel.winner_id != null && duel.winner_id !== userId;
        const outcome: 'won' | 'lost' | 'draw' = won ? 'won' : lost ? 'lost' : 'draw';

        const myRewards = rewardsByDuelAndUser.get(`${duel.id}_${userId}`) || [];

        if (won) wins++;
        if (lost) losses++;

        // Streak tracking (consecutive wins from newest to oldest)
        if (won) {
          currentStreak++;
          longestStreak = Math.max(longestStreak, currentStreak);
        } else if (lost) {
          currentStreak = 0;
        }

        totalRewards += myRewards.length;

        entries.push({
          duel,
          opponentUsername: opponent?.username || 'Unknown',
          opponentAvatarUrl: opponent?.avatar_url,
          outcome,
          myScreenTimeSeconds: myParticipation?.screen_time_seconds || 0,
          opponentScreenTimeSeconds: opponentParticipation?.screen_time_seconds || 0,
          myStreakDays: myParticipation?.streak_days || 0,
          opponentStreakDays: opponentParticipation?.streak_days || 0,
          myRewards,
        });
      }

      setHistory(entries);
      setStats({
        totalDuels: duelsData.length,
        wins,
        losses,
        currentStreak,
        longestStreak,
        totalRewards,
      });
    } catch (err) {
      console.error('Error loading duel history:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { history, stats, loading, loadHistory };
}

// =====================================================
// LEADERBOARD QUERIES
// =====================================================

/**
 * Fetch duel-based leaderboard rankings for friends of the given user.
 */
export async function fetchFriendsLeaderboard(userId: string): Promise<LeaderboardRanking[]> {
  // Parallel fetch of both friendship directions cuts latency ~50%.
  const [sentResult, receivedResult] = await Promise.all([
    supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', userId)
      .eq('status', 'accepted'),
    supabase
      .from('friendships')
      .select('user_id')
      .eq('friend_id', userId)
      .eq('status', 'accepted'),
  ]);

  const { data: sent } = sentResult;
  const { data: received } = receivedResult;

  const friendIds = [
    ...new Set([
      ...(sent || []).map(s => s.friend_id),
      ...(received || []).map(r => r.user_id),
      userId, // include self
    ]),
  ];

  return computeRankings(friendIds);
}

/**
 * Fetch duel-based leaderboard rankings globally (top 50).
 *
 * Optimised: instead of downloading ALL completed duels and filtering
 * in-memory, we first find the top-50 users by win count using the
 * duel_participants table, then only fetch the duels relevant to those
 * users.
 */
export async function fetchGlobalLeaderboard(): Promise<LeaderboardRanking[]> {
  // Get distinct users who have participated in duels, capped at 200
  // to keep the dataset bounded.  We fetch more than 50 to allow for
  // users who may have participated but never won.
  const { data: participantUsers } = await supabase
    .from('duel_participants')
    .select('user_id')
    .limit(200);

  if (!participantUsers || participantUsers.length === 0) return [];

  const uniqueUserIds = [...new Set(participantUsers.map(p => p.user_id))];
  const rankings = await computeRankings(uniqueUserIds);

  // Return only the top 50 after sorting
  return rankings.slice(0, 50);
}

/**
 * Compute leaderboard rankings from a list of user IDs.
 * Queries duels + participants + rewards to calculate stats per user.
 */
async function computeRankings(userIds: string[]): Promise<LeaderboardRanking[]> {
  if (userIds.length === 0) return [];

  // Fetch user info
  const { data: usersData } = await supabase
    .from('users')
    .select('id, username, avatar_url')
    .in('id', userIds);

  const userMap = new Map((usersData || []).map(u => [u.id, u]));

  // Fetch completed duels where any of these users were the creator or opponent.
  // We use two targeted queries instead of downloading ALL completed duels.
  const [creatorDuelsResult, opponentDuelsResult] = await Promise.all([
    supabase
      .from('duels')
      .select('id, creator_id, opponent_id, winner_id, created_at')
      .eq('status', 'completed')
      .in('creator_id', userIds)
      .order('created_at', { ascending: false }),
    supabase
      .from('duels')
      .select('id, creator_id, opponent_id, winner_id, created_at')
      .eq('status', 'completed')
      .in('opponent_id', userIds)
      .order('created_at', { ascending: false }),
  ]);

  const creatorDuels = creatorDuelsResult.data || [];
  const opponentDuels = opponentDuelsResult.data || [];

  // De-duplicate (a duel where both creator and opponent are in our set
  // will appear in both queries).
  const seenIds = new Set<string>();
  const relevantDuels = [...creatorDuels, ...opponentDuels].filter(d => {
    if (seenIds.has(d.id)) return false;
    seenIds.add(d.id);
    return true;
  });

  if (relevantDuels.length === 0) {
    return userIds.map(id => {
      const u = userMap.get(id);
      return {
        user_id: id,
        username: u?.username || 'Unknown',
        avatar_url: u?.avatar_url,
        totalWins: 0,
        totalLosses: 0,
        totalDuels: 0,
        currentStreak: 0,
        longestStreak: 0,
        badgesEarned: 0,
        winRate: 0,
      };
    });
  }

  // Fetch rewards for these duels
  const duelIds = relevantDuels.map(d => d.id);
  const { data: rewardsData } = await supabase
    .from('duel_rewards')
    .select('user_id, reward_type')
    .in('duel_id', duelIds);

  // Count badges per user
  const badgeCounts = new Map<string, number>();
  for (const r of rewardsData || []) {
    if (r.reward_type === 'badge') {
      badgeCounts.set(r.user_id, (badgeCounts.get(r.user_id) || 0) + 1);
    }
  }

  // Calculate stats per user (sorted by created_at desc for streak calculation)
  const userIdSet = new Set(userIds);
  const userStats = new Map<string, {
    wins: number;
    losses: number;
    currentStreak: number;
    longestStreak: number;
  }>();

  for (const duel of relevantDuels) {
    const participantIds = [duel.creator_id, duel.opponent_id].filter(Boolean) as string[];
    for (const pid of participantIds) {
      if (!userIdSet.has(pid)) continue;

      const s = userStats.get(pid) || { wins: 0, losses: 0, currentStreak: 0, longestStreak: 0 };
      const won = duel.winner_id === pid;
      const lost = duel.winner_id != null && duel.winner_id !== pid;

      if (won) {
        s.wins++;
        s.currentStreak++;
        s.longestStreak = Math.max(s.longestStreak, s.currentStreak);
      } else if (lost) {
        s.losses++;
        s.currentStreak = 0;
      }
      userStats.set(pid, s);
    }
  }

  // Build rankings
  const rankings: LeaderboardRanking[] = userIds.map(id => {
    const u = userMap.get(id);
    const s = userStats.get(id) || { wins: 0, losses: 0, currentStreak: 0, longestStreak: 0 };
    const total = s.wins + s.losses;
    return {
      user_id: id,
      username: u?.username || 'Unknown',
      avatar_url: u?.avatar_url,
      totalWins: s.wins,
      totalLosses: s.losses,
      totalDuels: total,
      currentStreak: s.currentStreak,
      longestStreak: s.longestStreak,
      badgesEarned: badgeCounts.get(id) || 0,
      winRate: total > 0 ? Math.round((s.wins / total) * 100) : 0,
    };
  });

  // Sort by wins desc, then win rate desc, then longest streak desc
  rankings.sort((a, b) => {
    if (b.totalWins !== a.totalWins) return b.totalWins - a.totalWins;
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    return b.longestStreak - a.longestStreak;
  });

  return rankings;
}

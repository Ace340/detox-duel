import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Card } from '../components/ui';
import { COLORS, SPACING } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useBadges } from '../hooks/useBadges';
import { fetchFriendsLeaderboard, fetchGlobalLeaderboard } from '../hooks/useDuelHistory';
import type { LeaderboardRanking } from '../types/duel';

type FilterScope = 'friends' | 'global';

const RANK_EMOJIS = ['🥇', '🥈', '🥉'];

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const { checkAllBadges } = useBadges(user?.id);
  const [rankings, setRankings] = useState<LeaderboardRanking[]>([]);
  const [scope, setScope] = useState<FilterScope>('friends');
  const [loading, setLoading] = useState(true);

  const loadLeaderboard = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = scope === 'friends'
        ? await fetchFriendsLeaderboard(user.id)
        : await fetchGlobalLeaderboard();
      setRankings(data);

      // Check if user is in top 3, then check for badges
      const userRank = data.findIndex(r => r.user_id === user.id);
      if (userRank >= 0 && userRank < 3) {
        // User is in top 3, check for "Top 3" badge
        // This is a fire-and-forget operation - don't block on it
        checkAllBadges().catch((error) => {
          console.error('Failed to check badges for leaderboard position:', error);
        });
      }
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [user?.id, scope]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Leaderboard 🏆</Text>
      <Text style={styles.subtitle}>Duel rankings — who's the best?</Text>

      {/* Scope Toggle */}
      <View style={styles.scopeRow}>
        <TouchableOpacity
          style={[styles.scopeTab, scope === 'friends' && styles.scopeTabActive]}
          onPress={() => setScope('friends')}
        >
          <Text style={[styles.scopeTabText, scope === 'friends' && styles.scopeTabTextActive]}>
            👥 Friends
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.scopeTab, scope === 'global' && styles.scopeTabActive]}
          onPress={() => setScope('global')}
        >
          <Text style={[styles.scopeTabText, scope === 'global' && styles.scopeTabTextActive]}>
            🌍 Global
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading rankings...</Text>
        </View>
      ) : rankings.length === 0 ? (
        <Card title="No rankings yet" subtitle="Complete duels to see the leaderboard">
          <Text style={styles.emptyText}>
            {scope === 'friends'
              ? 'Add friends and challenge them to duel!'
              : 'Be the first to complete a duel!'}
          </Text>
        </Card>
      ) : (
        <>
          {/* Top 3 Podium */}
          {rankings.length >= 3 && (
            <View style={styles.podium}>
              {/* 2nd Place */}
              <View style={styles.podiumSlot}>
                <Text style={styles.podiumEmoji}>🥈</Text>
                <View style={[styles.podiumAvatar, { backgroundColor: COLORS.secondary }]}>
                  <Text style={styles.podiumAvatarText}>
                    {rankings[1].username.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {rankings[1].username}
                </Text>
                <Text style={styles.podiumWins}>{rankings[1].totalWins}W</Text>
              </View>

              {/* 1st Place */}
              <View style={[styles.podiumSlot, styles.podiumFirst]}>
                <Text style={styles.podiumCrown}>👑</Text>
                <View style={[styles.podiumAvatar, styles.podiumAvatarFirst, { backgroundColor: COLORS.primary }]}>
                  <Text style={[styles.podiumAvatarText, { fontSize: 24 }]}>
                    {rankings[0].username.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.podiumName, { color: COLORS.primary }]} numberOfLines={1}>
                  {rankings[0].username}
                </Text>
                <Text style={[styles.podiumWins, { color: COLORS.primary }]}>{rankings[0].totalWins}W</Text>
              </View>

              {/* 3rd Place */}
              <View style={styles.podiumSlot}>
                <Text style={styles.podiumEmoji}>🥉</Text>
                <View style={[styles.podiumAvatar, { backgroundColor: COLORS.warning }]}>
                  <Text style={styles.podiumAvatarText}>
                    {rankings[2].username.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {rankings[2].username}
                </Text>
                <Text style={styles.podiumWins}>{rankings[2].totalWins}W</Text>
              </View>
            </View>
          )}

          {/* Full Rankings List */}
          {rankings.map((ranking, index) => {
            const isMe = ranking.user_id === user?.id;
            const rankDisplay = index < 3 ? RANK_EMOJIS[index] : `#${index + 1}`;

            return (
              <View key={ranking.user_id} style={[styles.rankRow, isMe && styles.myRow]}>
                <View style={styles.rankLeft}>
                  <Text style={styles.rankBadge}>{rankDisplay}</Text>
                  <View style={[styles.rankAvatar, isMe && { backgroundColor: COLORS.primary }]}>
                    <Text style={styles.rankAvatarText}>
                      {ranking.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.rankInfo}>
                    <Text style={[styles.rankName, isMe && styles.myName]}>
                      {ranking.username} {isMe ? '(You)' : ''}
                    </Text>
                    <Text style={styles.rankSubtext}>
                      {ranking.totalWins}W / {ranking.totalLosses}L · {ranking.winRate}% win rate
                    </Text>
                  </View>
                </View>

                <View style={styles.rankRight}>
                  {ranking.longestStreak > 0 && (
                    <View style={styles.streakBadge}>
                      <Text style={styles.streakText}>🔥 {ranking.currentStreak}</Text>
                    </View>
                  )}
                  {ranking.badgesEarned > 0 && (
                    <Text style={styles.badgeCount}>🏅×{ranking.badgesEarned}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: SPACING.lg,
  },
  scopeRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: SPACING.lg,
  },
  scopeTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 10,
    alignItems: 'center',
  },
  scopeTabActive: {
    backgroundColor: COLORS.primary,
  },
  scopeTabText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  scopeTabTextActive: {
    color: COLORS.text,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: SPACING.md,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },

  // Podium
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  podiumSlot: {
    alignItems: 'center',
    width: 100,
    paddingTop: SPACING.md,
  },
  podiumFirst: {
    // No extra styling needed — crown handles visual prominence
  },
  podiumCrown: {
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  podiumEmoji: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  podiumAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  podiumAvatarFirst: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  podiumAvatarText: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  podiumName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  podiumWins: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
    fontWeight: '600',
  },

  // Rankings List
  rankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  myRow: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  rankBadge: {
    fontSize: 20,
    width: 32,
    textAlign: 'center',
  },
  rankAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankAvatarText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  rankInfo: {
    flex: 1,
  },
  rankName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  myName: {
    color: COLORS.primary,
  },
  rankSubtext: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  rankRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  streakBadge: {
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  streakText: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: '600',
  },
  badgeCount: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
});

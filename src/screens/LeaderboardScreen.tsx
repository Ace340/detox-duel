import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card } from '../components/ui';
import { COLORS, SPACING } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { getWeeklyFocusTotals } from '../hooks/useFocusSupabase';
import type { WeeklyScore } from '../types';

const RANK_EMOJIS = ['🥇', '🥈', '🥉'];

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const [scores, setScores] = useState<WeeklyScore[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLeaderboard = async () => {
    if (!user?.id) return;
    setLoading(true);
    const totals = await getWeeklyFocusTotals(user.id);
    setScores(totals);
    setLoading(false);
  };

  useEffect(() => { loadLeaderboard(); }, [user?.id]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Weekly Leaderboard 🏆</Text>
      <Text style={styles.subtitle}>You vs your friends — this week</Text>

      {loading ? (
        <Text style={styles.empty}>Loading...</Text>
      ) : scores.length === 0 ? (
        <Card title="No scores yet" subtitle="Complete a focus session to get on the board!">
          <Text style={styles.empty}>Start focusing to see your ranking here.</Text>
        </Card>
      ) : (
        scores.map((score, index) => {
          const isMe = score.user_id === user?.id;
          const rankEmoji = index < 3 ? RANK_EMOJIS[index] : `#${index + 1}`;
          return (
            <View key={score.user_id} style={[styles.rankRow, isMe && styles.myRow]}>
              <View style={styles.rankLeft}>
                <Text style={styles.rankBadge}>{rankEmoji}</Text>
                <View>
                  <Text style={[styles.rankName, isMe && styles.myName]}>
                    {score.username} {isMe ? '(You)' : ''}
                  </Text>
                  <Text style={styles.rankMinutes}>⏱ {score.total_focus_minutes} min</Text>
                </View>
              </View>
              {isMe && <Text style={styles.crown}>👑</Text>}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  title: { color: COLORS.text, fontSize: 28, fontWeight: 'bold', marginBottom: SPACING.xs },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, marginBottom: SPACING.lg },
  rankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  myRow: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankBadge: {
    fontSize: 24,
    width: 40,
    textAlign: 'center',
  },
  rankName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
  },
  myName: {
    color: COLORS.primary,
  },
  rankMinutes: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  crown: {
    fontSize: 24,
  },
  empty: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', marginTop: SPACING.lg },
});

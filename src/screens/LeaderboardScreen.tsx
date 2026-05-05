import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card } from '../components/ui';
import { COLORS, SPACING } from '../constants/theme';
import type { WeeklyScore } from '../types';

const MOCK_LEADERBOARD: WeeklyScore[] = [
  { user_id: '1', username: 'You', total_focus_minutes: 245, streak: 5 },
  { user_id: '2', username: 'Add friends!', total_focus_minutes: 0, streak: 0 },
];

export default function LeaderboardScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Weekly Leaderboard 🏆</Text>
      <Text style={styles.subtitle}>This week's focus champions</Text>

      {MOCK_LEADERBOARD.map((score, index) => (
        <Card key={score.user_id} title={`#${index + 1} ${score.username}`}>
          <Text style={styles.stat}>⏱ {score.total_focus_minutes} min focused</Text>
          <Text style={styles.stat}>🔥 {score.streak} day streak</Text>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  title: { color: COLORS.text, fontSize: 28, fontWeight: 'bold', marginBottom: SPACING.xs },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, marginBottom: SPACING.lg },
  stat: { color: COLORS.text, fontSize: 16, marginBottom: SPACING.sm },
});

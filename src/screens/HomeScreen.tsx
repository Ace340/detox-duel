import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button, Card } from '../components/ui';
import { COLORS, SPACING, FOCUS_PRESETS } from '../constants/theme';
import { useFocusSession } from '../hooks/useFocusSession';
import { formatMinutesToHours } from '../utils/timeFormat';

// TODO: Replace with actual UUID from your Supabase users table
// Run: SELECT id FROM users WHERE username = 'TestUser';
const MOCK_USER_ID = 'YOUR_UUID_HERE';

export default function HomeScreen({ navigation }: any) {
  const [selectedDuration, setSelectedDuration] = useState(30);
  const {
    currentSession,
    todayTotal,
    weeklyTotals,
    startSession,
    completeSession,
    cancelSession,
    isLoading,
  } = useFocusSession(MOCK_USER_ID);

  const handleStartFocus = () => {
    startSession(selectedDuration, []);
    navigation.navigate('FocusSession', {
      duration: selectedDuration,
    });
  };

  const handleCompleteFocus = () => {
    if (currentSession) {
      completeSession();
    }
  };

  const userRank = weeklyTotals.findIndex(
    (score) => score.user_id === MOCK_USER_ID
  );
  const userWeeklyTotal = weeklyTotals.find(
    (score) => score.user_id === MOCK_USER_ID
  )?.total_focus_minutes || 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Ready to focus? 🎯</Text>

      <Card
        title={currentSession ? 'Session Active' : 'Start Focus Session'}
        subtitle={currentSession ? 'You are in focus mode' : 'Block distractions and get in the zone'}
      >
        <Text style={styles.label}>Choose duration:</Text>
        <View style={styles.presets}>
          {FOCUS_PRESETS.map((preset) => (
            <Button
              key={preset.minutes}
              title={preset.label}
              variant={selectedDuration === preset.minutes ? 'primary' : 'outline'}
              onPress={() => setSelectedDuration(preset.minutes)}
              disabled={!!currentSession || isLoading}
            />
          ))}
        </View>
        <View style={styles.spacer} />
        <Button
          title={currentSession ? 'Session Running' : 'Start Focusing'}
          variant={currentSession ? 'secondary' : 'primary'}
          onPress={currentSession ? handleCompleteFocus : handleStartFocus}
          disabled={isLoading}
        />
      </Card>

      <Card title="Today's Progress" subtitle="Keep it up!">
        <Text style={styles.stat}>🔥 {formatMinutesToHours(todayTotal)} focused today</Text>
        <Text style={styles.stat}>📅 {todayTotal > 0 ? 'Great work!' : 'Start your first session!'}</Text>
      </Card>

      <Card
        title="Weekly Rank"
        subtitle={userRank >= 0 ? `#${userRank + 1}` : 'Not ranked yet'}
      >
        <Text style={styles.stat}>🏆 You: {formatMinutesToHours(userWeeklyTotal)}</Text>
        <Text style={styles.stat}>
          {weeklyTotals.length > 1
            ? `${weeklyTotals.length - 1} friends competing!`
            : 'Add friends to compete!'}
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  greeting: { color: COLORS.text, fontSize: 28, fontWeight: 'bold', marginBottom: SPACING.lg },
  label: { color: COLORS.textSecondary, fontSize: 14, marginBottom: SPACING.sm },
  presets: { gap: SPACING.sm },
  spacer: { height: SPACING.md },
  stat: { color: COLORS.text, fontSize: 16, marginBottom: SPACING.sm },
});

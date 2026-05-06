import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button, Card } from '../components/ui';
import { COLORS, SPACING, FOCUS_PRESETS } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { loadActiveSession, clearActiveSession, loadCompletedSessions, loadTodayTotal } from '../hooks/useFocusStorage';
import type { FocusSession } from '../types';

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [todayTotal, setTodayTotal] = useState(0);
  const [recentSessions, setRecentSessions] = useState<FocusSession[]>([]);
  const [hasActiveSession, setHasActiveSession] = useState(false);

  const loadData = async () => {
    const active = await loadActiveSession();
    console.log('[HomeScreen] Active session loaded:', active);
    if (active && active.status === 'active') {
      setHasActiveSession(true);
    } else {
      if (active) await clearActiveSession();
      setHasActiveSession(false);
    }
    const total = await loadTodayTotal();
    setTodayTotal(total);
    const completed = await loadCompletedSessions();
    console.log('[HomeScreen] All sessions loaded:', completed);
    const recentSessions = completed.filter(s => s.status === 'completed').slice(-5).reverse();
    console.log('[HomeScreen] Recent sessions (last 5 completed):', recentSessions);
    setRecentSessions(recentSessions);
  };

  useEffect(() => { loadData(); }, []);

  // Reload when screen gains focus
  useEffect(() => {
    const unsub = navigation.addListener('focus', loadData);
    return unsub;
  }, [navigation]);

  const handleStartFocus = () => {
    navigation.navigate('FocusSession', {
      duration: selectedDuration,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Ready to focus? 🎯</Text>

      <Card
        title={hasActiveSession ? 'Session Active' : 'Start Focus Session'}
        subtitle={hasActiveSession ? 'You are in focus mode' : 'Block distractions and get in the zone'}
      >
        <Text style={styles.label}>Choose duration:</Text>
        <View style={styles.presets}>
          {FOCUS_PRESETS.map((preset) => (
            <Button
              key={preset.minutes}
              title={preset.label}
              variant={selectedDuration === preset.minutes ? 'primary' : 'outline'}
              onPress={() => setSelectedDuration(preset.minutes)}
              disabled={hasActiveSession}
            />
          ))}
        </View>
        <View style={styles.spacer} />
        <Button
          title={hasActiveSession ? 'Session Running' : 'Start Focusing'}
          variant={hasActiveSession ? 'secondary' : 'primary'}
          onPress={handleStartFocus}
          disabled={hasActiveSession}
        />
      </Card>

      <Card title="Today's Progress" subtitle="Keep it up!">
        <Text style={styles.stat}>🔥 {todayTotal} min focused today</Text>
        <Text style={styles.stat}>📅 {todayTotal > 0 ? 'Great work!' : 'Start your first session!'}</Text>
      </Card>

      <Card title="Recent Sessions" subtitle="Your latest focus sessions">
        {recentSessions.length === 0 ? (
          <Text style={styles.stat}>No sessions yet. Start your first one!</Text>
        ) : (
          recentSessions.map((session, i) => (
            <View key={i} style={styles.sessionRow}>
              <Text style={styles.sessionDuration}>🎯 {session.duration_minutes} min</Text>
              <Text style={styles.sessionTime}>
                {new Date(session.start_time).toLocaleDateString()} {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ))
        )}
      </Card>

      <Card title="Weekly Rank" subtitle="Add friends to compete!">
        <Text style={styles.stat}>🏆 You: {todayTotal} min this week</Text>
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
  sessionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border || '#333' },
  sessionDuration: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
  sessionTime: { color: COLORS.textSecondary, fontSize: 13 },
});

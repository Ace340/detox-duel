import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Vibration, ScrollView } from 'react-native';
import { Button, Card } from '../components/ui';
import { COLORS, SPACING } from '../constants/theme';
import { useFocusTimer } from '../hooks/useFocusTimer';
import { formatSecondsToMMSS } from '../utils/timeFormat';
import { useAuth } from '../hooks/useAuth';
import { saveCompletedSessionToSupabase } from '../hooks/useFocusSupabase';
import { saveActiveSession, saveCompletedSession, updateTodayTotal, clearActiveSession } from '../hooks/useFocusStorage';
import { scheduleSessionReminder, cancelAllNotifications } from '../services/notifications';
import { CategoryPicker } from '../components/CategoryPicker';
import type { FocusSession } from '../types';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'FocusSession'>;

type SessionPhase = 'setup' | 'active' | 'completed';

export default function FocusSessionScreen({ route, navigation }: Props) {
  const { duration } = route.params;
  const { user } = useAuth();
  const { remainingSeconds, isRunning, startTimer, stopTimer } = useFocusTimer(duration * 60);
  const [phase, setPhase] = useState<SessionPhase>('setup');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);

  const sessionStartTime = useState(() => new Date().toISOString())[0];
  const sessionId = useState(() => `local-${Date.now()}`)[0];

  const finishSession = useCallback(async (status: 'completed' | 'cancelled') => {
    if (saving) return;
    setSaving(true);

    const session: FocusSession = {
      id: sessionId,
      user_id: user?.id || '00000000-0000-0000-0000-000000000000',
      start_time: sessionStartTime,
      end_time: new Date().toISOString(),
      duration_minutes: duration,
      blocked_apps: [],
      status,
      category: selectedCategory,
    };

    try {
      await saveCompletedSession(session);
      await saveCompletedSessionToSupabase(session);

      if (status === 'completed') {
        await updateTodayTotal(duration);
      }
    } catch (error) {
      console.error('[FocusSessionScreen] Error during session completion:', error);
    } finally {
      // Always clear the active session, even if there's an error
      await clearActiveSession();
      setSaving(false);
    }
  }, [sessionId, user?.id, sessionStartTime, duration, saving]);

  const startSession = useCallback(() => {
    setPhase('active');
    startTimer();
    // Schedule halfway reminder
    let notifId: string | null = null;
    scheduleSessionReminder(duration).then(id => { notifId = id; });
  }, [startTimer, duration]);

  // Cleanup notifications when component unmounts
  useEffect(() => {
    return () => {
      cancelAllNotifications();
    };
  }, []);

  // Save active session when component mounts (only in active phase)
  useEffect(() => {
    if (phase !== 'active') return;

    const activeSession: FocusSession = {
      id: sessionId,
      user_id: user?.id || '00000000-0000-0000-0000-000000000000',
      start_time: sessionStartTime,
      end_time: '',
      duration_minutes: duration,
      blocked_apps: [],
      status: 'active',
      category: selectedCategory,
    };

    saveActiveSession(activeSession).catch(error => {
      console.error('Failed to save active session:', error);
    });
  }, [sessionId, user?.id, sessionStartTime, duration, selectedCategory, phase]);

  useEffect(() => {
    if (remainingSeconds === 0 && !isRunning && !completed) {
      setCompleted(true);
      Vibration.vibrate([500, 200, 500, 200, 500]);
      finishSession('completed');
    }
  }, [remainingSeconds, isRunning]);

  const handleComplete = async () => {
    stopTimer();
    await finishSession('completed');
    navigation.navigate('Tabs');
  };

  const handleCancel = async () => {
    stopTimer();
    await finishSession('cancelled');
    navigation.navigate('Tabs');
  };

  const handleDone = () => {
    navigation.navigate('Tabs');
  };

  if (completed) {
    return (
      <View style={styles.container}>
        <Card title="🎉 Session Complete!" subtitle="Great work staying focused" style={styles.card}>
          <Text style={styles.completedTime}>{duration} minutes</Text>
          <Button title="Done" onPress={handleDone} />
        </Card>
      </View>
    );
  }

  // Setup phase: Show category picker
  if (phase === 'setup') {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.setupContent}>
          <Card
            title="Start Focus Session"
            subtitle={`Duration: ${duration} minutes`}
          >
            <Text style={styles.setupTitle}>What are you focusing on?</Text>
            <CategoryPicker
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            <View style={styles.setupButtonContainer}>
              <Button
                title="Start Focusing"
                onPress={startSession}
              />
              <Button
                title="Cancel"
                onPress={() => navigation.navigate('Tabs')}
                variant="outline"
              />
            </View>
          </Card>
        </ScrollView>
      </View>
    );
  }

  // Active phase: Show timer
  return (
    <View style={styles.container}>
      <Card title="Focus Mode Active" subtitle={`Session: ${duration} minutes`} style={styles.card}>
        {selectedCategory && (
          <Text style={styles.categoryLabel}>
            Focus: {selectedCategory}
          </Text>
        )}
        <Text style={styles.timer}>{formatSecondsToMMSS(remainingSeconds)}</Text>
        <Text style={styles.progressLabel}>
          {isRunning ? 'Stay focused! You got this 💪' : 'Paused'}
        </Text>
        <View style={styles.buttonContainer}>
          <Button title="Complete Early" onPress={handleComplete} variant="outline" />
          <Button title="Cancel" variant="secondary" onPress={handleCancel} />
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: SPACING.lg,
  },
  setupContent: {
    padding: SPACING.lg,
  },
  setupTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  setupButtonContainer: {
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  timer: {
    color: COLORS.primary,
    fontSize: 72,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: SPACING.xl,
  },
  progressLabel: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  categoryLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  completedTime: {
    color: COLORS.primary,
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: SPACING.xl,
  },
  buttonContainer: {
    gap: SPACING.sm,
  },
});

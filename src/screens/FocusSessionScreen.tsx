import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Vibration } from 'react-native';
import { Button, Card } from '../components/ui';
import { COLORS, SPACING } from '../constants/theme';
import { useFocusTimer } from '../hooks/useFocusTimer';
import { formatSecondsToMMSS } from '../utils/timeFormat';
import { useAuth } from '../hooks/useAuth';
import { saveCompletedSessionToSupabase } from '../hooks/useFocusSupabase';
import { saveActiveSession, saveCompletedSession, updateTodayTotal, clearActiveSession } from '../hooks/useFocusStorage';
import type { FocusSession } from '../types';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'FocusSession'>;

export default function FocusSessionScreen({ route, navigation }: Props) {
  const { duration } = route.params;
  const { user } = useAuth();
  const { remainingSeconds, isRunning, startTimer, stopTimer } = useFocusTimer(duration * 60);
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
    };

    try {
      console.log('[FocusSessionScreen] Finishing session:', session);
      await saveCompletedSession(session);
      console.log('[FocusSessionScreen] Session saved to local storage');
      await saveCompletedSessionToSupabase(session);
      console.log('[FocusSessionScreen] Session saved to Supabase');

      if (status === 'completed') {
        await updateTodayTotal(duration);
        console.log('[FocusSessionScreen] Today total updated');
      }
    } catch (error) {
      console.error('[FocusSessionScreen] Error during session completion:', error);
    } finally {
      // Always clear the active session, even if there's an error
      await clearActiveSession();
      console.log('[FocusSessionScreen] Active session cleared');
      setSaving(false);
    }
  }, [sessionId, user?.id, sessionStartTime, duration, saving]);

  useEffect(() => {
    startTimer();
  }, []);

  // Save active session when component mounts
  useEffect(() => {
    const activeSession: FocusSession = {
      id: sessionId,
      user_id: user?.id || '00000000-0000-0000-0000-000000000000',
      start_time: sessionStartTime,
      end_time: '',
      duration_minutes: duration,
      blocked_apps: [],
      status: 'active',
    };

    saveActiveSession(activeSession).catch(error => {
      console.error('Failed to save active session:', error);
    });
  }, [sessionId, user?.id, sessionStartTime, duration]);

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
        <Card title="🎉 Session Complete!" subtitle="Great work staying focused">
          <Text style={styles.completedTime}>{duration} minutes</Text>
          <Button title="Done" onPress={handleDone} />
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card title="Focus Mode Active" subtitle={`Session: ${duration} minutes`}>
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
    padding: SPACING.lg,
    justifyContent: 'center',
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

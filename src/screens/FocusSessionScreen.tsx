import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Vibration, ScrollView } from 'react-native';
import { Button, Card } from '../components/ui';
import { AppPicker } from '../components/AppPicker';
import { COLORS, SPACING } from '../constants/theme';
import { useFocusTimer } from '../hooks/useFocusTimer';
import { formatSecondsToMMSS } from '../utils/timeFormat';
import { useAuth } from '../hooks/useAuth';
import { saveCompletedSessionToSupabase } from '../hooks/useFocusSupabase';
import { saveActiveSession, saveCompletedSession, updateTodayTotal, clearActiveSession } from '../hooks/useFocusStorage';
import { scheduleSessionReminder, cancelAllNotifications } from '../services/notifications';
import { AppBlocker } from '../services/appBlocker';
import { CategoryPicker } from '../components/CategoryPicker';
import type { FocusSession } from '../types';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'FocusSession'>;

type SessionPhase = 'setup' | 'active' | 'completed';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Checks both required permissions and starts app blocking for a focus session.
 * Returns true if blocking started successfully (or no apps to block).
 * Returns false with a reason if permissions are missing (caller should navigate to guide).
 */
async function tryStartBlocking(
  packageNames: string[],
  sessionId: string,
  userId: string,
): Promise<{ ok: true } | { ok: false; reason: 'permissions'; missingOverlay: boolean; missingAccessibility: boolean }> {
  if (packageNames.length === 0) {
    return { ok: true };
  }

  const status = await AppBlocker.getPermissionStatus();
  if (!status.allGranted) {
    console.warn(
      `[FocusSessionScreen] Cannot start blocking — ` +
      `overlay=${status.overlay}, accessibility=${status.accessibility}`
    );
    return {
      ok: false,
      reason: 'permissions',
      missingOverlay: !status.overlay,
      missingAccessibility: !status.accessibility,
    };
  }

  try {
    await AppBlocker.startBlocking(packageNames, sessionId, {
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_KEY,
      userId,
      duelType: 'focus_session',
    });
    return { ok: true };
  } catch (error) {
    console.error('[FocusSessionScreen] Failed to start blocking:', error);
    // Blocking failure should not prevent the session from starting.
    // The user still gets their focus timer even if blocking is unavailable.
    return { ok: true };
  }
}

export default function FocusSessionScreen({ route, navigation }: Props) {
  const { duration } = route.params;
  const { user } = useAuth();
  const { remainingSeconds, isRunning, startTimer, stopTimer } = useFocusTimer(duration * 60);
  const [phase, setPhase] = useState<SessionPhase>('setup');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);

  const sessionStartTime = useState(() => new Date().toISOString())[0];
  const sessionId = useState(() => `local-${Date.now()}`)[0];

  const toggleApp = useCallback((packageName: string) => {
    setSelectedApps(prev =>
      prev.includes(packageName)
        ? prev.filter(pkg => pkg !== packageName)
        : [...prev, packageName]
    );
  }, []);

  const finishSession = useCallback(async (status: 'completed' | 'cancelled') => {
    if (saving) return;
    setSaving(true);

    const session: FocusSession = {
      id: sessionId,
      user_id: user?.id || '00000000-0000-0000-0000-000000000000',
      start_time: sessionStartTime,
      end_time: new Date().toISOString(),
      duration_minutes: duration,
      blocked_apps: selectedApps,
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
      // Always stop blocking and clear the active session
      if (selectedApps.length > 0) {
        AppBlocker.stopBlocking().catch((err) => {
          console.error('[FocusSessionScreen] Failed to stop blocking:', err);
        });
      }
      await clearActiveSession();
      setSaving(false);
    }
  }, [sessionId, user?.id, sessionStartTime, duration, saving, selectedApps, selectedCategory]);

  const startSession = useCallback(async () => {
    // Check permissions before starting if apps are selected
    if (selectedApps.length > 0) {
      const result = await tryStartBlocking(selectedApps, sessionId, user?.id ?? '');
      if (!result.ok) {
        navigation.navigate('AccessibilityGuideScreen');
        return;
      }
    }

    setPhase('active');
    startTimer();
    // Schedule halfway reminder
    scheduleSessionReminder(duration).catch((err) => {
      console.error('[FocusSessionScreen] Failed to schedule reminder:', err);
    });
  }, [selectedApps, sessionId, startTimer, duration, navigation]);

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
      blocked_apps: selectedApps,
      status: 'active',
      category: selectedCategory,
    };

    saveActiveSession(activeSession).catch(error => {
      console.error('Failed to save active session:', error);
    });
  }, [sessionId, user?.id, sessionStartTime, duration, selectedApps, selectedCategory, phase]);

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

  // Setup phase: Show category picker + app picker
  if (phase === 'setup') {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.setupContent}
        >
          <Card
            title="Start Focus Session"
            subtitle={`Duration: ${duration} minutes`}
            style={styles.card}
          >
            <Text style={styles.setupTitle}>What are you focusing on?</Text>
            <CategoryPicker
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </Card>

          <Card
            title="Block Distracting Apps"
            subtitle={selectedApps.length > 0 ? `${selectedApps.length} apps selected` : 'Optional — select apps to block'}
            style={styles.card}
          >
            <AppPicker selected={selectedApps} onToggle={toggleApp} />
          </Card>

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
        {selectedApps.length > 0 && (
          <Text style={styles.blockedAppsLabel}>
            🔒 {selectedApps.length} app{selectedApps.length !== 1 ? 's' : ''} blocked
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
    alignItems: 'center',
    padding: SPACING.lg,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  card: {
    width: '100%',
    maxWidth: 400,
  },
  setupContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  setupTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  setupButtonContainer: {
    width: '100%',
    maxWidth: 400,
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
  blockedAppsLabel: {
    color: COLORS.success,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: SPACING.xs,
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

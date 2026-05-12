import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Button, Card } from '../components/ui';
import { COLORS, SPACING, FOCUS_PRESETS } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { loadActiveSession, clearActiveSession, loadCompletedSessions, loadTodayTotal } from '../hooks/useFocusStorage';
import { usePendingChallenges } from '../hooks/usePendingChallenges';
import { useRealtimeChallenges } from '../hooks/useRealtimeChallenges';
import { useStreaks } from '../hooks/useStreaks';
import { StreakMilestoneCelebration } from '../components/StreakMilestoneCelebration';
import { StreakLostNotification } from '../components/StreakLostNotification';
import type { FocusSession } from '../types';
import type { PendingChallenge } from '../hooks/usePendingChallenges';
import type { Milestone } from '../types';

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [todayTotal, setTodayTotal] = useState(0);
  const [recentSessions, setRecentSessions] = useState<FocusSession[]>([]);
  const [hasActiveSession, setHasActiveSession] = useState(false);

  // Streaks state
  const [showMilestone, setShowMilestone] = useState(false);
  const [showStreakLost, setShowStreakLost] = useState(false);
  const [previousStreak, setPreviousStreak] = useState(0);
  const [currentMilestone, setCurrentMilestone] = useState<Milestone | null>(null);

  // Initialize streaks tracking
  const { streaks, milestone: milestoneReached, fetchStreaks, checkStreakBroken } = useStreaks(user?.id || '');

  // Pending challenges hooks
  const { pendingChallenges, loading: pendingLoading, error: pendingError, loadPendingChallenges } = usePendingChallenges(user?.id || '');

  // Realtime challenge subscription
  const handleNewChallenge = useCallback(() => {
    // Reload pending challenges when a new one arrives
    loadPendingChallenges();
  }, [loadPendingChallenges]);

  useRealtimeChallenges({
    userId: user?.id || '',
    onNewChallenge: handleNewChallenge,
  });

  const loadData = async () => {
    const active = await loadActiveSession();
    const completed = await loadCompletedSessions();

    // Check if the active session ID already exists in completed sessions (orphaned session)
    if (active && active.status === 'active') {
      const sessionAlreadyCompleted = completed.some(
        s => s.id === active.id && s.status !== 'active'
      );

      if (sessionAlreadyCompleted) {
        await clearActiveSession();
        setHasActiveSession(false);
      } else {
        setHasActiveSession(true);
      }
    } else {
      if (active) await clearActiveSession();
      setHasActiveSession(false);
    }

    const total = await loadTodayTotal();
    setTodayTotal(total);
    const recentSessions = completed.filter(s => s.status === 'completed').slice(-5).reverse();
    setRecentSessions(recentSessions);

    // Load pending challenges
    if (user?.id) {
      loadPendingChallenges();
    }
  };

  useEffect(() => { loadData(); }, [user?.id]);

  // Reload when screen gains focus
  useEffect(() => {
    const unsub = navigation.addListener('focus', loadData);
    return unsub;
  }, [navigation, user?.id]);

  // Check for streak broken when screen loads
  useEffect(() => {
    if (streaks && streaks.current_streak > 0) {
      checkStreakBroken().then((broken) => {
        if (broken && streaks.current_streak > 0) {
          // Save previous streak for notification
          setPreviousStreak(streaks.current_streak);
          setShowStreakLost(true);
        }
      });
    }
  }, [streaks, checkStreakBroken]);

  // Show milestone celebration when milestone is reached
  useEffect(() => {
    if (milestoneReached) {
      setCurrentMilestone(milestoneReached);
      setShowMilestone(true);
    }
  }, [milestoneReached]);

  const handleStartFocus = () => {
    navigation.navigate('FocusSession', {
      duration: selectedDuration,
    });
  };

  // Helper function to get duel type emoji
  const getDuelTypeEmoji = (type: string): string => {
    const emojis: Record<string, string> = {
      focus_sprint: '⚡',
      weekly_war: '⚔️',
      streak_battle: '🔥',
      quick_duel: '⚡',
    };
    return emojis[type] || '🎯';
  };

  // Navigate to challenge screen when a pending challenge is tapped
  const handleChallengeTap = (challenge: PendingChallenge) => {
    navigation.navigate('DuelChallenge', {
      duelId: challenge.id,
      opponentId: user?.id || '',
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Ready to focus? 🎯</Text>

      {/* Streak Counter */}
      <TouchableOpacity
        style={styles.streakCounter}
        onPress={() => navigation.navigate('StreakCalendar')}
        activeOpacity={0.7}
      >
        {streaks && streaks.current_streak > 0 ? (
          <>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakCount}>{streaks.current_streak}</Text>
            <Text style={styles.streakLabel}>day streak</Text>
          </>
        ) : (
          <>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakLabel}>Start your streak today!</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Streak Milestone Celebration */}
      {currentMilestone && (
        <StreakMilestoneCelebration
          milestone={currentMilestone.days}
          emoji={currentMilestone.emoji}
          visible={showMilestone}
          onDismiss={() => setShowMilestone(false)}
        />
      )}

      {/* Streak Lost Notification */}
      <StreakLostNotification
        previousStreak={previousStreak}
        visible={showStreakLost}
        onStartNewStreak={() => {
          setShowStreakLost(false);
          // Navigate to focus session to start new streak
          navigation.navigate('FocusSession', {
            duration: selectedDuration,
          });
        }}
        onDismiss={() => setShowStreakLost(false)}
      />

      {/* Pending Challenges Card */}
      {pendingChallenges.length > 0 && (
        <Card
          title={`Pending Challenges (${pendingChallenges.length})`}
          subtitle={pendingLoading ? 'Loading...' : pendingError ? 'Error loading challenges' : 'Tap to respond'}
        >
          {pendingChallenges.map((challenge) => (
            <TouchableOpacity
              key={challenge.id}
              style={styles.challengeRow}
              onPress={() => handleChallengeTap(challenge)}
              activeOpacity={0.7}
            >
              <View style={styles.challengeLeft}>
                <Text style={styles.challengeIcon}>{getDuelTypeEmoji(challenge.duel_type)}</Text>
                <View style={styles.challengeInfo}>
                  <Text style={styles.challengeUsername}>@{challenge.creator_username || 'Unknown'}</Text>
                  <Text style={styles.challengeType}>{getDuelTypeEmoji(challenge.duel_type)} Duel</Text>
                </View>
              </View>
              <Text style={styles.challengeArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </Card>
      )}

      <Card
        title={`Challenge a Friend${pendingChallenges.length > 0 ? ` (${pendingChallenges.length})` : ''}`}
        subtitle="Compete and stay focused together!"
      >
        <Button
          title="Create Duel ⚔️"
          variant="primary"
          onPress={() => navigation.navigate('CreateDuel')}
        />
      </Card>

      <View style={styles.spacer} />

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
  // Pending challenges styles
  challengeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border || '#2A2A4A',
  },
  challengeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  challengeIcon: {
    fontSize: 20,
    marginRight: SPACING.md,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeUsername: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  challengeType: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  challengeArrow: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  // Streak counter styles
  streakCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border || '#2A2A4A',
  },
  streakEmoji: {
    fontSize: 32,
    marginRight: SPACING.sm,
  },
  streakCount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: SPACING.xs,
  },
  streakLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});

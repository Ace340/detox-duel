import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Button, Card } from '../components/ui';
import { NotificationBellIcon } from '../components/NotificationBellIcon';
import { PointsPopup } from '../components/PointsPopup';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { CardSkeleton, ListItemSkeleton } from '../components/SkeletonLoader';
import { COLORS, SPACING, FOCUS_PRESETS } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { loadActiveSession, clearActiveSession, loadCompletedSessions, loadTodayTotal } from '../hooks/useFocusStorage';
import { usePendingChallenges } from '../hooks/usePendingChallenges';
import { useRealtimeChallenges } from '../hooks/useRealtimeChallenges';
import { useStreaks } from '../hooks/useStreaks';
import { useNotifications } from '../hooks/useNotifications';
import { usePoints } from '../hooks/usePoints';
import { StreakMilestoneCelebration } from '../components/StreakMilestoneCelebration';
import { StreakLostNotification } from '../components/StreakLostNotification';
import { getTopCategory, getCategoryIcon, getCategoryLabel } from '../constants/categories';
import type { FocusSession } from '../types';
import type { PendingChallenge } from '../hooks/usePendingChallenges';
import type { Milestone } from '../types';

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [todayTotal, setTodayTotal] = useState(0);
  const [recentSessions, setRecentSessions] = useState<FocusSession[]>([]);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [topCategory, setTopCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Streaks state
  const [showMilestone, setShowMilestone] = useState(false);
  const [showStreakLost, setShowStreakLost] = useState(false);
  const [previousStreak, setPreviousStreak] = useState(0);
  const [currentMilestone, setCurrentMilestone] = useState<Milestone | null>(null);

  // Points popup state
  const [showPointsPopup, setShowPointsPopup] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(0);

  // Initialize streaks tracking
  const { streaks, milestone: milestoneReached, fetchStreaks, checkStreakBroken } = useStreaks(user?.id || '');

  // Pending challenges hooks
  const { pendingChallenges, loading: pendingLoading, error: pendingError, loadPendingChallenges } = usePendingChallenges(user?.id || '');

  // Notifications hook
  const { unreadCount, loadNotifications } = useNotifications(user?.id || '');

  // Points hook
  const { getPointsToday } = usePoints(user?.id || '');
  const [pointsToday, setPointsToday] = useState(0);

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
    setLoading(true);
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
        setActiveSession(null);
      } else {
        setHasActiveSession(true);
        setActiveSession(active);
      }
    } else {
      if (active) await clearActiveSession();
      setHasActiveSession(false);
      setActiveSession(null);
    }

    const total = await loadTodayTotal();
    setTodayTotal(total);

    // Get today's completed sessions for category stats
    const todaySessions = completed.filter(
      s => s.status === 'completed' && new Date(s.start_time).toDateString() === new Date().toDateString()
    );

    const recentSessions = todaySessions.slice(-5).reverse();
    setRecentSessions(recentSessions);

    // Calculate top category for today
    const topCat = getTopCategory(todaySessions);
    setTopCategory(topCat);

    // Load pending challenges
    if (user?.id) {
      loadPendingChallenges();
      loadNotifications();

      // Load points earned today
      const points = await getPointsToday();
      setPointsToday(points);
    }

    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

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
    <>
      {/* Header with notification bell */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Ready to focus? 🎯</Text>
        <NotificationBellIcon
          unreadCount={unreadCount}
          onPress={() => navigation.navigate('Notifications' as never)}
        />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >

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
        {hasActiveSession && activeSession ? (
          <>
            <Text style={styles.stat}>⏱️ {activeSession.duration_minutes} min session in progress</Text>
            {activeSession.category && (
              <Text style={styles.stat}>
                📌 {getCategoryIcon(activeSession.category)} {getCategoryLabel(activeSession.category)}
              </Text>
            )}
            <Text style={styles.stat}>Started: {new Date(activeSession.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            <View style={styles.spacer} />
            <Text style={styles.warningText}>⚠️ This session may be stuck. Cancel it to start a new one.</Text>
            <View style={styles.spacer} />
            <Button
              title="Cancel Stuck Session"
              variant="secondary"
              onPress={async () => {
                await clearActiveSession();
                setHasActiveSession(false);
                setActiveSession(null);
                loadData();
              }}
            />
          </>
        ) : (
          <>
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
          </>
        )}
      </Card>

      <Card title="Today's Progress" subtitle="Keep it up!">
        <Text style={styles.stat}>🔥 {todayTotal} min focused today</Text>
        <Text style={styles.stat}>🪙 {pointsToday} points earned today</Text>
        {topCategory && todayTotal > 0 && (
          <Text style={styles.stat}>
            {getCategoryIcon(topCategory.category)} Top category: {getCategoryLabel(topCategory.category)} ({topCategory.percentage}%)
          </Text>
        )}
        <Text style={styles.stat}>📅 {todayTotal > 0 ? 'Great work!' : 'Start your first session!'}</Text>
      </Card>

      <Card title="Recent Sessions" subtitle="Your latest focus sessions">
        {loading ? (
          <>
            <ListItemSkeleton />
            <ListItemSkeleton />
          </>
        ) : recentSessions.length === 0 ? (
          <EmptyState
            emoji="🎯"
            message="No sessions yet. Start your first one!"
            actionText="Start Focusing"
            onAction={handleStartFocus}
          />
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
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
  },
  greeting: { color: COLORS.text, fontSize: 24, fontWeight: 'bold' },
  label: { color: COLORS.textSecondary, fontSize: 14, marginBottom: SPACING.sm },
  presets: { gap: SPACING.sm },
  spacer: { height: SPACING.md },
  stat: { color: COLORS.text, fontSize: 16, marginBottom: SPACING.sm },
  warningText: { color: COLORS.error, fontSize: 14, textAlign: 'center', marginBottom: SPACING.sm },
  sessionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border },
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

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useGroupChallenges } from '../hooks/useGroupChallenges';
import {
  formatChallengeType,
  calculateChallengeDays,
  type ChallengeType,
  type ChallengeStatus,
  type GroupChallengeWithParticipants,
} from '../types/groupChallenge';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { AppBlocker } from '../services/appBlocker';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

type ActiveChallengesNavProp = NativeStackNavigationProp<RootStackParamList, 'ActiveChallengesScreen'>;

const CHALLENGE_TYPE_EMOJI: Record<ChallengeType, string> = {
  lowest_screen_time: '📱',
  most_focus_sessions: '🧘',
  longest_streak: '🔥',
};

const FILTER_OPTIONS: { value: ChallengeStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

interface FilterTabProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

function FilterTab({ label, isActive, onPress }: FilterTabProps) {
  return (
    <TouchableOpacity
      style={[styles.filterTab, isActive && styles.filterTabActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
        {label}
      </Text>
      {isActive && <View style={styles.filterTabIndicator} />}
    </TouchableOpacity>
  );
}

interface ChallengeCardProps {
  challenge: GroupChallengeWithParticipants;
  onPress: () => void;
}

function ChallengeCard({ challenge, onPress }: ChallengeCardProps) {
  const emoji = CHALLENGE_TYPE_EMOJI[challenge.challenge_type] || '🎯';
  const days = calculateChallengeDays(challenge.start_date, challenge.end_date);
  const participantCount = challenge.participants.length;

  const timeDisplay = useMemo(() => {
    const now = new Date();
    const endDate = new Date(challenge.end_date);

    if (challenge.status === 'completed') {
      const daysSinceCompletion = Math.floor(
        (now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return `Completed ${daysSinceCompletion} day${daysSinceCompletion !== 1 ? 's' : ''} ago`;
    }

    const timeRemaining = endDate.getTime() - now.getTime();
    if (timeRemaining <= 0) return 'Ended';

    const daysLeft = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (daysLeft > 0) {
      return `${daysLeft}d ${hoursLeft}h left`;
    }
    const minutesLeft = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hoursLeft}h ${minutesLeft}m left`;
  }, [challenge.status, challenge.end_date]);

  const statusColor = useMemo(() => {
    switch (challenge.status) {
      case 'pending':
        return COLORS.warning;
      case 'active':
        return COLORS.primary;
      case 'completed':
        return COLORS.success;
      default:
        return COLORS.textSecondary;
    }
  }, [challenge.status]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={styles.challengeCard}>
        <View style={styles.challengeHeader}>
          <View style={styles.challengeTitleContainer}>
            <Text style={styles.challengeEmoji}>{emoji}</Text>
            <View>
              <Text style={styles.challengeTitle} numberOfLines={1}>
                {challenge.title}
              </Text>
              <Text style={styles.challengeType}>
                {formatChallengeType(challenge.challenge_type)}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.challengeDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>📅</Text>
            <Text style={styles.detailText}>{days} day{days !== 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>👥</Text>
            <Text style={styles.detailText}>{participantCount} participant{participantCount !== 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>⏰</Text>
            <Text style={styles.detailText}>{timeDisplay}</Text>
          </View>
        </View>

        <View style={styles.challengeFooter}>
          <Text style={styles.tapText}>Tap to view details →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>📋</Text>
      <Text style={styles.emptyTitle}>No Challenges</Text>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorEmoji}>⚠️</Text>
      <Text style={styles.errorTitle}>Oops!</Text>
      <Text style={styles.errorText}>{message}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ActiveChallengesScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<ActiveChallengesNavProp>();
  const { challenges, loading, error, loadActiveChallenges } = useGroupChallenges(user?.id || '');
  const [filter, setFilter] = useState<ChallengeStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  // App blocking state
  const [hasCheckedPermissions, setHasCheckedPermissions] = useState(false);
  const [blockingActive, setBlockingActive] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadActiveChallenges();
    }
  }, [user?.id]);

  // Check permissions on mount and handle app blocking for active challenges
  useEffect(() => {
    checkPermissionsAndHandleBlocking();
  }, [challenges]);

  // Cleanup blocking on unmount
  useEffect(() => {
    return () => {
      stopAllBlocking();
    };
  }, []);

  const checkPermissionsAndHandleBlocking = async () => {
    if (Platform.OS !== 'android' || !user?.id) {
      return;
    }

    try {
      // Check if app blocker is supported
      if (!AppBlocker.isSupported()) {
        return;
      }

      // Get active challenges (those with status 'active')
      const activeChallenges = challenges.filter(c => c.status === 'active');

      if (activeChallenges.length === 0) {
        // No active challenges, stop blocking
        await stopAllBlocking();
        return;
      }

      // Check permissions if we haven't yet
      if (!hasCheckedPermissions) {
        const hasPermission = await AppBlocker.hasPermission();
        if (!hasPermission) {
          // Navigate to AccessibilityGuideScreen
          navigation.navigate('AccessibilityGuideScreen' as any);
          setHasCheckedPermissions(true);
          return;
        }
        setHasCheckedPermissions(true);
      }

      // For each active challenge, check if it has banned_apps (future-proofing)
      for (const challenge of activeChallenges) {
        // Note: Group challenges don't currently have banned_apps field
        // This is future-proofed for when that feature is added
        const bannedApps = (challenge as any).banned_apps;
        if (bannedApps && bannedApps.length > 0) {
          try {
            await AppBlocker.startBlocking(bannedApps, challenge.id, {
              supabaseUrl: SUPABASE_URL,
              supabaseKey: SUPABASE_KEY,
              userId: user?.id ?? '',
              duelType: 'group_challenge',
            });
            setBlockingActive(true);
          } catch (error) {
            console.error(`Failed to start blocking for challenge ${challenge.id}:`, error);
            Alert.alert(
              'Blocking Error',
              'Failed to enable app blocking for this challenge. Please try again.',
              [{ text: 'OK' }]
            );
          }
        }
      }
    } catch (error) {
      console.error('Error in checkPermissionsAndHandleBlocking:', error);
    }
  };

  const stopAllBlocking = async () => {
    if (Platform.OS !== 'android') {
      return;
    }

    try {
      if (!AppBlocker.isSupported()) {
        return;
      }

      const isActive = await AppBlocker.isBlockingActive();
      if (isActive) {
        await AppBlocker.stopBlocking();
        setBlockingActive(false);
      }
    } catch (error) {
      console.error('Error stopping blocking:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadActiveChallenges();
    setRefreshing(false);
  }, [loadActiveChallenges]);

  const filteredChallenges = useMemo(() => {
    let filtered = challenges;

    if (filter !== 'all') {
      filtered = challenges.filter(c => c.status === filter);
    }

    // Sort: Active first (by time remaining), then Pending, then Completed (by end_date DESC)
    return [...filtered].sort((a, b) => {
      const now = new Date().getTime();
      const aEnd = new Date(a.end_date).getTime();
      const bEnd = new Date(b.end_date).getTime();

      if (a.status === 'active' && b.status !== 'active') return -1;
      if (b.status === 'active' && a.status !== 'active') return 1;
      if (a.status === 'pending' && b.status === 'completed') return -1;
      if (b.status === 'pending' && a.status === 'completed') return 1;

      if (a.status === 'active' && b.status === 'active') {
        return (aEnd - now) - (bEnd - now);
      }

      if (a.status === 'completed' && b.status === 'completed') {
        return bEnd - aEnd;
      }

      return 0;
    });
  }, [challenges, filter]);

  const handleChallengePress = useCallback(
    (challengeId: string) => {
      navigation.navigate('ChallengeDetailScreen' as any, { challengeId });
    },
    [navigation]
  );

  const renderFilterTab = useCallback(
    ({ label, value }: { label: string; value: ChallengeStatus | 'all' }) => (
      <FilterTab
        key={value}
        label={label}
        isActive={filter === value}
        onPress={() => setFilter(value)}
      />
    ),
    [filter]
  );

  const renderChallengeItem = useCallback(
    ({ item }: { item: GroupChallengeWithParticipants }) => (
      <ChallengeCard challenge={item} onPress={() => handleChallengePress(item.id)} />
    ),
    [handleChallengePress]
  );

  const keyExtractor = useCallback((item: GroupChallengeWithParticipants) => item.id, []);

  const renderEmptyState = useCallback(() => {
    const emptyMessage =
      filter === 'all'
        ? "You haven't joined any challenges yet"
        : filter === 'pending'
        ? 'No pending challenges'
        : filter === 'active'
        ? 'No active challenges'
        : 'No completed challenges';
    return <EmptyState message={emptyMessage} />;
  }, [filter]);

  const renderErrorState = useCallback(
    () => (
      <ErrorState
        message={error || 'Failed to load challenges'}
        onRetry={() => loadActiveChallenges()}
      />
    ),
    [error, loadActiveChallenges]
  );

  if (loading && challenges.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading challenges...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Group Challenges 🏆</Text>
        {blockingActive && (
          <View style={styles.blockingIndicator}>
            <Text style={styles.blockingIndicatorText}>🛡️ Blocking Active</Text>
          </View>
        )}
      </View>

      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={FILTER_OPTIONS}
          renderItem={({ item }) => renderFilterTab(item)}
          keyExtractor={item => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {error ? (
        renderErrorState()
      ) : (
        <FlatList
          data={filteredChallenges}
          renderItem={renderChallengeItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
           styles.listContent,
            filteredChallenges.length === 0 && styles.listContentEmpty,
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  blockingIndicator: {
    backgroundColor: `${COLORS.primary}20`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    marginTop: SPACING.sm,
    alignSelf: 'flex-start',
  },
  blockingIndicatorText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
  },
  filterContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  filterList: {
    gap: SPACING.sm,
  },
  filterTab: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: {
    backgroundColor: `${COLORS.primary}20`,
    borderColor: COLORS.primary,
  },
  filterTabText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: COLORS.primary,
  },
  filterTabIndicator: {
    position: 'absolute',
    bottom: 2,
    left: '50%',
    transform: [{ translateX: -3 }],
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  listContent: {
    padding: SPACING.lg,
    paddingTop: 0,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginTop: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  errorTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 12,
  },
  retryButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '600',
  },
  challengeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  challengeTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.sm,
  },
  challengeEmoji: {
    fontSize: 28,
    marginRight: SPACING.md,
  },
  challengeTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  challengeType: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  challengeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: `${COLORS.surfaceLight}50`,
    borderRadius: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  detailIcon: {
    fontSize: 16,
  },
  detailText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  challengeFooter: {
    alignItems: 'flex-end',
  },
  tapText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
});

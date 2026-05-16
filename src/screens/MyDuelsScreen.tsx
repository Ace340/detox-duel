import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import {
  useMyDuels,
  getTimeRemaining,
  getDuelWinner,
  formatTimeSince,
  formatTimeRemaining,
  isUserCreator,
  type DuelWithOpponent,
} from '../hooks/useMyDuels';
import { formatDuelType, type DuelType } from '../types/duel';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';

type MyDuelsNavProp = NativeStackNavigationProp<RootStackParamList, 'Tabs'>;

const DUEL_TYPE_EMOJI: Record<DuelType, string> = {
  focus_sprint: '⚡',
  weekly_war: '⚔️',
  streak_battle: '🔥',
  quick_duel: '💨',
};

export default function MyDuelsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<MyDuelsNavProp>();
  const { duels, loading, error, loadDuels } = useMyDuels(user?.id || '');
  const [refreshing, setRefreshing] = useState(false);

  const hasAnyDuels =
    duels.pending.length > 0 ||
    duels.active.length > 0 ||
    duels.completed.length > 0;

  useEffect(() => {
    loadDuels();
  }, [user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDuels();
    setRefreshing(false);
  }, [loadDuels]);

  const handleCreateDuel = useCallback(() => {
    navigation.navigate('CreateDuel', {});
  }, [navigation]);

  if (loading && !hasAnyDuels) {
    return (
      <View style={styles.centerContainer}>
        <LoadingSpinner text="Loading your duels..." />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }
    >
      <Text style={styles.title}>My Duels ⚔️</Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!hasAnyDuels && !loading ? (
        <EmptyState
          emoji="🤝"
          message="No duels yet — challenge a friend! 🤝"
          actionText="Create Duel"
          onAction={handleCreateDuel}
        />
      ) : (
        <>
          {/* Pending Section */}
          <DuelSection title="Pending" count={duels.pending.length}>
            {duels.pending.length === 0 ? (
              <EmptyState message="No pending challenges" />
            ) : (
              duels.pending.map(duel => (
                <PendingDuelCard
                  key={duel.id}
                  duel={duel}
                  userId={user?.id || ''}
                  onPress={() => handleDuelPress(duel, user?.id || '', navigation)}
                />
              ))
            )}
          </DuelSection>

          {/* Active Section */}
          <DuelSection title="Active" count={duels.active.length}>
            {duels.active.length === 0 ? (
              <EmptyState message="No active duels" />
            ) : (
              duels.active.map(duel => (
                <ActiveDuelCard
                  key={duel.id}
                  duel={duel}
                  userId={user?.id || ''}
                  onPress={() => handleDuelPress(duel, user?.id || '', navigation)}
                />
              ))
            )}
          </DuelSection>

          {/* Completed Section */}
          <DuelSection title="Completed" count={duels.completed.length}>
            {duels.completed.length === 0 ? (
              <EmptyState message="No completed duels" />
            ) : (
              duels.completed.map(duel => (
                <CompletedDuelCard
                  key={duel.id}
                  duel={duel}
                  userId={user?.id || ''}
                  onPress={() => handleCompletedDuelPress(duel, navigation)}
                />
              ))
            )}
          </DuelSection>
        </>
      )}

      <View style={styles.spacer} />
    </ScrollView>
  );
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function handleDuelPress(
  duel: DuelWithOpponent,
  userId: string,
  navigation: MyDuelsNavProp
) {
  const opponentId = isUserCreator(duel, userId) ? duel.opponent_id : duel.creator_id;
  navigation.navigate('DuelChallenge', { duelId: duel.id, opponentId });
}

function handleCompletedDuelPress(duel: DuelWithOpponent, navigation: MyDuelsNavProp) {
  navigation.navigate('DuelResults', { duelId: duel.id });
}

function getGlowAnimationStyles(
  glowValue: Animated.Value,
  colors: typeof COLORS
): { borderColor: any; shadowOpacity: any } {
  return {
    borderColor: glowValue.interpolate({
      inputRange: [0.8, 1],
      outputRange: [colors.border, colors.primary],
    }),
    shadowOpacity: glowValue.interpolate({
      inputRange: [0.8, 1],
      outputRange: [0, 0.3],
    }),
  };
}

function createGlowAnimation(
  glowValue: Animated.Value
): Animated.CompositeAnimation {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(glowValue, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
      }),
      Animated.timing(glowValue, {
        toValue: 0.8,
        duration: 2000,
        useNativeDriver: false,
      }),
    ])
  );
}

function createPulseAnimation(
  pulseValue: Animated.Value
): Animated.CompositeAnimation {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(pulseValue, {
        toValue: 1.03,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(pulseValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ])
  );
}

function getWinningIndicator(
  winner: { userId: string | null; isUser: boolean },
  colors: typeof COLORS
): React.JSX.Element | null {
  if (winner.userId === null) return null;

  return (
    <View
      style={[
        styles.winningIndicator,
        { backgroundColor: winner.isUser ? colors.success : colors.error },
      ]}
    >
      <Text style={styles.winningText}>{winner.isUser ? '✓' : '✗'}</Text>
    </View>
  );
}

function getOutcomeBadge(
  outcome: 'won' | 'lost' | 'draw',
  colors: typeof COLORS
): React.JSX.Element {
  return (
    <View
      style={[
        styles.outcomeBadge,
        outcome === 'won' && styles.outcomeWon,
        outcome === 'lost' && styles.outcomeLost,
        outcome === 'draw' && styles.outcomeDraw,
      ]}
    >
      <Text style={styles.outcomeEmoji}>
        {outcome === 'won' ? '✅' : outcome === 'lost' ? '❌' : '🤝'}
      </Text>
    </View>
  );
}

function getDuelOutcome(
  duel: DuelWithOpponent,
  userId: string
): 'won' | 'lost' | 'draw' {
  const won = duel.winner_id === userId;
  const lost = duel.winner_id && duel.winner_id !== userId;
  return won ? 'won' : lost ? 'lost' : 'draw';
}

function renderAvatar(
  avatarUrl: string | null | undefined,
  username: string | null | undefined
): React.JSX.Element {
  return avatarUrl ? (
    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
  ) : (
    <View style={styles.avatarPlaceholder}>
      <Text style={styles.avatarText}>{username?.charAt(0).toUpperCase() || '?'}</Text>
    </View>
  );
}

// =====================================================
// SECTION COMPONENTS
// =====================================================

interface DuelSectionProps {
  title: string;
  count: number;
  children: React.ReactNode;
}

function DuelSection({ title, count, children }: DuelSectionProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <View style={styles.section}>
      <TouchableOpacity style={styles.sectionHeader} onPress={() => setExpanded(!expanded)}>
        <Text style={styles.sectionTitle}>
          {title} ({count})
        </Text>
        <Text style={styles.sectionChevron}>{expanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>
      {expanded && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
}

// =====================================================
// CARD COMPONENTS
// =====================================================

interface PendingDuelCardProps {
  duel: DuelWithOpponent;
  userId: string;
  onPress: () => void;
}

function PendingDuelCard({ duel, userId, onPress }: PendingDuelCardProps) {
  const [glowValue] = useState(new Animated.Value(0.8));

  useEffect(() => {
    const animation = createGlowAnimation(glowValue);
    animation.start();
    return () => animation.stop();
  }, []);

  const glowStyle = getGlowAnimationStyles(glowValue, COLORS);
  const emoji = DUEL_TYPE_EMOJI[duel.duel_type] || '🎯';
  const timeSince = formatTimeSince(duel.created_at);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Animated.View style={[styles.card, styles.pendingCard, glowStyle]}>
        <View style={styles.avatarContainer}>
          {renderAvatar(duel.opponent_avatar_url, duel.opponent_username)}
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>@{duel.opponent_username || 'Unknown'}</Text>
          <Text style={styles.cardSubtitle}>
            {emoji} {formatDuelType(duel.duel_type)}
          </Text>
          <Text style={styles.cardTime}>{timeSince}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

interface ActiveDuelCardProps {
  duel: DuelWithOpponent;
  userId: string;
  onPress: () => void;
}

function ActiveDuelCard({ duel, userId, onPress }: ActiveDuelCardProps) {
  const [pulseValue] = useState(new Animated.Value(1));
  const [winner, setWinner] = useState<{ userId: string | null; isUser: boolean }>({
    userId: null,
    isUser: false,
  });

  useEffect(() => {
    const animation = createPulseAnimation(pulseValue);
    animation.start();
    return () => animation.stop();
  }, []);

  useEffect(() => {
    getDuelWinner(duel, userId).then(setWinner);
  }, [duel.id, userId]);

  const timeRemaining = getTimeRemaining(duel);
  const formattedTime = formatTimeRemaining(timeRemaining);
  const emoji = DUEL_TYPE_EMOJI[duel.duel_type] || '🎯';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Animated.View style={[styles.card, styles.activeCard, { transform: [{ scale: pulseValue }] }]}>
        <View style={styles.avatarContainer}>
          {renderAvatar(duel.opponent_avatar_url, duel.opponent_username)}
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>@{duel.opponent_username || 'Unknown'}</Text>
          <Text style={styles.cardSubtitle}>
            {emoji} {formatDuelType(duel.duel_type)}
          </Text>
          <Text style={styles.cardTime}>{formattedTime} left</Text>
        </View>
        {getWinningIndicator(winner, COLORS)}
        <Text style={styles.chevron}>›</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

interface CompletedDuelCardProps {
  duel: DuelWithOpponent;
  userId: string;
  onPress: () => void;
}

function CompletedDuelCard({ duel, userId, onPress }: CompletedDuelCardProps) {
  const outcome = getDuelOutcome(duel, userId);
  const emoji = DUEL_TYPE_EMOJI[duel.duel_type] || '🎯';
  const timeSince = formatTimeSince(duel.created_at);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={styles.card}>
        {getOutcomeBadge(outcome, COLORS)}
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>@{duel.opponent_username || 'Unknown'}</Text>
          <Text style={styles.cardSubtitle}>
            {emoji} {formatDuelType(duel.duel_type)}
          </Text>
          <Text style={styles.cardTime}>{timeSince}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
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
  content: {
    padding: SPACING.lg,
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
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: SPACING.lg,
  },
  errorContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
  },
  sectionChevron: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  sectionContent: {
    gap: SPACING.sm,
  },
  emptyState: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  pendingCard: {
    borderWidth: 1.5,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 4,
  },
  activeCard: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    elevation: 6,
  },
  avatarContainer: {
    width: 48,
    height: 48,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 2,
  },
  cardTime: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  winningIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  winningText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  outcomeBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
  },
  outcomeWon: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  outcomeLost: {
    backgroundColor: 'rgba(244, 67, 54, 0.15)',
  },
  outcomeDraw: {
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
  },
  outcomeEmoji: {
    fontSize: 20,
  },
  chevron: {
    color: COLORS.textSecondary,
    fontSize: 28,
    fontWeight: '300',
  },
  spacer: {
    height: SPACING.xl,
  },
});

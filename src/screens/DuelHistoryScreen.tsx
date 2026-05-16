import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, Button } from '../components/ui';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { ListItemSkeleton } from '../components/SkeletonLoader';
import { COLORS, SPACING } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useDuelHistory } from '../hooks/useDuelHistory';
import { formatDuelType, type DuelHistoryEntry, type DuelType } from '../types/duel';
import type { RootStackParamList } from '../navigation/AppNavigator';

type DuelHistoryNavProp = NativeStackNavigationProp<RootStackParamList, 'DuelHistory'>;

type FilterTab = 'all' | 'won' | 'lost';

const DUEL_TYPE_EMOJI: Record<DuelType, string> = {
  focus_sprint: '⚡',
  weekly_war: '⚔️',
  streak_battle: '🔥',
  quick_duel: '💨',
};

export default function DuelHistoryScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<DuelHistoryNavProp>();
  const { history, stats, loading, loadHistory } = useDuelHistory(user?.id || '');
  const [filter, setFilter] = useState<FilterTab>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const filteredHistory = history.filter(entry => {
    if (filter === 'won') return entry.outcome === 'won';
    if (filter === 'lost') return entry.outcome === 'lost';
    return true;
  });

  const formatDate = (iso: string): string => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatScreenTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <LoadingSpinner text="Loading history..." />
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
      <Text style={styles.title}>Duel History ⚔️</Text>

      {/* Stats Summary */}
      <Card title="Your Record" subtitle={`${stats.totalDuels} duels played`}>
        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{stats.wins}</Text>
            <Text style={styles.statLabel}>Wins</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{stats.losses}</Text>
            <Text style={styles.statLabel}>Losses</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={[styles.statValue, { color: COLORS.success }]}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={[styles.statValue, { color: COLORS.warning }]}>{stats.longestStreak}</Text>
            <Text style={styles.statLabel}>Best</Text>
          </View>
        </View>
        <View style={styles.spacer} />
        <Button
          title="Share Stats 📤"
          variant="outline"
          onPress={() => navigation.navigate('BragCard')}
        />
      </Card>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'won', 'lost'] as FilterTab[]).map(tab => {
          const isActive = filter === tab;
          const label = tab === 'all' ? 'All' : tab === 'won' ? 'Won ✅' : 'Lost ❌';
          const count = tab === 'all'
            ? history.length
            : tab === 'won'
              ? stats.wins
              : stats.losses;

          return (
            <TouchableOpacity
              key={tab}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => setFilter(tab)}
            >
              <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                {label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Duel List */}
      {filteredHistory.length === 0 ? (
        <EmptyState
          emoji="⚔️"
          message={
            filter !== 'all'
              ? `No ${filter} duels found. Try a different filter.`
              : 'No duel history yet'
          }
          actionText="View Active Duels"
          onAction={() => navigation.navigate('MyDuels' as never)}
        />
      ) : (
        filteredHistory.map(entry => (
          <DuelHistoryCard
            key={entry.duel.id}
            entry={entry}
            onPress={() => navigation.navigate('DuelResults', { duelId: entry.duel.id })}
            formatDate={formatDate}
            formatScreenTime={formatScreenTime}
          />
        ))
      )}
    </ScrollView>
  );
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

const getOutcomeEmoji = (outcome: string): string => {
  if (outcome === 'won') return '✅';
  if (outcome === 'lost') return '❌';
  return '🤝';
};

const getOutcomeText = (outcome: string): string => {
  if (outcome === 'won') return 'Victory';
  if (outcome === 'lost') return 'Defeat';
  return 'Draw';
};

const getOutcomeBadgeStyle = (outcome: string) => {
  if (outcome === 'won') return styles.outcomeWon;
  if (outcome === 'lost') return styles.outcomeLost;
  return styles.outcomeDraw;
};

// =====================================================
// DUEL HISTORY CARD COMPONENT
// =====================================================

interface DuelHistoryCardProps {
  entry: DuelHistoryEntry;
  onPress: () => void;
  formatDate: (iso: string) => string;
  formatScreenTime: (seconds: number) => string;
}

function DuelHistoryCard({ entry, onPress, formatDate, formatScreenTime }: DuelHistoryCardProps) {
  const { duel, opponentUsername, outcome } = entry;
  const emoji = DUEL_TYPE_EMOJI[duel.duel_type] || '🎯';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={styles.historyCard}>
        <View style={[styles.outcomeBadge, getOutcomeBadgeStyle(outcome)]}>
          <Text style={styles.outcomeEmoji}>{getOutcomeEmoji(outcome)}</Text>
        </View>

        <View style={styles.historyInfo}>
          <View style={styles.historyTopRow}>
            <Text style={styles.historyOpponent}>vs @{opponentUsername}</Text>
            <Text style={styles.historyOutcome}>{getOutcomeText(outcome)}</Text>
          </View>

          <View style={styles.historyBottomRow}>
            <Text style={styles.historyType}>{emoji} {formatDuelType(duel.duel_type)}</Text>
            <Text style={styles.historyDate}>{formatDate(duel.created_at)}</Text>
          </View>

          <View style={styles.historyStats}>
            <Text style={styles.historyStat}>
              📱 {formatScreenTime(entry.myScreenTimeSeconds)} vs {formatScreenTime(entry.opponentScreenTimeSeconds)}
            </Text>
            {entry.myRewards.length > 0 && (
              <Text style={styles.historyReward}>
                🏅 +{entry.myRewards.length} reward{entry.myRewards.length > 1 ? 's' : ''}
              </Text>
            )}
          </View>
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
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: SPACING.sm,
  },
  statBlock: {
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: SPACING.xs,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  spacer: {
    height: SPACING.md,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  filterTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: COLORS.text,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
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
  historyInfo: {
    flex: 1,
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  historyOpponent: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  historyOutcome: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  historyBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyType: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  historyDate: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  historyStats: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  historyStat: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  historyReward: {
    color: COLORS.warning,
    fontSize: 11,
    fontWeight: '600',
  },
  chevron: {
    color: COLORS.textSecondary,
    fontSize: 28,
    fontWeight: '300',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});

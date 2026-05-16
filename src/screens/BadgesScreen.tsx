import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BadgeCard } from '../components/BadgeCard';
import { BadgeCelebration } from '../components/BadgeCelebration';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { useBadges } from '../hooks/useBadges';
import { useAuth } from '../hooks/useAuth';
import { COLORS, SPACING } from '../constants/theme';
import type { Badge } from '../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type CategoryFilter = 'all' | 'focus' | 'streak' | 'duel' | 'social';
type NavigationProp = NativeStackNavigationProp<any>;

// =====================================================
// HELPER FUNCTIONS
// =====================================================

const filterByCategory = (badges: Badge[], category: CategoryFilter): Badge[] => {
  if (category === 'all') return badges;
  return badges.filter(badge => badge.category === category);
};

const sortBadgesByEarned = (
  badges: Badge[],
  userBadges: any[]
): Badge[] => {
  return [...badges].sort((a, b) => {
    const aEarned = userBadges?.find(ub => ub.badge_id === a.id);
    const bEarned = userBadges?.find(ub => ub.badge_id === b.id);

    if (aEarned && bEarned) {
      return new Date(bEarned.earned_at).getTime() - new Date(aEarned.earned_at).getTime();
    }

    if (aEarned && !bEarned) return -1;
    if (!aEarned && bEarned) return 1;
    return 0;
  });
};

const getFilteredBadges = (
  badges: Badge[] | null,
  userBadges: any[] | null,
  category: CategoryFilter
): Badge[] => {
  if (!badges) return [];
  const filtered = filterByCategory(badges, category);
  return sortBadgesByEarned(filtered, userBadges || []);
};

const hasEarnedBadges = (userBadges: any[] | null): boolean => {
  return (userBadges?.length ?? 0) > 0;
};

// =====================================================
// COMPONENT
// =====================================================

export default function BadgesScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const { badges, userBadges, loading, error, newBadge, dismissNewBadge } = useBadges(user?.id);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshing(false);
  }, []);

  const handleBadgePress = useCallback((badge: Badge) => {
    Alert.alert(badge.name, badge.description, [{ text: 'OK' }]);
  }, []);

  const handleCelebrationDismiss = useCallback(() => {
    dismissNewBadge();
  }, [dismissNewBadge]);

  const handleStartEarning = useCallback(() => {
    navigation.navigate('Home');
  }, [navigation]);

  const filteredBadges = getFilteredBadges(badges, userBadges, selectedCategory);
  const hasNoBadgesAvailable = badges && badges.length === 0;
  const hasNoEarnedBadges = !hasEarnedBadges(userBadges);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        <Text style={styles.title}>Badges 🏅</Text>
        <Text style={styles.subtitle}>Earn badges by completing challenges!</Text>

        {error ? (
          <EmptyState
            emoji="⚠️"
            message={error}
            actionText="Try Again"
            onAction={onRefresh}
          />
        ) : loading ? (
          <LoadingSpinner text="Loading badges..." fullScreen={false} />
        ) : hasNoBadgesAvailable ? (
          <EmptyState
            emoji="🏅"
            message="No badges available yet"
          />
        ) : hasNoEarnedBadges ? (
          <EmptyState
            emoji="🏆"
            message="No badges earned yet"
            actionText="Start Earning"
            onAction={handleStartEarning}
          />
        ) : (
          <>
            {/* Category Filter Tabs */}
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterTab, selectedCategory === 'all' && styles.filterTabActive]}
                onPress={() => setSelectedCategory('all')}
              >
                <Text style={[styles.filterTabText, selectedCategory === 'all' && styles.filterTabTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, selectedCategory === 'focus' && styles.filterTabActive]}
                onPress={() => setSelectedCategory('focus')}
              >
                <Text style={[styles.filterTabText, selectedCategory === 'focus' && styles.filterTabTextActive]}>
                  🎯 Focus
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, selectedCategory === 'streak' && styles.filterTabActive]}
                onPress={() => setSelectedCategory('streak')}
              >
                <Text style={[styles.filterTabText, selectedCategory === 'streak' && styles.filterTabTextActive]}>
                  🔥 Streak
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, selectedCategory === 'duel' && styles.filterTabActive]}
                onPress={() => setSelectedCategory('duel')}
              >
                <Text style={[styles.filterTabText, selectedCategory === 'duel' && styles.filterTabTextActive]}>
                  ⚔️ Duel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, selectedCategory === 'social' && styles.filterTabActive]}
                onPress={() => setSelectedCategory('social')}
              >
                <Text style={[styles.filterTabText, selectedCategory === 'social' && styles.filterTabTextActive]}>
                  👥 Social
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.gridContainer}>
              {filteredBadges.map(badge => {
                const isEarned = userBadges?.some(ub => ub.badge_id === badge.id) ?? false;
                return (
                  <View key={badge.id} style={styles.gridItem}>
                    <BadgeCard
                      badge={badge}
                      isEarned={isEarned}
                      onPress={() => handleBadgePress(badge)}
                    />
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {/* Badge Celebration Modal */}
      {newBadge && (
        <BadgeCelebration
          badge={{
            emoji: newBadge.emoji,
            name: newBadge.name,
            description: newBadge.description,
          }}
          visible={!!newBadge}
          onDismiss={handleCelebrationDismiss}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: SPACING.lg,
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: SPACING.lg,
    flexWrap: 'wrap',
  },
  filterTab: {
    flex: 1,
    minWidth: 70,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: COLORS.text,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    marginBottom: SPACING.md,
  },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { BadgeCard } from '../components/BadgeCard';
import { BadgeCelebration } from '../components/BadgeCelebration';
import { useBadges } from '../hooks/useBadges';
import { useAuth } from '../hooks/useAuth';
import { COLORS, SPACING } from '../constants/theme';
import type { Badge } from '../types';

type CategoryFilter = 'all' | 'focus' | 'streak' | 'duel' | 'social';

export default function BadgesScreen() {
  const { user } = useAuth();
  const { badges, userBadges, loading, newBadge, dismissNewBadge } = useBadges(user?.id);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');

  const handleBadgePress = (badge: Badge) => {
    Alert.alert(badge.name, badge.description, [{ text: 'OK' }]);
  };

  const handleCelebrationDismiss = () => {
    dismissNewBadge();
  };

  const getFilteredBadges = () => {
    if (!badges) return [];

    let filtered = badges;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(badge => badge.category === selectedCategory);
    }

    // Sort: Earned badges first (by earned_at DESC), then unearned
    filtered.sort((a, b) => {
      const aEarned = userBadges?.find(ub => ub.badge_id === a.id);
      const bEarned = userBadges?.find(ub => ub.badge_id === b.id);

      // Both earned - sort by earned_at DESC (newest first)
      if (aEarned && bEarned) {
        return new Date(bEarned.earned_at).getTime() - new Date(aEarned.earned_at).getTime();
      }

      // A earned, B not - A comes first
      if (aEarned && !bEarned) return -1;

      // B earned, A not - B comes first
      if (!aEarned && bEarned) return 1;

      // Neither earned - maintain order
      return 0;
    });

    return filtered;
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Badges 🏅</Text>
        <Text style={styles.subtitle}>Earn badges by completing challenges!</Text>

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

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading badges...</Text>
          </View>
        ) : badges && badges.length === 0 ? (
          <Text style={styles.emptyText}>No badges available yet</Text>
        ) : (
          <View style={styles.gridContainer}>
            {getFilteredBadges().map(badge => {
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
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: SPACING.md,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: SPACING.xl,
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

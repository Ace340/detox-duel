import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import type { Badge as BadgeType } from '../types';

// =====================================================
// BADGE CARD COMPONENT
// =====================================================

interface BadgeCardProps {
  badge: BadgeType;
  isEarned: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

/**
 * Display a badge with earned/unearned states
 *
 * Earned: Full color emoji, name, description
 * Unearned: Greyed out emoji, lock icon 🔒, name, condition text
 */
export function BadgeCard({ badge, isEarned, onPress, style }: BadgeCardProps) {
  const getConditionText = (): string => {
    const condition = badge.condition;

    switch (badge.category) {
      case 'focus':
        if (condition.sessions_completed) {
          return `Complete ${condition.sessions_completed} session${condition.sessions_completed > 1 ? 's' : ''}`;
        }
        if (condition.focus_hours) {
          return `Reach ${condition.focus_hours} hours`;
        }
        break;

      case 'streak':
        if (condition.streak_days) {
          return `Maintain ${condition.streak_days}-day streak`;
        }
        break;

      case 'duel':
        if (condition.duels_won) {
          return `Win ${condition.duels_won} duel${condition.duels_won > 1 ? 's' : ''}`;
        }
        break;

      case 'social':
        if (condition.friends_added) {
          return `Add ${condition.friends_added} friend${condition.friends_added > 1 ? 's' : ''}`;
        }
        if (condition.leaderboard_position) {
          return `Reach top ${condition.leaderboard_position} on leaderboard`;
        }
        break;
    }

    return 'Condition unknown';
  };

  return (
    <TouchableOpacity
      style={[styles.card, isEarned ? styles.earnedCard : styles.unearnedCard, style]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.emojiContainer}>
        <Text style={[styles.emoji, !isEarned && styles.emojiUnearned]}>
          {badge.emoji}
        </Text>
        {!isEarned && <Text style={styles.lockIcon}>🔒</Text>}
      </View>

      <View style={styles.content}>
        <Text style={[styles.name, !isEarned && styles.nameUnearned]}>
          {badge.name}
        </Text>
        <Text style={[styles.text, !isEarned && styles.textUnearned]}>
          {isEarned ? badge.description : getConditionText()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  earnedCard: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  unearnedCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emojiContainer: {
    position: 'relative',
    marginBottom: SPACING.sm,
  },
  emoji: {
    fontSize: 48,
  },
  emojiUnearned: {
    opacity: 0.4,
  },
  lockIcon: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    fontSize: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: 2,
  },
  content: {
    alignItems: 'center',
  },
  name: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  nameUnearned: {
    color: COLORS.textSecondary,
  },
  text: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: SPACING.sm,
  },
  textUnearned: {
    color: COLORS.textSecondary,
    opacity: 0.7,
  },
});

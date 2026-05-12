import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { Card } from './ui';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface StreakLostNotificationProps {
  previousStreak: number;
  visible: boolean;
  onStartNewStreak?: () => void;
  onDismiss?: () => void;
}

// =====================================================
// COMPONENT
// =====================================================

/**
 * Streak Lost Notification Component
 *
 * Displays an encouraging notification when user's streak is broken.
 * Provides motivation to start a new streak.
 */
export function StreakLostNotification({
  previousStreak,
  visible,
  onStartNewStreak,
  onDismiss,
}: StreakLostNotificationProps) {
  if (!visible) {
    return null;
  }

  const handleStartNewStreak = () => {
    if (onStartNewStreak) {
      onStartNewStreak();
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <Card
      title="Oh no! 😢"
      subtitle={`Your ${previousStreak}-day streak was lost`}
      style={styles.card}
    >
      <View style={styles.content}>
        {/* Encouraging message */}
        <Text style={styles.message}>
          Don't worry, streaks happen! {'\n'}
          You can start a new one today.
        </Text>

        {/* Previous streak highlight */}
        <View style={styles.streakHighlight}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakCount}>{previousStreak} days</Text>
        </View>

        {/* Encouraging tips */}
        <Text style={styles.tip}>
          💡 Tip: Complete a focus session or win a duel to start your new streak!
        </Text>

        {/* Action buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleStartNewStreak}
          >
            <Text style={styles.primaryButtonText}>Start New Streak</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleDismiss}
          >
            <Text style={styles.secondaryButtonText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.md,
  },
  content: {
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 24,
  },
  streakHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    marginBottom: SPACING.md,
  },
  streakEmoji: {
    fontSize: 32,
    marginRight: SPACING.sm,
  },
  streakCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  tip: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    fontStyle: 'italic',
  },
  buttonContainer: {
    width: '100%',
    gap: SPACING.sm,
  },
  button: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border || '#333',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});

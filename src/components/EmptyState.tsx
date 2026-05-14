import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

interface EmptyStateProps {
  emoji?: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({
  emoji = '📭',
  message,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionText && onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  emoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: 10,
  },
  actionText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
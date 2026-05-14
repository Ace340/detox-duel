import React from 'react';
import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

interface LoadingSpinnerProps {
  size?: 'small' | 'large' | number;
  color?: string;
  text?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({
  size = 'large',
  color = COLORS.primary,
  text,
  fullScreen = false,
}: LoadingSpinnerProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  text: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: SPACING.md,
  },
});
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { getCategoryIcon, getCategoryColor } from '../constants/categories';

interface CategoryChipProps {
  categoryId?: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function CategoryChip({
  categoryId,
  selected = false,
  onPress,
  style,
}: CategoryChipProps) {
  const icon = getCategoryIcon(categoryId);
  const color = getCategoryColor(categoryId);
  const bgColor = selected ? color : COLORS.surfaceLight;
  const borderColor = selected ? color : COLORS.border;
  const textColor = selected ? '#FFFFFF' : COLORS.text;

  return (
    <TouchableOpacity
      style={[styles.chip, { backgroundColor: bgColor, borderColor }, style]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.label, { color: textColor }]}>{categoryId || 'None'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surfaceLight,
  },
  icon: {
    fontSize: 16,
    marginRight: SPACING.xs,
  },
  label: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },
});
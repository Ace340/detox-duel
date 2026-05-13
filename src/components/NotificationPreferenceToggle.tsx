import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

interface NotificationPreferenceToggleProps {
  icon: string;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export function NotificationPreferenceToggle({
  icon,
  label,
  value,
  onChange,
}: NotificationPreferenceToggleProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onChange(!value)}
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={[styles.toggle, value && styles.toggleOn]}>
        <View style={[styles.toggleDot, value && styles.toggleDotOn]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 20,
    marginRight: SPACING.md,
  },
  label: {
    color: COLORS.text,
    fontSize: 14,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: COLORS.primary,
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.text,
    transform: [{ translateX: 0 }],
  },
  toggleDotOn: {
    backgroundColor: '#FFFFFF',
    transform: [{ translateX: 20 }],
  },
});

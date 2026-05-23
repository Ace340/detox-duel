import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { MOCK_APP_LIST } from '../constants/mockApps';

interface AppPickerProps {
  /** Array of currently selected package names */
  selected: string[];
  /** Called when a package name is toggled */
  onToggle: (packageName: string) => void;
}

/**
 * Reusable app selection grid for choosing which apps to block.
 *
 * Displays the full MOCK_APP_LIST as toggleable cards. Selected apps
 * are highlighted with the primary color. Uses package names as the
 * canonical identifier (not app IDs).
 */
export function AppPicker({ selected, onToggle }: AppPickerProps) {
  return (
    <View style={styles.appsGrid}>
      {MOCK_APP_LIST.map((app) => {
        const isSelected = selected.includes(app.package_name);
        return (
          <TouchableOpacity
            key={app.id}
            style={[
              styles.appCard,
              isSelected && styles.appCardSelected,
            ]}
            onPress={() => onToggle(app.package_name)}
            activeOpacity={0.7}
          >
            <Text style={styles.appIcon}>{app.icon_emoji}</Text>
            <Text style={[
              styles.appName,
              isSelected && styles.appNameSelected,
            ]}>
              {app.name}
            </Text>
            <View style={[
              styles.checkbox,
              isSelected && styles.checkboxChecked,
            ]}>
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  appsGrid: {
    gap: SPACING.sm,
  },
  appCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  appCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}20`,
  },
  appIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  appName: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '500',
  },
  appNameSelected: {
    color: COLORS.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

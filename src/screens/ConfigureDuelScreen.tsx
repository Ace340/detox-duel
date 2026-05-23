import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Card, Button } from '../components/ui';
import { AppPicker } from '../components/AppPicker';
import { COLORS, SPACING } from '../constants/theme';
import type { DuelType } from '../types/duel';

interface RouteParams {
  selectedFriendIds: string[];
}

interface ConfigureDuelScreenProps {
  route: {
    params: RouteParams;
  };
  navigation: any;
}

const DUEL_TYPES = [
  {
    type: 'focus_sprint' as DuelType,
    title: 'Focus Sprint',
    description: '24 hours of focused competition',
    icon: '🏃',
    durationHours: 24,
  },
  {
    type: 'weekly_war' as DuelType,
    title: 'Weekly War',
    description: '7 days of screen time battle',
    icon: '⚔️',
    durationHours: 168,
  },
  {
    type: 'streak_battle' as DuelType,
    title: 'Streak Battle',
    description: 'Compete on maintaining streaks',
    icon: '🔥',
    durationHours: 0, // Calculated from days input
  },
  {
    type: 'quick_duel' as DuelType,
    title: 'Quick Duel',
    description: '2 hours rapid challenge',
    icon: '⚡',
    durationHours: 2,
  },
];

export default function ConfigureDuelScreen({ route, navigation }: ConfigureDuelScreenProps) {
  const { selectedFriendIds } = route.params;
  const [selectedDuelType, setSelectedDuelType] = useState<DuelType | null>(null);
  const [streakDays, setStreakDays] = useState('3');
  const [bannedApps, setBannedApps] = useState<string[]>([]);

  const toggleApp = (packageName: string) => {
    setBannedApps(prev =>
      prev.includes(packageName)
        ? prev.filter(pkg => pkg !== packageName)
        : [...prev, packageName]
    );
  };

  const getDurationHours = (): number => {
    if (!selectedDuelType) return 0;

    const selected = DUEL_TYPES.find(d => d.type === selectedDuelType);
    if (!selected) return 0;

    if (selectedDuelType === 'streak_battle') {
      const days = parseInt(streakDays) || 3;
      return days * 24;
    }

    return selected.durationHours;
  };

  const handleReview = () => {
    if (!selectedDuelType) return;

    navigation.navigate('ReviewDuel', {
      selectedFriendIds,
      duelType: selectedDuelType,
      durationHours: getDurationHours(),
      bannedApps,
    });
  };

  const canReview = selectedDuelType !== null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card title="Choose Duel Type" subtitle="Select how you want to compete">
        <View style={styles.duelTypesGrid}>
          {DUEL_TYPES.map((duel) => (
            <TouchableOpacity
              key={duel.type}
              style={[
                styles.duelTypeCard,
                selectedDuelType === duel.type && styles.duelTypeCardSelected,
              ]}
              onPress={() => setSelectedDuelType(duel.type)}
            >
              <Text style={styles.duelIcon}>{duel.icon}</Text>
              <Text style={[
                styles.duelTitle,
                selectedDuelType === duel.type && styles.duelTitleSelected,
              ]}>
                {duel.title}
              </Text>
              <Text style={styles.duelDescription}>{duel.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedDuelType === 'streak_battle' && (
          <View style={styles.streakInputContainer}>
            <Text style={styles.label}>Number of days:</Text>
            <TextInput
              style={styles.streakInput}
              value={streakDays}
              onChangeText={setStreakDays}
              keyboardType="number-pad"
              placeholder="3"
              maxLength={2}
            />
          </View>
        )}
      </Card>

      <Card title="Banned Apps" subtitle={`Select apps to block (${bannedApps.length} selected)`}>
        <AppPicker selected={bannedApps} onToggle={toggleApp} />
      </Card>

      <Button
        title="Review Challenge"
        onPress={handleReview}
        variant="primary"
        disabled={!canReview}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },
  duelTypesGrid: {
    gap: SPACING.sm,
  },
  duelTypeCard: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  duelTypeCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}20`,
  },
  duelIcon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  duelTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  duelTitleSelected: {
    color: COLORS.primary,
  },
  duelDescription: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  streakInputContainer: {
    marginTop: SPACING.md,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: SPACING.sm,
  },
  streakInput: {
    backgroundColor: COLORS.surfaceLight,
    color: COLORS.text,
    fontSize: 16,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

interface OnboardingGoalSliderProps {
  value: number;
  onChange: (value: number) => void;
}

const { width, height } = Dimensions.get('window');

export default function OnboardingGoalSlider({ value, onChange }: OnboardingGoalSliderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>⏱️</Text>
      <Text style={styles.title}>Set Your Daily Goal</Text>
      <Text style={styles.description}>
        How many hours of screen time do you want to limit yourself to each day?
      </Text>

      <View style={styles.sliderContainer}>
        <Text style={styles.valueText}>{value} hours</Text>
        <View style={styles.sliderButtons}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((hour) => (
            <TouchableOpacity
              key={hour}
              style={[styles.sliderButton, value === hour && styles.sliderButtonActive]}
              onPress={() => onChange(hour)}
            >
              <Text style={[styles.sliderButtonText, value === hour && styles.sliderButtonTextActive]}>
                {hour}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  emoji: {
    fontSize: 60,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.md,
    maxWidth: width * 0.8,
  },
  sliderContainer: {
    width: '100%',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  sliderButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.xs,
    width: '100%',
  },
  sliderButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  sliderButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sliderButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  sliderButtonTextActive: {
    color: COLORS.background,
  },
});

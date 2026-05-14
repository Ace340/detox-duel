import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { FOCUS_CATEGORIES, CategoryType } from '../constants/categories';
import { CategoryChip } from './CategoryChip';

interface CategoryPickerProps {
  selectedCategory?: string;
  onSelectCategory: (category: string | undefined) => void;
  title?: string;
}

export function CategoryPicker({
  selectedCategory,
  onSelectCategory,
  title = 'What are you focusing on?',
}: CategoryPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* "None" option for uncategorized sessions */}
        <CategoryChip
          categoryId={undefined}
          selected={!selectedCategory}
          onPress={() => onSelectCategory(undefined)}
        />

        {/* Category options */}
        {FOCUS_CATEGORIES.map((category) => (
          <CategoryChip
            key={category.id}
            categoryId={category.id}
            selected={selectedCategory === category.id}
            onPress={() => onSelectCategory(category.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  title: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  scrollContent: {
    paddingRight: SPACING.lg,
  },
});
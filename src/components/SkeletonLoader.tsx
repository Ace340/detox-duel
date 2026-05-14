import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  style?: any;
}

export function Skeleton({ width = '100%', height = 20, style }: SkeletonProps) {
  return (
    <View style={[styles.skeleton, { width, height }, style]} />
  );
}

export function CardSkeleton() {
  return (
    <View style={styles.cardSkeleton}>
      <Skeleton height={20} width="60%" style={styles.titleSkeleton} />
      <Skeleton height={14} width="40%" style={styles.subtitleSkeleton} />
      <View style={styles.contentSkeleton}>
        <Skeleton height={16} style={styles.itemSkeleton} />
        <Skeleton height={16} style={styles.itemSkeleton} />
        <Skeleton height={16} width="70%" />
      </View>
    </View>
  );
}

export function ListItemSkeleton() {
  return (
    <View style={styles.listItemSkeleton}>
      <View style={styles.avatarSkeleton} />
      <View style={styles.textSkeleton}>
        <Skeleton height={16} width="50%" style={styles.itemSkeleton} />
        <Skeleton height={14} width="30%" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
  },
  cardSkeleton: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  titleSkeleton: {
    marginBottom: 4,
  },
  subtitleSkeleton: {
    marginBottom: 12,
  },
  contentSkeleton: {
    gap: 8,
  },
  itemSkeleton: {
    marginBottom: 4,
  },
  listItemSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  avatarSkeleton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceLight,
  },
  textSkeleton: {
    flex: 1,
  },
});
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ViewStyle } from 'react-native';
import { Card } from '../components/ui';
import { COLORS, SPACING } from '../constants/theme';
import { FOCUS_CATEGORIES, calculateCategoryStats, formatMinutesToHours } from '../constants/categories';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';

interface CategoryStat {
  category: string;
  totalMinutes: number;
  percentage: number;
}

interface DonutSegmentProps {
  percentage: number;
  color: string;
  offset: number;
  size: number;
  strokeWidth: number;
}

// Simple donut segment using border
function DonutSegment({ percentage, color, offset, size, strokeWidth }: DonutSegmentProps) {
  if (percentage === 0) return null;

  const circumference = 2 * Math.PI * ((size - strokeWidth) / 2);
  const dashArray = `${(percentage / 100) * circumference} ${circumference}`;
  const rotation = offset * 3.6; // Convert percentage to degrees

  return (
    <View
      style={[
        styles.donutSegment,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: color,
          transform: [{ rotate: `${rotation}deg` }],
        },
      ]}
    />
  );
}

export default function CategoryStatsScreen() {
  const { user } = useAuth();
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategoryStats();
  }, [user?.id]);

  const loadCategoryStats = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const { data: sessions, error } = await supabase
        .from('focus_sessions')
        .select('category, duration_minutes')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('start_time', { ascending: false })
        .limit(1000); // Get all sessions for accurate stats

      if (error) {
        console.error('Failed to load category stats:', error);
        return;
      }

      if (sessions) {
        const stats = calculateCategoryStats(sessions);
        setCategoryStats(stats);
      }
    } catch (error) {
      console.error('Error loading category stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderDonutChart = () => {
    if (categoryStats.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>No data yet</Text>
        </View>
      );
    }

    const size = 200;
    const strokeWidth = 30;

    // Calculate cumulative percentages for rotation
    let cumulativePercentage = 0;

    return (
      <View style={styles.chartContainer}>
        <View style={styles.donutWrapper}>
          {categoryStats.map((stat, index) => {
            const segment = (
              <DonutSegment
                key={stat.category}
                percentage={stat.percentage}
                color={getCategoryColor(stat.category)}
                offset={cumulativePercentage}
                size={size}
                strokeWidth={strokeWidth}
              />
            );
            cumulativePercentage += stat.percentage;
            return segment;
          })}

          {/* Center text showing total hours */}
          <View style={styles.chartCenter}>
            <Text style={styles.totalHours}>
              {formatMinutesToHours(
                categoryStats.reduce((sum, s) => sum + s.totalMinutes, 0)
              )}
            </Text>
            <Text style={styles.totalLabel}>Total</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCategoryList = () => {
    if (categoryStats.length === 0) {
      return (
        <Text style={styles.noDataText}>
          No focus sessions yet. Start focusing to see your stats!
        </Text>
      );
    }

    return categoryStats.map((stat) => {
      const category = FOCUS_CATEGORIES.find(c => c.id === stat.category);
      if (!category) return null;

      return (
        <View key={stat.category} style={styles.categoryRow}>
          <View style={styles.categoryLeft}>
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={styles.categoryName}>{category.label}</Text>
          </View>
          <View style={styles.categoryRight}>
            <Text style={styles.categoryHours}>{formatMinutesToHours(stat.totalMinutes)}</Text>
            <Text style={styles.categoryPercentage}>{stat.percentage}%</Text>
          </View>
        </View>
      );
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading stats...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card title="Category Breakdown" subtitle="How you spend your focus time">
        {renderDonutChart()}
      </Card>

      <Card title="Category Details" subtitle="Detailed breakdown by category">
        {renderCategoryList()}
      </Card>
    </ScrollView>
  );
}

// Helper function to get category color
function getCategoryColor(categoryId: string): string {
  const category = FOCUS_CATEGORIES.find(c => c.id === categoryId);
  return category?.color || COLORS.border;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },
  loadingText: {
    color: COLORS.text,
    fontSize: 16,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
  chartContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  donutWrapper: {
    position: 'relative',
    width: 200,
    height: 200,
  },
  donutSegment: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  chartCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: 'center',
  },
  totalHours: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: 'bold',
  },
  totalLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  emptyChart: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 30,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  categoryName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryHours: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginRight: SPACING.md,
  },
  categoryPercentage: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  noDataText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
});
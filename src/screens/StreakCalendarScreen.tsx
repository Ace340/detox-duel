import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { useStreaks } from '../hooks/useStreaks';
import { getActiveDatesForMonth } from '../utils/streakCalculator';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

interface StreakCalendarScreenProps {
  navigation: any;
}

interface DayCellProps {
  date: Date;
  dayNumber: number;
  isActive: boolean;
  isToday: boolean;
}

// =====================================================
// DAY CELL COMPONENT
// =====================================================

/**
 * DayCell Component
 *
 * Represents a single day in the calendar grid.
 * Shows date number and active status indicator.
 */
function DayCell({ date, dayNumber, isActive, isToday }: DayCellProps) {
  return (
    <TouchableOpacity
      style={[
        styles.dayCell,
        isActive && styles.dayCellActive,
        isToday && styles.dayCellToday,
      ]}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.dayNumber,
          isActive && styles.dayNumberActive,
          isToday && styles.dayNumberToday,
        ]}
      >
        {dayNumber}
      </Text>

      {isActive && <Text style={styles.activeIndicator}>🔥</Text>}
    </TouchableOpacity>
  );
}

// =====================================================
// STREAK CALENDAR SCREEN COMPONENT
// =====================================================

/**
 * Streak Calendar Screen
 *
 * Displays a 30-day calendar view showing active days.
 * Users can see their activity history and current streak.
 */
export default function StreakCalendarScreen({
  navigation,
}: StreakCalendarScreenProps) {
  const [activeDates, setActiveDates] = useState<Date[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const { streaks, loading, fetchStreaks } = useStreaks(''); // User ID will be set dynamically

  // TODO: Get user ID from auth context
  // const { user } = useAuth();
  // const userId = user?.id || '';

  const userId = ''; // Placeholder

  /**
   * Load calendar data
   */
  const loadCalendarData = useCallback(async () => {
    if (!userId) {
      return;
    }

    const dates = await getActiveDatesForMonth(userId, 30);
    setActiveDates(dates);
  }, [userId]);

  /**
   * Handle refresh
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStreaks();
    await loadCalendarData();
    setRefreshing(false);
  }, [fetchStreaks, loadCalendarData]);

  /**
   * Load data on mount
   */
  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  /**
   * Generate 30-day calendar
   */
  const generateCalendarDays = () => {
    const days: Array<{
      date: Date;
      dayNumber: number;
      isActive: boolean;
      isToday: boolean;
    }> = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dayNumber = date.getDate();
      const isActive = activeDates.some(
        activeDate =>
          activeDate.getTime() === date.getTime()
      );
      const isToday = i === 0;

      days.push({ date, dayNumber, isActive, isToday });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  /**
   * Navigate back
   */
  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Streak Calendar</Text>

        <View style={styles.headerSpacer} />
      </View>

      {/* Stats Cards */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Current Streak Card */}
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Current Streak</Text>
          <Text style={styles.statValue}>
            🔥 {streaks?.current_streak || 0} days
          </Text>
        </View>

        {/* Longest Streak Card */}
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Longest Streak</Text>
          <Text style={styles.statValue}>
            👑 {streaks?.longest_streak || 0} days
          </Text>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarContainer}>
          <Text style={styles.calendarTitle}>Last 30 Days</Text>

          <View style={styles.calendarGrid}>
            {calendarDays.map((day, index) => (
              <DayCell
                key={index}
                date={day.date}
                dayNumber={day.dayNumber}
                isActive={day.isActive}
                isToday={day.isToday}
              />
            ))}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDotActive]} />
              <Text style={styles.legendText}>Active Day</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDotToday]} />
              <Text style={styles.legendText}>Today</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDotInactive]} />
              <Text style={styles.legendText}>Inactive</Text>
            </View>
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Tips to maintain your streak:</Text>
          <Text style={styles.tipsText}>
            • Complete at least one focus session each day
          </Text>
          <Text style={styles.tipsText}>
            • Win a duel to extend your streak
          </Text>
          <Text style={styles.tipsText}>
            • Even a short 15-minute session counts!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border || '#2A2A4A',
  },
  backButton: {
    padding: SPACING.sm,
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.text,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
  },
  statCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  calendarContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: '18%',
    aspectRatio: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  dayCellActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  dayCellToday: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.8)',
  },
  dayNumber: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  dayNumberActive: {
    color: '#EF4444',
    fontWeight: '600',
  },
  dayNumberToday: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  activeIndicator: {
    fontSize: 12,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.md,
    gap: SPACING.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendDotActive: {
    backgroundColor: '#EF4444',
  },
  legendDotToday: {
    backgroundColor: '#3B82F6',
  },
  legendDotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  legendText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  tipsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  tipsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    lineHeight: 20,
  },
});

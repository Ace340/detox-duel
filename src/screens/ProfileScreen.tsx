import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, Button } from '../components/ui';
import { BadgeCard } from '../components/BadgeCard';
import { COLORS, SPACING } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useFocusSession } from '../hooks/useFocusSession';
import { useStreaks } from '../hooks/useStreaks';
import { useDuelHistory } from '../hooks/useDuelHistory';
import { useBadges } from '../hooks/useBadges';
import { useNotifications } from '../hooks/useNotifications';
import {
  requestNotificationPermission,
  savePushToken,
  scheduleDailyReminder,
  scheduleWeeklySummary,
  cancelAllNotifications,
} from '../services/notifications';

// =====================================================
// HELPER COMPONENTS
// =====================================================

interface AvatarProps {
  username?: string;
  avatarUrl?: string;
  size?: number;
}

function Avatar({ username, avatarUrl, size = 80 }: AvatarProps) {
  const initials = username
    ? username
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??';

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {avatarUrl ? (
        <Text style={styles.avatarText}>{initials}</Text>
      ) : (
        <Text style={styles.avatarText}>{initials}</Text>
      )}
    </View>
  );
}

interface StatItemProps {
  icon: string;
  label: string;
  value: string | number;
}

function StatItem({ icon, label, value }: StatItemProps) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

interface WinRateBarProps {
  wins: number;
  losses: number;
}

function WinRateBar({ wins, losses }: WinRateBarProps) {
  const total = wins + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  return (
    <View style={styles.winRateContainer}>
      <View style={styles.winRateBarBackground}>
        <View style={[styles.winRateBarFill, { width: `${winRate}%` }]} />
      </View>
      <Text style={styles.winRateText}>{winRate}% win rate</Text>
    </View>
  );
}

interface WeeklyComparisonProps {
  thisWeek: number;
  lastWeek: number;
}

function WeeklyComparison({ thisWeek, lastWeek }: WeeklyComparisonProps) {
  const diff = thisWeek - lastWeek;
  const percent = lastWeek > 0 ? Math.round((diff / lastWeek) * 100) : 0;
  const isPositive = diff >= 0;

  return (
    <View style={styles.weeklyContainer}>
      <View style={styles.weeklyLabels}>
        <Text style={styles.weeklyLabel}>This Week</Text>
        <Text style={styles.weeklyLabel}>Last Week</Text>
      </View>
      <View style={styles.weeklyValues}>
        <Text style={styles.weeklyValue}>{thisWeek}h</Text>
        <Text style={styles.weeklyValue}>{lastWeek}h</Text>
      </View>
      <View style={[styles.weeklyChange, isPositive ? styles.positiveChange : styles.negativeChange]}>
        <Text style={styles.weeklyChangeText}>
          {isPositive ? '↑' : '↓'} {Math.abs(percent)}%
        </Text>
      </View>
    </View>
  );
}

interface SettingItemProps {
  icon: string;
  label: string;
  value?: string | number;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

function SettingItem({ icon, label, value, onPress, rightElement }: SettingItemProps) {
  return (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={!onPress}>
      <View style={styles.settingLeft}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <View style={styles.settingRight}>
        {value && <Text style={styles.settingValue}>{value}</Text>}
        {rightElement}
      </View>
    </TouchableOpacity>
  );
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, signOut } = useAuth();
  const { todayTotal } = useFocusSession(user?.id || '');
  const { streaks } = useStreaks(user?.id || '');
  const { stats, loadHistory } = useDuelHistory(user?.id || '');
  const { userBadges, badges } = useBadges(user?.id);
  const { notifications, unreadCount, loadNotifications, markAllRead } = useNotifications(user?.id || '');

  const [notifEnabled, setNotifEnabled] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(2); // Default 2 hours

  useEffect(() => {
    loadNotifications();
    loadHistory();
  }, [user?.id]);

  const handleEnableNotifications = async () => {
    const ok = await savePushToken(user?.id || '');
    if (ok) {
      await scheduleDailyReminder();
      await scheduleWeeklySummary();
      setNotifEnabled(true);
    } else {
      setNotifEnabled(false);
    }
  };

  const handleDisableNotifications = async () => {
    await cancelAllNotifications();
    setNotifEnabled(false);
  };

  const handleToggleNotifications = () => {
    if (notifEnabled) {
      handleDisableNotifications();
    } else {
      handleEnableNotifications();
    }
  };

  // Format member since date
  const getMemberSince = () => {
    if (!user?.created_at) return 'Unknown';
    const date = new Date(user.created_at);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Calculate total focus hours (from all sessions, not just today)
  const totalFocusHours = Math.floor(todayTotal / 60);

  // Get earned badges
  const earnedBadges = userBadges?.map((userBadge) => {
    return badges?.find((b) => b.id === userBadge.badge_id);
  }).filter(Boolean);

  // Calculate weekly comparison (placeholder data - would need real tracking)
  const thisWeekHours = totalFocusHours;
  const lastWeekHours = totalFocusHours > 0 ? totalFocusHours - 1 : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top User Section */}
      <View style={styles.userSection}>
        <Avatar username={user?.username} avatarUrl={user?.avatar_url} size={100} />
        <Text style={styles.username}>{user?.username || 'User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.memberSince}>Member since {getMemberSince()}</Text>
      </View>

      {/* Stats Row */}
      <Card title="Your Stats">
        <View style={styles.statsRow}>
          <StatItem icon="⏱️" label="Focus Hrs" value={totalFocusHours} />
          <StatItem icon="🏆" label="Duels Won" value={stats.wins} />
          <StatItem icon="🔥" label="Current" value={streaks?.current_streak || 0} />
          <StatItem icon="⭐" label="Best" value={streaks?.longest_streak || 0} />
        </View>
      </Card>

      {/* Duel Record */}
      <Card title="Duel Record">
        <Text style={styles.duelRecordText}>
          {stats.wins}W - {stats.losses}L
        </Text>
        {stats.totalDuels > 0 ? (
          <WinRateBar wins={stats.wins} losses={stats.losses} />
        ) : (
          <Text style={styles.noDuelsText}>No duels yet</Text>
        )}
      </Card>

      {/* Badges Section */}
      <Card
        title="Badges"
        subtitle={
          earnedBadges && earnedBadges.length > 0
            ? `${earnedBadges.length} earned`
            : 'Keep focused to earn badges!'
        }
      >
        {earnedBadges && earnedBadges.length > 0 ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesScroll}>
              {earnedBadges.map((badge) => (
                <View key={badge?.id} style={styles.badgeScrollItem}>
                  <BadgeCard badge={badge!} isEarned={true} style={styles.badgeCardSmall} />
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => navigation.navigate('Badges' as never)}
            >
              <Text style={styles.seeAllText}>See All →</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.noBadgesText}>No badges earned yet</Text>
        )}
      </Card>

      {/* Weekly Summary */}
      <Card title="Weekly Summary">
        <WeeklyComparison thisWeek={thisWeekHours} lastWeek={lastWeekHours} />
      </Card>

      {/* Settings Section */}
      <Card title="Settings">
        <SettingItem
          icon="👤"
          label="Edit Profile"
          onPress={() => console.log('Edit profile - placeholder')}
        />
        <SettingItem
          icon="🔔"
          label="Notifications"
          value={notifEnabled ? 'Enabled' : 'Disabled'}
          onPress={handleToggleNotifications}
          rightElement={
            <View style={[styles.toggleDot, notifEnabled && styles.toggleDotOn]} />
          }
        />
        <View style={styles.dailyGoalContainer}>
          <View style={styles.dailyGoalHeader}>
            <Text style={styles.settingIcon}>🎯</Text>
            <Text style={styles.settingLabel}>Daily Goal</Text>
          </View>
          <View style={styles.dailyGoalInputContainer}>
            <TouchableOpacity
              style={styles.goalButton}
              onPress={() => setDailyGoal(Math.max(1, dailyGoal - 1))}
            >
              <Text style={styles.goalButtonText}>-</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.goalInput}
              value={dailyGoal.toString()}
              onChangeText={(text) => setDailyGoal(Math.max(1, parseInt(text) || 1))}
              keyboardType="number-pad"
              textAlign="center"
            />
            <TouchableOpacity
              style={styles.goalButton}
              onPress={() => setDailyGoal(dailyGoal + 1)}
            >
              <Text style={styles.goalButtonText}>+</Text>
            </TouchableOpacity>
            <Text style={styles.goalUnit}>hrs</Text>
          </View>
        </View>
        <SettingItem
          icon="🌙"
          label="Theme"
          value="Dark"
          onPress={() => console.log('Theme toggle - placeholder')}
        />
        <SettingItem
          icon="🔒"
          label="Privacy"
          onPress={() => console.log('Privacy settings - placeholder')}
        />
        <SettingItem
          icon="📱"
          label="Screen Time Test"
          onPress={() => navigation.navigate('ScreenTimeTest' as never)}
        />
      </Card>

      {/* Sign Out Button */}
      <Button
        title="Sign Out"
        onPress={signOut}
        variant="outline"
        style={styles.signOutButton}
      />

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <Card
          title={`Recent Notifications (${unreadCount} unread)`}
          subtitle="Your latest activity"
        >
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead}>
              <Text style={styles.markReadText}>Mark all as read</Text>
            </TouchableOpacity>
          )}
          {notifications.slice(0, 5).map((n) => (
            <View key={n.id} style={[styles.notifRow, !n.read && styles.unreadNotif]}>
              <Text style={styles.notifTitle}>{n.title}</Text>
              <Text style={styles.notifBody}>{n.body}</Text>
              <Text style={styles.notifTime}>
                {new Date(n.created_at).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
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
  content: {
    padding: SPACING.lg,
  },

  // User Section
  userSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  avatar: {
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  avatarText: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
  },
  username: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  email: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: SPACING.sm,
  },
  memberSince: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
    width: '48%',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    marginBottom: SPACING.sm,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  statValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },

  // Duel Record
  duelRecordText: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  noDuelsText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
  winRateContainer: {
    marginTop: SPACING.sm,
  },
  winRateBarBackground: {
    height: 8,
    backgroundColor: COLORS.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  winRateBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  winRateText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },

  // Badges Section
  badgesScroll: {
    marginBottom: SPACING.md,
  },
  badgeScrollItem: {
    width: 140,
    marginRight: SPACING.md,
  },
  badgeCardSmall: {
    minHeight: 120,
  },
  seeAllButton: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  seeAllText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  noBadgesText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },

  // Weekly Summary
  weeklyContainer: {
    paddingVertical: SPACING.md,
  },
  weeklyLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  weeklyLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  weeklyValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  weeklyValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  weeklyChange: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
  },
  positiveChange: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  negativeChange: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  weeklyChangeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  positiveChangeText: {
    color: COLORS.success,
  },
  negativeChangeText: {
    color: COLORS.error,
  },

  // Settings
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: SPACING.md,
  },
  settingLabel: {
    color: COLORS.text,
    fontSize: 14,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginRight: SPACING.sm,
  },
  toggleDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.border,
  },
  toggleDotOn: {
    backgroundColor: COLORS.success,
  },

  // Daily Goal Input
  dailyGoalContainer: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dailyGoalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  dailyGoalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: SPACING.sm,
  },
  goalButtonText: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  goalInput: {
    width: 60,
    height: 40,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  goalUnit: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginLeft: SPACING.sm,
  },

  // Sign Out
  signOutButton: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },

  // Notifications
  markReadText: {
    color: COLORS.primary,
    fontSize: 14,
    marginBottom: SPACING.sm,
  },
  notifRow: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  unreadNotif: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 8,
    paddingHorizontal: SPACING.sm,
  },
  notifTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  notifBody: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  notifTime: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
});

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, Button } from '../components/ui';
import { BadgeCard } from '../components/BadgeCard';
import { NotificationPreferenceToggle } from '../components/NotificationPreferenceToggle';
import { COLORS, SPACING } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useFocusSession } from '../hooks/useFocusSession';
import { useStreaks } from '../hooks/useStreaks';
import { useDuelHistory } from '../hooks/useDuelHistory';
import { useBadges } from '../hooks/useBadges';
import { useNotifications } from '../hooks/useNotifications';
import { usePoints } from '../hooks/usePoints';
import { getRankTier } from '../types/points';
import {
  requestNotificationPermission,
  savePushToken,
  scheduleDailyReminder,
  scheduleWeeklySummary,
  cancelAllNotifications,
} from '../services/notifications';
import type { NotificationPreferences } from '../types';

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
  const { notifications, unreadCount, loadNotifications, markAllRead, preferences, loadPreferences, updatePreferences } = useNotifications(user?.id || '');
  // Only call usePoints with a valid userId (empty strings cause UUID errors)
  const validUserId = user?.id && user.id.trim() !== '' ? user.id : '';
  const { userPoints, recentTransactions, currentTier, tierProgress, refreshPoints } = usePoints(validUserId);

  const [notifEnabled, setNotifEnabled] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(2); // Default 2 hours
  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    // Only load data if user is authenticated
    if (user?.id && user.id.trim() !== '') {
      loadNotifications();
      loadPreferences();
      loadHistory();
      refreshPoints();
    }
  }, [user?.id, loadNotifications, loadPreferences, loadHistory, refreshPoints]);

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

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

  const handleNotificationPreferenceChange = async (
    key: keyof NotificationPreferences,
    value: boolean
  ) => {
    if (!localPreferences) return;

    // Update local state immediately for responsiveness
    setLocalPreferences({
      ...localPreferences,
      [key]: value,
    });

    // Persist to database
    await updatePreferences({ [key]: value });
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

  // Calculate points to next tier
  const pointsToNextTier = currentTier
    ? Math.max(0, currentTier.minPoints + (currentTier.maxPoints - currentTier.minPoints) - userPoints?.total_points || 0)
    : 0;

  // Get transaction icon based on reason
  const getTransactionIcon = (reason: string): string => {
    const icons: Record<string, string> = {
      session_complete: '⏱️',
      duel_win: '🏆',
      duel_complete: '⚔️',
      streak_milestone: '🔥',
      badge_earned: '🏅',
      leaderboard_bonus: '🎯',
    };
    return icons[reason] || '🪙';
  };

  // Format relative time
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

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

      {/* Points Section */}
      <Card title="Points & Rank" subtitle="Your gamification progress">
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsDisplay}>
            {userPoints?.total_points || 0} <Text style={styles.pointsEmoji}>🪙</Text>
          </Text>
          <View style={styles.rankContainer}>
            <Text style={styles.rankEmoji}>{currentTier?.emoji || '🥉'}</Text>
            <View>
              <Text style={styles.rankName}>{currentTier?.name || 'Bronze'}</Text>
              <Text style={styles.rankLabel}>
                {pointsToNextTier > 0
                  ? `${pointsToNextTier} to ${getRankTier((currentTier?.maxPoints || 0) + 1)?.name || 'Next'}`
                  : 'Max tier reached!'}
              </Text>
            </View>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${tierProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>{tierProgress}% to next tier</Text>
          </View>
        </View>
      </Card>

      {/* Points History */}
      <Card title="Points History" subtitle="Recent transactions">
        {recentTransactions.length === 0 ? (
          <Text style={styles.noTransactionsText}>No transactions yet</Text>
        ) : (
          recentTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionRow}>
              <View style={styles.transactionLeft}>
                <Text style={styles.transactionIcon}>
                  {getTransactionIcon(transaction.reason)}
                </Text>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionReason}>
                    {transaction.reason.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                  <Text style={styles.transactionTime}>
                    {formatRelativeTime(transaction.created_at)}
                  </Text>
                </View>
              </View>
              <Text style={styles.transactionAmount}>+{transaction.amount}</Text>
            </View>
          ))
        )}
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

      {/* Category Stats */}
      <Card
        title="Category Stats"
        subtitle="See how you spend your focus time"
      >
        <SettingItem
          icon="📊"
          label="View Category Breakdown"
          onPress={() => navigation.navigate('CategoryStats' as never)}
          rightElement={<Text style={styles.settingArrow}>→</Text>}
        />
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

        {/* Notification Preferences */}
        {notifEnabled && localPreferences && (
          <>
            <View style={styles.preferencesHeader}>
              <Text style={styles.preferencesTitle}>Notification Preferences</Text>
            </View>
            <NotificationPreferenceToggle
              icon="⚔️"
              label="Duel Challenges"
              value={localPreferences.duel_challenges}
              onChange={(value) => handleNotificationPreferenceChange('duel_challenges', value)}
            />
            <NotificationPreferenceToggle
              icon="🏆"
              label="Duel Results"
              value={localPreferences.duel_results}
              onChange={(value) => handleNotificationPreferenceChange('duel_results', value)}
            />
            <NotificationPreferenceToggle
              icon="🏅"
              label="Badges"
              value={localPreferences.badges}
              onChange={(value) => handleNotificationPreferenceChange('badges', value)}
            />
            <NotificationPreferenceToggle
              icon="🔥"
              label="Streak Milestones"
              value={localPreferences.streaks}
              onChange={(value) => handleNotificationPreferenceChange('streaks', value)}
            />
            <NotificationPreferenceToggle
              icon="📊"
              label="Weekly Summary"
              value={localPreferences.weekly_summary}
              onChange={(value) => handleNotificationPreferenceChange('weekly_summary', value)}
            />
          </>
        )}
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

  // Points Section
  pointsContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  pointsDisplay: {
    color: COLORS.text,
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  pointsEmoji: {
    fontSize: 36,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    width: '100%',
  },
  rankEmoji: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  rankName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  rankLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  progressContainer: {
    width: '100%',
    marginTop: SPACING.sm,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: COLORS.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },

  // Points History
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    fontSize: 20,
    marginRight: SPACING.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionReason: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  transactionTime: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  transactionAmount: {
    color: COLORS.success,
    fontSize: 16,
    fontWeight: 'bold',
  },
  noTransactionsText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
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

  // Notification Preferences
  preferencesHeader: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  preferencesTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
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
  settingArrow: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
});

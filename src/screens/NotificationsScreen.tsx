import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationItem } from '../components/NotificationItem';
import type { AppNotification } from '../hooks/useNotifications';

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markAsRead,
    markAllRead,
  } = useNotifications(user?.id || '');

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    }
  }, [user?.id]);

  const handleNotificationPress = useCallback(async (notification: AppNotification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    navigateToRelevantScreen(notification);
  }, [markAsRead]);

  const navigateToRelevantScreen = useCallback((notification: AppNotification) => {
    switch (notification.type) {
      case 'duel_challenge':
        navigation.navigate('DuelChallenge' as never, {
          duelId: notification.data.duel_id,
          opponentId: notification.from_user_id || '',
        } as never);
        break;

      case 'duel_result':
        navigation.navigate('DuelResults' as never, {
          duelId: notification.data.duel_id,
        } as never);
        break;

      case 'badge_earned':
        navigation.navigate('Badges' as never, undefined as never);
        break;

      case 'friend_request':
      case 'friend_accepted':
        // Navigate to friends screen
        navigation.navigate('Friends' as never, undefined as never);
        break;

      case 'streak_milestone':
        // Navigate to streak calendar
        navigation.navigate('StreakCalendar' as never, undefined as never);
        break;

      case 'weekly_summary':
        // Stay on notifications screen for weekly summary
        break;

      default:
        console.warn('Unknown notification type:', notification.type);
    }
  }, [navigation]);

  const handleMarkAllRead = async () => {
    await markAllRead();
    await loadNotifications();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllRead}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadNotifications}
            tintColor={COLORS.primary}
          />
        }
      >
        {loading && notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Loading notifications...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>
              You'll see notifications here when you receive challenges, earn badges, or reach milestones
            </Text>
          </View>
        ) : (
          <>
            {unreadCount > 0 && (
              <Text style={styles.sectionTitle}>
                Unread ({unreadCount})
              </Text>
            )}

            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onPress={handleNotificationPress}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  markAllRead: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
});

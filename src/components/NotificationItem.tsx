import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import type { AppNotification } from '../hooks/useNotifications';

interface NotificationItemProps {
  notification: AppNotification;
  onPress: (notification: AppNotification) => void;
}

export function NotificationItem({ notification, onPress }: NotificationItemProps) {
  const getIconForType = (type: string): string => {
    const icons: Record<string, string> = {
      friend_request: '👋',
      friend_accepted: '🤝',
      duel_challenge: '⚔️',
      duel_result: '🏆',
      badge_earned: '🏅',
      streak_milestone: '🔥',
      weekly_summary: '📊',
    };
    return icons[type] || '📢';
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !notification.read && styles.unread,
      ]}
      onPress={() => onPress(notification)}
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        <Text style={styles.icon}>{getIconForType(notification.type)}</Text>
        <View style={styles.content}>
          <Text style={[styles.title, !notification.read && styles.unreadTitle]}>
            {notification.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {notification.body}
          </Text>
          <Text style={styles.time}>{formatTimeAgo(notification.created_at)}</Text>
        </View>
      </View>
      {!notification.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: SPACING.sm,
  },
  unread: {
    backgroundColor: `${COLORS.primary}15`,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  icon: {
    fontSize: 24,
    marginRight: SPACING.md,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: '700',
    color: COLORS.text,
  },
  body: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 4,
    lineHeight: 18,
  },
  time: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.sm,
  },
});

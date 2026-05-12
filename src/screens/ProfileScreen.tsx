import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, Button } from '../components/ui';
import { COLORS, SPACING } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useFocusSession } from '../hooks/useFocusSession';
import { useNotifications } from '../hooks/useNotifications';
import { requestNotificationPermission, savePushToken, scheduleDailyReminder, scheduleWeeklySummary, cancelAllNotifications } from '../services/notifications';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, signOut } = useAuth();
  const { todayTotal } = useFocusSession(user?.id || '');
  const { notifications, unreadCount, loadNotifications, markAllRead } = useNotifications(user?.id || '');
  const [notifEnabled, setNotifEnabled] = useState(false);

  useEffect(() => { loadNotifications(); }, [user?.id]);

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile 👤</Text>

      <Card title={user?.username || 'User'} subtitle={user?.email}>
        <Text style={styles.stat}>📅 Total focus time: {todayTotal} min</Text>
      </Card>

      {/* Notifications */}
      <Card
        title="Notifications 🔔"
        subtitle={notifEnabled ? 'Enabled' : 'Enable to get reminders and updates'}
      >
        {!notifEnabled ? (
          <Button title="Enable Notifications" onPress={handleEnableNotifications} />
        ) : (
          <>
            <Text style={styles.stat}>✅ Daily focus reminder (9 AM)</Text>
            <Text style={styles.stat}>✅ Weekly summary (Monday 10 AM)</Text>
            <Text style={styles.stat}>✅ Session halfway reminder</Text>
            <View style={styles.spacer} />
            <Button title="Disable Notifications" variant="secondary" onPress={handleDisableNotifications} />
          </>
        )}
      </Card>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <Card
          title={`Recent (${unreadCount} unread)`}
          subtitle="Your latest notifications"
        >
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead}>
              <Text style={styles.markRead}>Mark all as read</Text>
            </TouchableOpacity>
          )}
          {notifications.slice(0, 5).map(n => (
            <View key={n.id} style={[styles.notifRow, !n.read && styles.unread]}>
              <Text style={styles.notifTitle}>{n.title}</Text>
              <Text style={styles.notifBody}>{n.body}</Text>
              <Text style={styles.notifTime}>
                {new Date(n.created_at).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </Card>
      )}

      {/* Screen Time Test (Development Only) */}
      <Card title="Development Tools 🧪" subtitle="Testing features in development">
        <Button
          title="Test Screen Time Tracking"
          onPress={() => navigation.navigate('ScreenTimeTest' as never)}
        />
      </Card>

      <Card title="Settings">
        <Button title="Sign Out" variant="secondary" onPress={signOut} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  title: { color: COLORS.text, fontSize: 28, fontWeight: 'bold', marginBottom: SPACING.lg },
  stat: { color: COLORS.text, fontSize: 16, marginBottom: SPACING.sm },
  spacer: { height: SPACING.md },
  markRead: { color: COLORS.primary, fontSize: 14, marginBottom: SPACING.sm },
  notifRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  unread: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  notifTitle: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  notifBody: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  notifTime: { color: COLORS.textSecondary, fontSize: 11, marginTop: 4 },
});

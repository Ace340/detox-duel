import { Platform } from 'react-native';
import { supabase } from '../services/supabase';

/**
 * Lazy-load expo-notifications to avoid crashes in Expo Go.
 * Static imports evaluate native code at startup — lazy import defers
 * until first use and catches the failure gracefully.
 */

type NotificationsModule = typeof import('expo-notifications');

let cachedNotifications: NotificationsModule | null = null;
let loadAttempted = false;
let isAvailable = false;

async function getNotifications(): Promise<NotificationsModule | null> {
  if (loadAttempted) return isAvailable ? cachedNotifications : null;
  loadAttempted = true;

  try {
    const mod = await import('expo-notifications');
    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    cachedNotifications = mod;
    isAvailable = true;
    return mod;
  } catch {
    console.warn(
      'expo-notifications not available. Push notifications require a development build.'
    );
    return null;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  const Notifications = await getNotifications();
  if (!Notifications) return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permission denied');
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  return true;
}

export async function getPushToken(): Promise<string | null> {
  const Notifications = await getNotifications();
  if (!Notifications) return null;

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync();
    return token;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

export async function savePushToken(userId: string): Promise<boolean> {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return false;

  const token = await getPushToken();
  if (!token) return false;

  const { error } = await supabase
    .from('users')
    .update({ push_token: token })
    .eq('id', userId);

  if (error) {
    console.error('Error saving push token:', error);
    return false;
  }

  return true;
}

// Schedule a session reminder notification
export async function scheduleSessionReminder(
  durationMinutes: number
): Promise<string | null> {
  const Notifications = await getNotifications();
  if (!Notifications) return null;

  // Remind at 50% of session
  const triggerSeconds = Math.floor(durationMinutes * 60 * 0.5);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎯 Halfway there!',
      body: `You're ${Math.floor(durationMinutes / 2)} minutes into your ${durationMinutes} min session. Keep going!`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: triggerSeconds,
    },
  });

  return id;
}

// Cancel a scheduled notification
export async function cancelScheduledNotification(id: string): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) return;
  await Notifications.cancelScheduledNotificationAsync(id);
}

// Cancel all scheduled notifications
export async function cancelAllNotifications(): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Schedule weekly summary (every Monday at 10 AM)
export async function scheduleWeeklySummary(): Promise<string | null> {
  const Notifications = await getNotifications();
  if (!Notifications) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🏆 Weekly Results Are In!',
      body: 'Check the leaderboard to see how you ranked against your friends this week!',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      weekday: 2, // Monday
      hour: 10,
      minute: 0,
      repeats: true,
    },
  });

  return id;
}

// Schedule daily focus reminder (every day at 9 AM)
export async function scheduleDailyReminder(): Promise<string | null> {
  const Notifications = await getNotifications();
  if (!Notifications) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🧠 Time to focus!',
      body: 'Start a focus session and climb the leaderboard today.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: 9,
      minute: 0,
      repeats: true,
    },
  });

  return id;
}

// Show immediate notification (e.g., friend request received)
export async function showImmediateNotification(
  title: string,
  body: string
): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: null, // immediate
  });
}

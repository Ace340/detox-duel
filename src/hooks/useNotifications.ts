import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import type { Notification, NotificationType, NotificationPreferences } from '../types';

export interface AppNotification {
  id: string;
  type: NotificationType;
  from_user_id?: string;
  title: string;
  body: string;
  data: Record<string, any>;
  read: boolean;
  created_at: string;
  from_username?: string;
}

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !data) {
      console.error('Error loading notifications:', error);
      setLoading(false);
      return;
    }

    // Fetch from_user usernames
    const fromIds = data.filter(n => n.from_user_id).map(n => n.from_user_id);
    let userMap = new Map<string, string>();

    if (fromIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, username')
        .in('id', fromIds);
      for (const u of users || []) {
        userMap.set(u.id, u.username);
      }
    }

    const mapped: AppNotification[] = data.map(n => ({
      ...n,
      from_username: n.from_user_id ? userMap.get(n.from_user_id) : undefined,
    }));

    setNotifications(mapped);
    setUnreadCount(mapped.filter(n => !n.read).length);
    setLoading(false);
  }, [userId]);

  const loadPreferences = useCallback(async () => {
    if (!userId) return;

    // Try to load existing preferences
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No preferences exist for this user - create defaults
      const defaultPreferences = {
        user_id: userId,
        duel_challenges: true,
        duel_results: true,
        badges: true,
        streaks: true,
        weekly_summary: false,
      };

      const { data: newData, error: insertError } = await supabase
        .from('notification_preferences')
        .insert([defaultPreferences])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating default notification preferences:', insertError);
        return;
      }

      setPreferences(newData);
      return;
    }

    if (error) {
      console.error('Error loading notification preferences:', error);
      return;
    }

    setPreferences(data);
  }, [userId]);

  const updatePreferences = useCallback(async (
    updates: Partial<NotificationPreferences>
  ): Promise<boolean> => {
    if (!userId) return false;

    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ...updates,
      });

    if (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }

    // Refresh preferences
    await loadPreferences();
    return true;
  }, [userId, loadPreferences]);

  const markAsRead = useCallback(async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [userId]);

  // Insert a notification (used when sending friend request, etc.)
  const createNotification = useCallback(async (
    targetUserId: string,
    type: AppNotification['type'],
    title: string,
    body: string,
    data: Record<string, any> = {}
  ): Promise<boolean> => {
    const { error } = await supabase
      .from('notifications')
      .insert([{
        user_id: targetUserId,
        from_user_id: userId,
        type,
        title,
        body,
        data,
      }]);

    if (error) {
      console.error('Error creating notification:', error);
      return false;
    }
    return true;
  }, [userId]);

  return {
    notifications,
    unreadCount,
    loading,
    preferences,
    loadNotifications,
    loadPreferences,
    markAsRead,
    markAllRead,
    createNotification,
    updatePreferences,
  };
}

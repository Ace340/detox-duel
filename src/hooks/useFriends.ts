import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';

export interface FriendUser {
  id: string;
  username: string;
  avatar_url?: string;
  friendship_id: string;
  status: 'pending' | 'accepted';
  direction: 'sent' | 'received';
}

export function useFriends(userId: string) {
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [pending, setPending] = useState<FriendUser[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFriends = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    // Get friendships where user is involved
    const { data: sent, error: e1 } = await supabase
      .from('friendships')
      .select('id, friend_id, status, created_at')
      .eq('user_id', userId);

    const { data: received, error: e2 } = await supabase
      .from('friendships')
      .select('id, user_id, status, created_at')
      .eq('friend_id', userId);

    if (e1 || e2) {
      console.error('Error loading friendships:', e1 || e2);
      setLoading(false);
      return;
    }

    // Collect all unique user IDs to fetch
    const sentFriendIds = (sent || []).map(s => s.friend_id);
    const receivedUserIds = (received || []).map(r => r.user_id);
    const allIds = [...new Set([...sentFriendIds, ...receivedUserIds])];

    if (allIds.length === 0) {
      setFriends([]);
      setPending([]);
      setLoading(false);
      return;
    }

    const { data: users } = await supabase
      .from('users')
      .select('id, username, avatar_url')
      .in('id', allIds);

    const userMap = new Map((users || []).map(u => [u.id, u]));

    const allFriends: FriendUser[] = [];
    const allPending: FriendUser[] = [];

    for (const s of sent || []) {
      const u = userMap.get(s.friend_id);
      const entry: FriendUser = {
        id: s.friend_id,
        username: u?.username || 'Unknown',
        avatar_url: u?.avatar_url,
        friendship_id: s.id,
        status: s.status,
        direction: 'sent',
      };
      if (s.status === 'accepted') allFriends.push(entry);
      else allPending.push(entry);
    }

    for (const r of received || []) {
      const u = userMap.get(r.user_id);
      const entry: FriendUser = {
        id: r.user_id,
        username: u?.username || 'Unknown',
        avatar_url: u?.avatar_url,
        friendship_id: r.id,
        status: r.status,
        direction: 'received',
      };
      if (r.status === 'accepted') allFriends.push(entry);
      else allPending.push(entry);
    }

    setFriends(allFriends);
    setPending(allPending);
    setLoading(false);
  }, [userId]);

  const searchUsers = useCallback(async (query: string): Promise<FriendUser[]> => {
    if (!query.trim() || query.length < 2) return [];

    const { data, error } = await supabase
      .from('users')
      .select('id, username, avatar_url')
      .ilike('username', `%${query.trim()}%`)
      .neq('id', userId)
      .limit(10);

    if (error || !data) return [];

    return data.map(u => ({
      id: u.id,
      username: u.username,
      avatar_url: u.avatar_url,
      friendship_id: '',
      status: 'pending' as const,
      direction: 'sent' as const,
    }));
  }, [userId]);

  const sendRequest = useCallback(async (friendId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('friendships')
      .insert([{ user_id: userId, friend_id: friendId, status: 'pending' }]);

    if (error) {
      console.error('Error sending request:', error);
      return false;
    }
    await loadFriends();
    return true;
  }, [userId, loadFriends]);

  const acceptRequest = useCallback(async (friendshipId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId);

    if (error) {
      console.error('Error accepting request:', error);
      return false;
    }
    await loadFriends();
    return true;
  }, [loadFriends]);

  const removeFriend = useCallback(async (friendshipId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (error) {
      console.error('Error removing friend:', error);
      return false;
    }
    await loadFriends();
    return true;
  }, [loadFriends]);

  return {
    friends,
    pending,
    loading,
    loadFriends,
    searchUsers,
    sendRequest,
    acceptRequest,
    removeFriend,
  };
}

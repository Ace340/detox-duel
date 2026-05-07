import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Card, Button } from '../components/ui';
import { COLORS, SPACING } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useFriends } from '../hooks/useFriends';
import type { FriendUser } from '../hooks/useFriends';

export default function FriendsScreen() {
  const { user } = useAuth();
  const { friends, pending, loading, loadFriends, searchUsers, sendRequest, acceptRequest, removeFriend } = useFriends(user?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => { loadFriends(); }, [loadFriends]);

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const results = await searchUsers(text);
    // Filter out existing friends
    const friendIds = new Set(friends.map(f => f.id));
    const pendingIds = new Set(pending.map(p => p.id));
    setSearchResults(results.filter(r => !friendIds.has(r.id) && !pendingIds.has(r.id)));
    setSearching(false);
  };

  const handleSendRequest = async (friendId: string) => {
    const ok = await sendRequest(friendId);
    if (ok) {
      setSearchResults(prev => prev.filter(r => r.id !== friendId));
      Alert.alert('Request sent! 🎉');
    } else {
      Alert.alert('Could not send request. Maybe already sent?');
    }
  };

  const handleAccept = async (friendshipId: string) => {
    await acceptRequest(friendshipId);
  };

  const handleRemove = async (friendshipId: string, name: string) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeFriend(friendshipId) },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Friends 👥</Text>

      {/* Your username */}
      <Card title="Your Username" subtitle="Share this so friends can add you">
        <Text style={styles.username}>{user?.email?.split('@')[0] || 'unknown'}</Text>
      </Card>

      {/* Search */}
      <Card title="Add Friend" subtitle="Search by username">
        <TextInput
          style={styles.searchInput}
          placeholder="Search username..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
        />
        {searching && <Text style={styles.hint}>Searching...</Text>}
        {searchResults.map(result => (
          <View key={result.id} style={styles.userRow}>
            <Text style={styles.userName}>{result.username}</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => handleSendRequest(result.id)}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        ))}
        {searchQuery.trim().length >= 2 && searchResults.length === 0 && !searching && (
          <Text style={styles.hint}>No users found</Text>
        )}
      </Card>

      {/* Pending requests */}
      {pending.length > 0 && (
        <Card title="Pending Requests" subtitle={`${pending.length} pending`}>
          {pending.map(req => (
            <View key={req.friendship_id} style={styles.userRow}>
              <View>
                <Text style={styles.userName}>{req.username}</Text>
                <Text style={styles.hint}>{req.direction === 'received' ? 'Wants to be friends' : 'Request sent'}</Text>
              </View>
              {req.direction === 'received' ? (
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.acceptButton} onPress={() => handleAccept(req.friendship_id)}>
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.declineButton} onPress={() => handleRemove(req.friendship_id, req.username)}>
                    <Text style={styles.declineButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.hint}>⏳ Waiting</Text>
              )}
            </View>
          ))}
        </Card>
      )}

      {/* Friends list */}
      <Card title={`Your Friends (${friends.length})`} subtitle={friends.length === 0 ? 'No friends yet — add someone to start competing!' : undefined}>
        {friends.length === 0 ? (
          <Text style={styles.empty}>Search for usernames above to send friend requests.</Text>
        ) : (
          friends.map(friend => (
            <View key={friend.friendship_id} style={styles.userRow}>
              <Text style={styles.userName}>🎯 {friend.username}</Text>
              <TouchableOpacity style={styles.declineButton} onPress={() => handleRemove(friend.friendship_id, friend.username)}>
                <Text style={styles.declineButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  title: { color: COLORS.text, fontSize: 28, fontWeight: 'bold', marginBottom: SPACING.lg },
  username: { color: COLORS.primary, fontSize: 18, fontWeight: '600' },
  searchInput: {
    backgroundColor: COLORS.surface || '#1a1a2e',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    padding: SPACING.md,
    color: COLORS.text,
    fontSize: 16,
    marginBottom: SPACING.sm,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  userName: { color: COLORS.text, fontSize: 16, fontWeight: '500' },
  hint: { color: COLORS.textSecondary, fontSize: 12 },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: { color: '#fff', fontWeight: '600' },
  actionButtons: { flexDirection: 'row', gap: 8 },
  acceptButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  acceptButtonText: { color: '#fff', fontWeight: '600' },
  declineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  declineButtonText: { color: '#999', fontWeight: '600' },
  empty: { color: COLORS.textSecondary, fontSize: 14 },
});

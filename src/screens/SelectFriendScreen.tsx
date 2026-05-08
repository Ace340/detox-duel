import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Card, Button } from '../components/ui';
import { COLORS, SPACING } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useFriends } from '../hooks/useFriends';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'SelectFriend'>;

export default function SelectFriendScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { friends, loading, loadFriends } = useFriends(user?.id || '');
  const [selectedFriendIds, setSelectedFriendIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  const toggleFriend = (friendId: string) => {
    setSelectedFriendIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(friendId)) {
        newSet.delete(friendId);
      } else {
        newSet.add(friendId);
      }
      return newSet;
    });
  };

  const handleNext = () => {
    if (selectedFriendIds.size === 0) return;
    navigation.navigate('ConfigureDuel', {
      selectedFriendIds: Array.from(selectedFriendIds),
    });
  };

  const selectedCount = selectedFriendIds.size;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Select Opponent(s) 👥</Text>
      <Text style={styles.description}>
        Choose one or more friends to challenge in a duel.
      </Text>

      {/* Selected count */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {selectedCount === 0
            ? 'No friends selected'
            : `Selected ${selectedCount} friend${selectedCount > 1 ? 's' : ''}`
          }
        </Text>
      </View>

      {/* Friends list */}
      <Card
        title="Your Friends"
        subtitle={loading ? 'Loading...' : `${friends.length} available`}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : friends.length === 0 ? (
          <Text style={styles.empty}>No friends yet. Add friends to start dueling!</Text>
        ) : (
          friends.map(friend => (
            <View key={friend.id} style={styles.friendRow}>
              <TouchableOpacity
                style={styles.friendInfo}
                onPress={() => toggleFriend(friend.id)}
                activeOpacity={0.7}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {friend.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.friendName}>{friend.username}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.checkbox,
                  selectedFriendIds.has(friend.id) && styles.checkboxChecked,
                ]}
                onPress={() => toggleFriend(friend.id)}
                activeOpacity={0.7}
              >
                {selectedFriendIds.has(friend.id) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            </View>
          ))
        )}
      </Card>

      {/* Next button */}
      <View style={styles.buttonContainer}>
        <Button
          title={selectedCount === 0 ? 'Select at least one friend' : `Next (${selectedCount}) →`}
          onPress={handleNext}
          variant="primary"
          disabled={selectedCount === 0}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: SPACING.lg,
  },
  countRow: {
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  countText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  empty: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
  friendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  avatarText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  friendName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginTop: SPACING.md,
  },
});

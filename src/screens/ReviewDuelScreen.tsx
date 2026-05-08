import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Card, Button } from '../components/ui';
import { COLORS, SPACING } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useFriends } from '../hooks/useFriends';
import { useDuel } from '../hooks/useDuel';
import { MOCK_APP_LIST } from '../constants/mockApps';
import { formatDuelType } from '../types/duel';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'ReviewDuel'>;

export default function ReviewDuelScreen({ route, navigation }: Props) {
  const { user } = useAuth();
  const { friends, loading: friendsLoading, loadFriends } = useFriends(user?.id || '');
  const { createDuel, loading: creatingDuel, error: duelError } = useDuel();

  const { selectedFriendIds, duelType, durationHours, bannedApps } = route.params;

  const [submitting, setSubmitting] = useState(false);

  // Load friends on mount
  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  // Get selected friends from the friends list
  const selectedFriends = friends.filter(friend => selectedFriendIds.includes(friend.id));

  // Get banned app names
  const bannedAppNames = MOCK_APP_LIST
    .filter(app => bannedApps.includes(app.id))
    .map(app => app.name);

  // Format duration for display
  const formatDuration = (hours: number): string => {
    if (hours < 24) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (hours === 24) {
      return '24 hours';
    } else {
      const days = hours / 24;
      return `${days} day${days > 1 ? 's' : ''}`;
    }
  };

  const handleSendChallenge = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to create a duel');
      return;
    }

    setSubmitting(true);

    try {
      const duelId = await createDuel({
        creatorId: user.id,
        opponentIds: selectedFriendIds,
        duelType: duelType as any,
        durationHours,
        bannedApps,
      });

      if (duelId) {
        // Success
        Alert.alert(
          'Challenge Sent! 🎉',
          'Your duel challenge has been sent. Good luck!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to HomeScreen (Tabs)
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Tabs' }],
                });
              },
            },
          ]
        );
      } else {
        // Error occurred
        Alert.alert(
          'Failed to Create Duel',
          duelError || 'An error occurred while creating the duel. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Review Challenge 📋</Text>
      <Text style={styles.description}>
        Review your duel configuration before sending.
      </Text>

      {/* Selected Friends */}
      <Card
        title="Opponents"
        subtitle={`${selectedFriends.length} friend${selectedFriends.length > 1 ? 's' : ''} selected`}
      >
        {friendsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : selectedFriends.length === 0 ? (
          <Text style={styles.empty}>No friends selected</Text>
        ) : (
          selectedFriends.map(friend => (
            <View key={friend.id} style={styles.friendRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {friend.username.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.friendName}>{friend.username}</Text>
            </View>
          ))
        )}
      </Card>

      {/* Duel Type and Duration */}
      <Card title="Duel Type" subtitle="Competition settings">
        <Text style={styles.duelTypeText}>
          {formatDuelType(duelType as any)} ({formatDuration(durationHours)})
        </Text>
      </Card>

      {/* Banned Apps */}
      <Card
        title="Banned Apps"
        subtitle={bannedAppNames.length === 0 ? 'No apps blocked' : `${bannedAppNames.length} app${bannedAppNames.length > 1 ? 's' : ''} selected`}
      >
        {bannedAppNames.length === 0 ? (
          <Text style={styles.empty}>No apps will be blocked</Text>
        ) : bannedAppNames.length <= 3 ? (
          bannedAppNames.map((name, index) => (
            <Text key={index} style={styles.appName}>
              • {name}
            </Text>
          ))
        ) : (
          <View>
            {bannedAppNames.slice(0, 3).map((name, index) => (
              <Text key={index} style={styles.appName}>
                • {name}
              </Text>
            ))}
            <Text style={styles.moreApps}>
              +{bannedAppNames.length - 3} more app{bannedAppNames.length - 3 > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </Card>

      {/* Send Challenge Button */}
      <View style={styles.buttonContainer}>
        <Button
          title={
            submitting || creatingDuel
              ? 'Sending...'
              : 'Send Challenge ⚔️'
          }
          onPress={handleSendChallenge}
          variant="primary"
          disabled={submitting || creatingDuel || selectedFriends.length === 0}
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
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
  duelTypeText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  appName: {
    color: COLORS.text,
    fontSize: 15,
    marginBottom: 4,
  },
  moreApps: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: SPACING.xs,
  },
  buttonContainer: {
    marginTop: SPACING.md,
  },
});

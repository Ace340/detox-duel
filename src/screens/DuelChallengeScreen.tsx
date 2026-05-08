import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Card, Button } from '../components/ui';
import { COLORS, SPACING } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useDuelChallenge } from '../hooks/useDuelChallenge';
import { supabase } from '../services/supabase';
import { formatDuelType, type Duel } from '../types/duel';
import type { RootStackParamList } from '../navigation/AppNavigator';

type DuelChallengeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'DuelChallenge'>;
type DuelChallengeScreenRouteProp = RouteProp<RootStackParamList, 'DuelChallenge'>;

export default function DuelChallengeScreen() {
  const navigation = useNavigation<DuelChallengeScreenNavigationProp>();
  const route = useRoute<DuelChallengeScreenRouteProp>();
  const { duelId, opponentId } = route.params;
  const { user } = useAuth();
  const { acceptChallenge, declineChallenge, loading: actionLoading } = useDuelChallenge();

  const [duel, setDuel] = useState<Duel | null>(null);
  const [creator, setCreator] = useState<{ username: string; avatar_url?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDuelDetails();
  }, [duelId]);

  const loadDuelDetails = async () => {
    if (!duelId) {
      setError('Invalid duel ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch duel details
      const { data: duelData, error: duelError } = await supabase
        .from('duels')
        .select('*')
        .eq('id', duelId)
        .single();

      if (duelError || !duelData) {
        setError('Duel not found');
        setLoading(false);
        return;
      }

      setDuel(duelData);

      // Fetch creator (opponent) details
      const { data: creatorData, error: creatorError } = await supabase
        .from('users')
        .select('username, avatar_url')
        .eq('id', duelData.creator_id)
        .single();

      if (creatorError || !creatorData) {
        console.error('Failed to fetch creator:', creatorError);
      } else {
        setCreator(creatorData);
      }
    } catch (err) {
      console.error('Error loading duel details:', err);
      setError('Failed to load duel details');
    } finally {
      setLoading(false);
    }
  };

  const getDuelTypeEmoji = (type: string): string => {
    const emojis: Record<string, string> = {
      focus_sprint: '⚡',
      weekly_war: '⚔️',
      streak_battle: '🔥',
      quick_duel: '⚡',
    };
    return emojis[type] || '🎯';
  };

  const formatDuration = (hours: number): string => {
    if (hours < 24) {
      return `${hours} hours`;
    } else if (hours === 24) {
      return '24 hours';
    } else if (hours === 168) {
      return '7 days';
    } else {
      const days = Math.floor(hours / 24);
      return `${days} days`;
    }
  };

  const handleAccept = async () => {
    if (!user || !duelId) return;

    try {
      const success = await acceptChallenge(duelId, user.id);
      if (success) {
        Alert.alert(
          'Challenge Accepted! 🎯',
          'You have successfully joined this duel. Good luck!',
          [
            {
              text: 'Awesome',
              style: 'default',
              isPreferred: true,
            },
          ]
        );
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Failed to accept challenge. Please try again.');
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleDecline = () => {
    Alert.alert(
      'Decline Challenge?',
      'Are you sure you want to decline this duel? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            if (!user || !duelId) return;

            try {
              const success = await declineChallenge(duelId, user.id);
              if (success) {
                Alert.alert('Declined', 'Challenge has been declined.');
                navigation.goBack();
              } else {
                Alert.alert('Error', 'Failed to decline challenge. Please try again.');
              }
            } catch (err) {
              Alert.alert('Error', 'An unexpected error occurred. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !duel) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Duel not found'}</Text>
        <Button
          title="Go Back"
          variant="outline"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
      </View>
    );
  }

  const duelTypeEmoji = getDuelTypeEmoji(duel.duel_type);
  const formattedDuration = formatDuration(duel.duration_hours);
  const bannedAppsList = duel.banned_apps || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Duel Challenge</Text>

      {/* Creator Info Card */}
      <Card title={null} subtitle={null}>
        <View style={styles.creatorContainer}>
          {creator?.avatar_url ? (
            <Image source={{ uri: creator.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{creator?.username?.charAt(0).toUpperCase() || '?'}</Text>
            </View>
          )}
          <View style={styles.creatorInfo}>
            <Text style={styles.creatorUsername}>@{creator?.username || 'Unknown'}</Text>
            <Text style={styles.challengeMessage}>challenged you</Text>
          </View>
        </View>
      </Card>

      {/* Duel Details Card */}
      <Card title="Duel Details" subtitle="Review the challenge below">
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Type</Text>
          <Text style={styles.detailValue}>
            {duelTypeEmoji} {formatDuelType(duel.duel_type)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Duration</Text>
          <Text style={styles.detailValue}>{formattedDuration}</Text>
        </View>
        {bannedAppsList.length > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Banned Apps</Text>
            <View style={styles.appsList}>
              {bannedAppsList.map((app, index) => (
                <Text key={index} style={styles.appText}>
                  {index === bannedAppsList.length - 1 ? `• ${app}` : `• ${app}\n`}
                </Text>
              ))}
            </View>
          </View>
        )}
      </Card>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          title="Accept Challenge"
          variant="primary"
          onPress={handleAccept}
          disabled={actionLoading}
          style={styles.button}
        />
        <Button
          title="Decline Challenge"
          variant="outline"
          onPress={handleDecline}
          disabled={actionLoading}
          style={styles.button}
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
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  greeting: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: SPACING.lg,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  backButton: {
    width: '100%',
  },
  creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: SPACING.md,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  creatorInfo: {
    flex: 1,
  },
  creatorUsername: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  challengeMessage: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  detailRow: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: SPACING.xs,
  },
  detailValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  appsList: {
    marginTop: SPACING.xs,
  },
  appText: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 24,
  },
  buttonContainer: {
    marginTop: SPACING.md,
  },
  button: {
    marginBottom: SPACING.sm,
  },
});

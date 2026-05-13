import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Card, Button } from '../components/ui';
import { COLORS, SPACING } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useGroupChallenges } from '../hooks/useGroupChallenges';
import { supabase } from '../services/supabase';
import type {
  GroupChallenge,
  GroupChallengeWithParticipants,
  ChallengeType,
  ChallengeStatus,
} from '../types/groupChallenge';
import {
  formatChallengeType,
  formatChallengeStatus,
  calculateChallengeDays,
} from '../types/groupChallenge';
import type { RootStackParamList } from '../navigation/AppNavigator';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

type ChallengeDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ChallengeDetailScreen'>;
type ChallengeDetailScreenRouteProp = RouteProp<RootStackParamList, 'ChallengeDetailScreen'>;

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Gets emoji for challenge type
 * @param type - Challenge type
 * @returns Emoji string
 */
function getChallengeTypeEmoji(type: ChallengeType): string {
  const emojis: Record<ChallengeType, string> = {
    lowest_screen_time: '📱',
    most_focus_sessions: '⚡',
    longest_streak: '🔥',
  };
  return emojis[type];
}

/**
 * Formats challenge type for display
 * @param type - Challenge type
 * @returns Formatted string
 */
function formatChallengeTypeDisplay(type: ChallengeType): string {
  const formats: Record<ChallengeType, string> = {
    lowest_screen_time: 'Lowest Screen Time',
    most_focus_sessions: 'Most Focus Sessions',
    longest_streak: 'Longest Streak',
  };
  return formats[type];
}

/**
 * Gets rank medal emoji
 * @param rank - Rank number (1-based)
 * @returns Medal emoji or rank number
 */
function getRankMedal(rank: number): string {
  const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
  return medals[rank] || `#${rank}`;
}

/**
 * Calculates remaining time in countdown format
 * @param endDate - End date ISO string
 * @returns Time remaining object
 */
function calculateTimeRemaining(endDate: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const now = new Date().getTime();
  const end = new Date(endDate).getTime();
  const diff = Math.max(0, end - now);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}

/**
 * Formats date for display
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats time for display
 * @param dateString - ISO date string
 * @returns Formatted time string
 */
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function ChallengeDetailScreen() {
  const navigation = useNavigation<ChallengeDetailScreenNavigationProp>();
  const route = useRoute<ChallengeDetailScreenRouteProp>();
  const { challengeId } = route.params;
  const { user } = useAuth();
  const { joinChallenge, loading: hookLoading } = useGroupChallenges();

  // State
  const [challenge, setChallenge] = useState<GroupChallengeWithParticipants | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Computed values
  const isCreator = useMemo(
    () => challenge && user ? challenge.creator_id === user.id : false,
    [challenge, user]
  );

  const isParticipant = useMemo(
    () => challenge && user ? challenge.participants.some(p => p.user_id === user.id) : false,
    [challenge, user]
  );

  const userRank = useMemo(() => {
    if (!challenge || !user || !isParticipant) return null;
    const participant = challenge.participants.find(p => p.user_id === user.id);
    return participant ? (participant as any).rank : null;
  }, [challenge, user, isParticipant]);

  const leaderboard = useMemo(() => {
    if (!challenge) return [];
    const isLowestScreenTime = challenge.challenge_type === 'lowest_screen_time';
    return [...challenge.participants]
      .sort((a, b) => isLowestScreenTime ? a.score - b.score : b.score - a.score)
      .map((participant, index) => ({
        ...participant,
        rank: index + 1,
      }));
  }, [challenge]);

  // Load challenge details
  const loadChallengeDetails = useCallback(async () => {
    if (!challengeId) {
      setError('Invalid challenge ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('group_challenges')
        .select(`
          *,
          participants:group_challenge_participants(
            user_id,
            score,
            joined_at,
            user:auth.users(id, email, username, full_name, avatar_url)
          )
        `)
        .eq('id', challengeId)
        .single();

      if (fetchError || !data) {
        setError('Challenge not found');
        setLoading(false);
        return;
      }

      setChallenge(data);

      // Check if challenge is completed and navigate to results
      if (data.status === 'completed') {
        navigation.navigate('ChallengeResultsScreen', { challengeId: challengeId });
      }
    } catch (err) {
      console.error('Error loading challenge details:', err);
      setError('Failed to load challenge details');
    } finally {
      setLoading(false);
    }
  }, [challengeId, navigation]);

  // Handle join challenge
  const handleJoinChallenge = useCallback(async () => {
    if (!user || !challengeId) return;

    try {
      const success = await joinChallenge(challengeId, user.id);
      if (success) {
        Alert.alert(
          'Joined! 🎉',
          'You have successfully joined this challenge. Good luck!',
          [{ text: 'Awesome', style: 'default', isPreferred: true }]
        );
        await loadChallengeDetails();
      } else {
        Alert.alert('Error', 'Failed to join challenge. Please try again.');
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  }, [user, challengeId, joinChallenge, loadChallengeDetails]);

  // Handle share challenge
  const handleShareChallenge = useCallback(() => {
    Alert.alert(
      'Share Challenge',
      'Share this challenge with your friends!',
      [
        { text: 'Copy Link', onPress: () => console.log('Copy link') },
        { text: 'Share Screenshot', onPress: () => console.log('Share screenshot') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, []);

  // Handle leave challenge
  const handleLeaveChallenge = useCallback(() => {
    Alert.alert(
      'Leave Challenge?',
      'Are you sure you want to leave this challenge? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            console.log('Leave challenge');
            // TODO: Implement leave challenge logic
          },
        },
      ],
      { cancelable: true }
    );
  }, []);

  // Load challenge on mount
  useEffect(() => {
    loadChallengeDetails();
  }, [loadChallengeDetails]);

  // Update countdown timer
  useEffect(() => {
    if (!challenge || challenge.status !== 'active') return;

    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(challenge.end_date);
      setTimeRemaining(remaining);

      // Check if challenge has ended
      if (remaining.days === 0 && remaining.hours === 0 && remaining.minutes === 0 && remaining.seconds === 0) {
        loadChallengeDetails();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [challenge, loadChallengeDetails]);

  // Realtime subscription for participant updates
  useEffect(() => {
    if (!challengeId) return;

    const channel = supabase
      .channel(`challenge-${challengeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_challenge_participants',
          filter: `challenge_id=eq.${challengeId}`,
        },
        () => {
          // Reload challenge when participants change
          loadChallengeDetails();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'group_challenges',
          filter: `id=eq.${challengeId}`,
        },
        () => {
          // Reload challenge when challenge status changes
          loadChallengeDetails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [challengeId, loadChallengeDetails]);

  // Initial time calculation
  useEffect(() => {
    if (challenge && challenge.status === 'active') {
      setTimeRemaining(calculateTimeRemaining(challenge.end_date));
    }
  }, [challenge]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !challenge) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Challenge not found'}</Text>
        <Button
          title="Go Back"
          variant="outline"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
      </View>
    );
  }

  const challengeTypeEmoji = getChallengeTypeEmoji(challenge.challenge_type);
  const isActive = challenge.status === 'active';
  const isPending = challenge.status === 'pending';
  const canJoin = isPending && !isParticipant;
  const canLeave = (isCreator && isPending) || (isParticipant && isActive);
  const participantCount = challenge.participants.length;
  const maxParticipants = challenge.max_participants;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Challenge Details {challengeTypeEmoji}</Text>

      {/* Status Banner */}
      <View style={[styles.statusBanner, getStatusBannerStyle(challenge.status)]}>
        <Text style={styles.statusText}>
          {challenge.status === 'active' ? 'Challenge Active' :
           challenge.status === 'pending' ? 'Starting Soon' :
           'Challenge Completed'}
        </Text>
      </View>

      {/* Countdown Timer */}
      {isActive && (
        <Card title="Time Remaining" subtitle={null}>
          <View style={styles.timerContainer}>
            <View style={styles.timerSegment}>
              <Text style={styles.timerValue}>{timeRemaining.days}</Text>
              <Text style={styles.timerLabel}>Days</Text>
            </View>
            <Text style={styles.timerSeparator}>:</Text>
            <View style={styles.timerSegment}>
              <Text style={styles.timerValue}>{timeRemaining.hours}</Text>
              <Text style={styles.timerLabel}>Hours</Text>
            </View>
            <Text style={styles.timerSeparator}>:</Text>
            <View style={styles.timerSegment}>
              <Text style={styles.timerValue}>{timeRemaining.minutes}</Text>
              <Text style={styles.timerLabel}>Mins</Text>
            </View>
            <Text style={styles.timerSeparator}>:</Text>
            <View style={styles.timerSegment}>
              <Text style={styles.timerValue}>{timeRemaining.seconds}</Text>
              <Text style={styles.timerLabel}>Secs</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Challenge Info */}
      <Card title="Challenge Info" subtitle={null}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Title</Text>
          <Text style={styles.detailValue}>{challenge.title}</Text>
        </View>
        {challenge.description && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Description</Text>
            <Text style={styles.detailValue}>{challenge.description}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Type</Text>
          <Text style={styles.detailValue}>
            {challengeTypeEmoji} {formatChallengeTypeDisplay(challenge.challenge_type)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Duration</Text>
          <Text style={styles.detailValue}>{calculateChallengeDays(challenge.start_date, challenge.end_date)} days</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Start Date</Text>
          <Text style={styles.detailValue}>{formatDate(challenge.start_date)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Start Time</Text>
          <Text style={styles.detailValue}>{formatTime(challenge.start_date)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>End Date</Text>
          <Text style={styles.detailValue}>{formatDate(challenge.end_date)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>End Time</Text>
          <Text style={styles.detailValue}>{formatTime(challenge.end_date)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Participants</Text>
          <Text style={styles.detailValue}>{participantCount} / {maxParticipants}</Text>
        </View>
      </Card>

      {/* Leaderboard */}
      <Card title="Leaderboard" subtitle={null}>
        {leaderboard.length === 0 ? (
          <Text style={styles.emptyText}>No participants yet</Text>
        ) : (
          leaderboard.map((participant) => {
            const participantUser = (participant as any).user;
            const isMe = participant.user_id === user?.id;
            const medal = getRankMedal(participant.rank);

            return (
              <View key={participant.user_id} style={[styles.leaderboardRow, isMe && styles.myRow]}>
                <View style={styles.leaderboardLeft}>
                  <Text style={styles.rankBadge}>{medal}</Text>
                  {participantUser?.avatar_url ? (
                    <Image source={{ uri: participantUser.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>
                        {participantUser?.username?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    </View>
                  )}
                  <View style={styles.leaderboardInfo}>
                    <Text style={[styles.leaderboardName, isMe && styles.myName]}>
                      {participantUser?.username || 'Unknown'} {isMe ? '(You)' : ''}
                    </Text>
                    {isCreator && participant.user_id === challenge.creator_id && (
                      <Text style={styles.creatorBadge}>Creator</Text>
                    )}
                  </View>
                </View>
                <View style={styles.leaderboardRight}>
                  <Text style={[styles.leaderboardScore, isMe && styles.myScore]}>
                    {participant.score.toFixed(1)}
                  </Text>
                  {challenge.challenge_type === 'lowest_screen_time' && (
                    <Text style={styles.leaderboardUnit}>hrs</Text>
                  )}
                  {challenge.challenge_type === 'most_focus_sessions' && (
                    <Text style={styles.leaderboardUnit}>sessions</Text>
                  )}
                  {challenge.challenge_type === 'longest_streak' && (
                    <Text style={styles.leaderboardUnit}>days</Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </Card>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {canJoin && (
          <Button
            title="Join Challenge"
            variant="primary"
            onPress={handleJoinChallenge}
            disabled={hookLoading || loading}
            style={styles.button}
          />
        )}
        <Button
          title="Share Challenge"
          variant="outline"
          onPress={handleShareChallenge}
          style={styles.button}
        />
        {canLeave && (
          <Button
            title="Leave Challenge"
            variant="outline"
            onPress={handleLeaveChallenge}
            style={styles.button}
          />
        )}
      </View>
    </ScrollView>
  );
}

/**
 * Gets the banner style based on challenge status
 */
function getStatusBannerStyle(status: ChallengeStatus): { backgroundColor: string; borderColor: string } {
  const styles: Record<ChallengeStatus, { backgroundColor: string; borderColor: string }> = {
    pending: { backgroundColor: 'rgba(255, 152, 0, 0.1)', borderColor: 'rgba(255, 152, 0, 0.3)' },
    active: { backgroundColor: 'rgba(33, 150, 243, 0.1)', borderColor: 'rgba(33, 150, 243, 0.3)' },
    completed: { backgroundColor: 'rgba(76, 175, 80, 0.1)', borderColor: 'rgba(76, 175, 80, 0.3)' },
  };
  return styles[status];
}

// =====================================================
// STYLES
// =====================================================

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
  statusBanner: {
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  statusText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
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
  timerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  timerSegment: {
    alignItems: 'center',
  },
  timerValue: {
    color: COLORS.primary,
    fontSize: 32,
    fontWeight: 'bold',
  },
  timerLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: SPACING.xs,
  },
  timerSeparator: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: 'bold',
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
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
  leaderboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  myRow: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  rankBadge: {
    fontSize: 20,
    width: 32,
    textAlign: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  myName: {
    color: COLORS.primary,
  },
  creatorBadge: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  leaderboardRight: {
    alignItems: 'flex-end',
  },
  leaderboardScore: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  myScore: {
    color: COLORS.primary,
  },
  leaderboardUnit: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  buttonContainer: {
    marginTop: SPACING.md,
  },
  button: {
    marginBottom: SPACING.sm,
  },
});

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Card, Button } from '../components/ui';
import { COLORS, SPACING } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useGroupChallenges } from '../hooks/useGroupChallenges';
import { supabase } from '../services/supabase';
import { formatChallengeType, calculateChallengeDays, type GroupChallenge, type GroupChallengeParticipant, type ChallengeType, type User } from '../types/groupChallenge';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { Share } from 'react-native';

type ChallengeResultsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ChallengeResultsScreen'>;
type ChallengeResultsScreenRouteProp = RouteProp<RootStackParamList, 'ChallengeResultsScreen'>;

interface ParticipantData extends GroupChallengeParticipant {
  user?: User;
  rank?: number;
}

export default function ChallengeResultsScreen() {
  const navigation = useNavigation<ChallengeResultsScreenNavigationProp>();
  const route = useRoute<ChallengeResultsScreenRouteProp>();
  const { challengeId } = route.params;
  const { user } = useAuth();
  const { loadChallengeDetails, completeChallenge } = useGroupChallenges(user?.id || '');

  const [challenge, setChallenge] = useState<GroupChallenge | null>(null);
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [winnerAnimation] = useState(new Animated.Value(0));
  const [cardsAnimation] = useState(new Animated.Value(0));
  const [leaderboardAnimation] = useState(new Animated.Value(0));

  const winnerAnimationRef = useRef(winnerAnimation);
  const cardsAnimationRef = useRef(cardsAnimation);
  const leaderboardAnimationRef = useRef(leaderboardAnimation);

  useEffect(() => {
    loadChallengeResults();
  }, [challengeId]);

  useEffect(() => {
    if (!loading && !error && challenge) {
      runAnimations();
    }
  }, [loading, error, challenge]);

  const runAnimations = () => {
    // Winner announcement animation: scale 0.8->1.1->1.0 with opacity 0->1
    Animated.sequence([
      Animated.timing(winnerAnimationRef.current, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(winnerAnimationRef.current, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(winnerAnimationRef.current, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Stats cards: staggered fade-in
    Animated.timing(cardsAnimationRef.current, {
      toValue: 1,
      duration: 400,
      delay: 200,
      useNativeDriver: true,
    }).start();

    // Leaderboard: slide-in from bottom
    Animated.timing(leaderboardAnimationRef.current, {
      toValue: 1,
      duration: 400,
      delay: 300,
      useNativeDriver: true,
    }).start();
  };

  const loadChallengeResults = async () => {
    if (!challengeId) {
      setError('Invalid challenge ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch challenge details
      const { data: challengeData, error: challengeError } = await supabase
        .from('group_challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (challengeError || !challengeData) {
        setError('Challenge not found');
        setLoading(false);
        return;
      }

      setChallenge(challengeData);

      // Fetch participants with user data
      const { data: participantsData, error: participantsError } = await supabase
        .from('group_challenge_participants')
        .select(`
          *,
          user:users(id, username, avatar_url, full_name)
        `)
        .eq('challenge_id', challengeId)
        .order('score', challengeData.challenge_type === 'lowest_screen_time' ? { ascending: true } : { ascending: false });

      if (participantsError || !participantsData) {
        console.error('Failed to fetch participants:', participantsError);
      } else {
        const participantsWithRank: ParticipantData[] = participantsData.map((p, index) => ({
          ...p,
          user: (p as any).user,
          rank: index + 1,
        }));
        setParticipants(participantsWithRank);
      }

      // If challenge is not completed, complete it
      if (challengeData.status !== 'completed') {
        await completeChallenge(challengeId);
      }
    } catch (err) {
      console.error('Error loading challenge results:', err);
      setError('Failed to load challenge results');
    } finally {
      setLoading(false);
    }
  };

  const getWinner = (): ParticipantData | null => {
    if (participants.length === 0) return null;

    if (challenge?.challenge_type === 'lowest_screen_time') {
      // Lowest score wins
      return participants.reduce((min, p) => p.score < min.score ? p : min, participants[0]);
    } else {
      // Highest score wins
      return participants.reduce((max, p) => p.score > max.score ? p : max, participants[0]);
    }
  };

  const getCurrentUserRank = (): number | null => {
    const currentUserParticipant = participants.find(p => p.user_id === user?.id);
    return currentUserParticipant?.rank || null;
  };

  const getCurrentUserScore = (): number | null => {
    const currentUserParticipant = participants.find(p => p.user_id === user?.id);
    return currentUserParticipant?.score || null;
  };

  const getChallengeTypeEmoji = (type: ChallengeType): string => {
    const emojis: Record<ChallengeType, string> = {
      lowest_screen_time: '📱',
      most_focus_sessions: '⚡',
      longest_streak: '🔥',
    };
    return emojis[type] || '🎯';
  };

  const formatScore = (score: number, type: ChallengeType): string => {
    if (type === 'lowest_screen_time') {
      const hours = Math.floor(score / 3600);
      const minutes = Math.floor((score % 3600) / 60);
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    } else if (type === 'most_focus_sessions') {
      return `${score} sessions`;
    } else {
      return `${score} days`;
    }
  };

  const handleShareResults = async () => {
    const winner = getWinner();
    if (!challenge || !winner) return;

    try {
      const userRank = getCurrentUserRank();
      const userScore = getCurrentUserScore();

      const shareText = `🏆 Challenge Results!\n\nChallenge: ${challenge.title}\nType: ${formatChallengeType(challenge.challenge_type)}\nWinner: @${winner.user?.username}\n\nYour Result: Rank #${userRank} (${formatScore(userScore || 0, challenge.challenge_type)})\n\nBeat your friends at Detox Duel!`;

      await Share.share({
        message: shareText,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleBackToChallenges = () => {
    navigation.navigate('ActiveChallengesScreen' as any, { filter: 'completed' });
  };

  const handleHome = () => {
    navigation.navigate('Tabs' as any, { screen: 'Home' });
  };

  const winner = getWinner();
  const currentUserRank = getCurrentUserRank();
  const currentUserScore = getCurrentUserScore();

  const challengeDays = challenge ? calculateChallengeDays(challenge.start_date, challenge.end_date) : 0;
  const challengeTypeEmoji = challenge ? getChallengeTypeEmoji(challenge.challenge_type) : '🎯';

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading challenge results...</Text>
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Challenge Results</Text>

      {/* Winner Announcement */}
      {winner && (
        <Animated.View
          style={[
            styles.winnerContainer,
            {
              opacity: winnerAnimation,
              transform: [
                {
                  scale: winnerAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.trophyEmoji}>🏆</Text>
          <Text style={styles.winnerText}>Winner!</Text>
          <View style={styles.winnerInfo}>
            {winner.user?.avatar_url ? (
              <Text style={styles.winnerAvatar}>{winner.user?.username?.charAt(0).toUpperCase()}</Text>
            ) : (
              <View style={styles.winnerAvatar}>
                <Text style={styles.winnerAvatarText}>{winner.user?.username?.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <Text style={styles.winnerName}>@{winner.user?.username}</Text>
            <View style={styles.rankBadge}>
              <Text style={styles.rankBadgeText}>🥇 Rank #1</Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Challenge Info Summary */}
      <Animated.View style={{ opacity: cardsAnimation }}>
        <Card
          title={challenge.title}
          subtitle={challengeTypeEmoji + ' ' + formatChallengeType(challenge.challenge_type)}
        >
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>{challengeDays} days</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Participants</Text>
              <Text style={styles.infoValue}>{participants.length}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={styles.infoValue}>Completed</Text>
            </View>
          </View>
          {challenge.description && (
            <Text style={styles.descriptionText}>{challenge.description}</Text>
          )}
        </Card>
      </Animated.View>

      {/* Current User Performance */}
      <Animated.View style={{ opacity: cardsAnimation }}>
        <Card title="Your Performance" subtitle="How you did">
          {currentUserRank !== null && currentUserScore !== null ? (
            <View style={styles.performanceContainer}>
              <View style={styles.performanceMain}>
                <Text style={styles.performanceLabel}>Your Rank</Text>
                <Text style={styles.performanceRank}>#{currentUserRank}</Text>
                {currentUserRank === 1 && (
                  <Text style={styles.performanceBadge}>🏆 Champion!</Text>
                )}
              </View>
              <View style={styles.performanceDivider} />
              <View style={styles.performanceMain}>
                <Text style={styles.performanceLabel}>Your Score</Text>
                <Text style={styles.performanceScore}>
                  {formatScore(currentUserScore, challenge.challenge_type)}
                </Text>
              </View>
              {winner && currentUserRank !== 1 && (
                <View style={styles.vsWinnerContainer}>
                  <Text style={styles.vsWinnerText}>
                    vs Winner: {formatScore(winner.score, challenge.challenge_type)}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.notParticipatedText}>You did not participate in this challenge</Text>
          )}
        </Card>
      </Animated.View>

      {/* Final Leaderboard */}
      <Animated.View
        style={[
          { opacity: leaderboardAnimation },
          {
            transform: [
              {
                translateY: leaderboardAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Card title="Final Leaderboard" subtitle="All participants">
          {participants.map((participant) => {
            const isCurrentUser = participant.user_id === user?.id;
            const isWinner = participant.rank === 1;

            return (
              <View
                key={participant.user_id}
                style={[
                  styles.leaderboardItem,
                  isCurrentUser && styles.currentUserItem,
                ]}
              >
                <View style={styles.leaderboardRank}>
                  <Text style={[
                    styles.rankText,
                    isWinner && styles.winnerRankText,
                  ]}>
                    {isWinner ? '🥇' : participant.rank === 2 ? '🥈' : participant.rank === 3 ? '🥉' : `#${participant.rank}`}
                  </Text>
                </View>
                <View style={styles.leaderboardUser}>
                  {participant.user?.avatar_url ? (
                    <Text style={styles.participantAvatar}>{participant.user?.username?.charAt(0).toUpperCase()}</Text>
                  ) : (
                    <View style={styles.participantAvatar}>
                      <Text style={styles.participantAvatarText}>{participant.user?.username?.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={styles.leaderboardUserInfo}>
                    <Text style={[
                      styles.participantName,
                      isCurrentUser && styles.currentUserName,
                    ]}>
                      @{participant.user?.username}
                      {isCurrentUser && <Text style={styles.youLabel}> (You)</Text>}
                    </Text>
                  </View>
                </View>
                <View style={styles.leaderboardScore}>
                  <Text style={[
                    styles.scoreText,
                    isWinner && styles.winnerScoreText,
                  ]}>
                    {formatScore(participant.score, challenge.challenge_type)}
                  </Text>
                </View>
              </View>
            );
          })}
        </Card>
      </Animated.View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          title="Share Results 📤"
          onPress={handleShareResults}
          variant="primary"
          style={styles.button}
        />
        <Button
          title="Back to Challenges"
          onPress={handleBackToChallenges}
          variant="outline"
          style={styles.button}
        />
        <Button
          title="Home 🏠"
          onPress={handleHome}
          variant="outline"
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
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginTop: SPACING.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  backButton: {
    marginTop: SPACING.sm,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: SPACING.lg,
  },
  winnerContainer: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  trophyEmoji: {
    fontSize: 64,
    marginBottom: SPACING.sm,
  },
  winnerText: {
    color: COLORS.success,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  winnerInfo: {
    alignItems: 'center',
  },
  winnerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  winnerAvatarText: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: 'bold',
  },
  winnerName: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  rankBadge: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
  },
  rankBadgeText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: SPACING.xs,
  },
  infoValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  descriptionText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  performanceContainer: {
    paddingVertical: SPACING.sm,
  },
  performanceMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  performanceLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  performanceRank: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  performanceBadge: {
    color: COLORS.warning,
    fontSize: 14,
    fontWeight: '600',
  },
  performanceDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  performanceScore: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
  },
  vsWinnerContainer: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  vsWinnerText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  notParticipatedText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  currentUserItem: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: SPACING.sm,
    borderRadius: 8,
  },
  leaderboardRank: {
    width: 50,
    alignItems: 'center',
  },
  rankText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  winnerRankText: {
    fontSize: 20,
  },
  leaderboardUser: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  participantAvatarText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  leaderboardUserInfo: {
    flex: 1,
  },
  participantName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
  },
  currentUserName: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  youLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: 'normal',
  },
  leaderboardScore: {
    alignItems: 'flex-end',
  },
  scoreText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  winnerScoreText: {
    color: COLORS.success,
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: SPACING.md,
  },
  button: {
    marginBottom: SPACING.sm,
  },
});

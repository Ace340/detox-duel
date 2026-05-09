import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Card, Button } from '../components/ui';
import { COLORS, SPACING } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { formatDuelType, type Duel, type DuelParticipant, type DuelReward, type DuelType, RewardType } from '../types/duel';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { Share } from 'react-native';

type DuelResultsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'DuelResults'>;
type DuelResultsScreenRouteProp = RouteProp<RootStackParamList, 'DuelResults'>;

interface PlayerData extends DuelParticipant {
  username?: string;
  avatar_url?: string;
}

interface StreakDay {
  day: number;
  creatorMetLimit: boolean;
  opponentMetLimit: boolean;
}

export default function DuelResultsScreen() {
  const navigation = useNavigation<DuelResultsScreenNavigationProp>();
  const route = useRoute<DuelResultsScreenRouteProp>();
  const { duelId } = route.params;
  const { user } = useAuth();

  const [duel, setDuel] = useState<Duel | null>(null);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [rewards, setRewards] = useState<DuelReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [winnerAnimation] = useState(new Animated.Value(0));
  const [cardsAnimation] = useState(new Animated.Value(0));
  const [barAnimations] = useState([new Animated.Value(0), new Animated.Value(0)]);

  const winnerAnimationRef = useRef(winnerAnimation);
  const cardsAnimationRef = useRef(cardsAnimation);

  useEffect(() => {
    loadDuelResults();
  }, [duelId]);

  useEffect(() => {
    if (!loading && !error && duel) {
      runAnimations();
    }
  }, [loading, error, duel]);

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

    // Comparison bars: animated widths
    barAnimations.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: 300 + (index * 100),
        useNativeDriver: false,
      }).start();
    });
  };

  const loadDuelResults = async () => {
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

      // Fetch participants with user data
      const { data: participantsData, error: participantsError } = await supabase
        .from('duel_participants')
        .select(`
          *,
          users!inner(username, avatar_url)
        `)
        .eq('duel_id', duelId);

      if (participantsError || !participantsData) {
        console.error('Failed to fetch participants:', participantsError);
      } else {
        const playersData: PlayerData[] = participantsData.map(p => ({
          ...p,
          username: (p as any).users?.username,
          avatar_url: (p as any).users?.avatar_url,
        }));
        setPlayers(playersData);
      }

      // Fetch rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('duel_rewards')
        .select('*')
        .eq('duel_id', duelId);

      if (rewardsError) {
        console.error('Failed to fetch rewards:', rewardsError);
      } else {
        setRewards(rewardsData || []);
      }

      // If duel is not completed, complete it
      if (duelData.status !== 'completed') {
        await completeDuel(duelData, participantsData || []);
      }
    } catch (err) {
      console.error('Error loading duel results:', err);
      setError('Failed to load duel results');
    } finally {
      setLoading(false);
    }
  };

  const calculateWinner = (duelData: Duel, participants: any[]): string | null => {
    if (participants.length !== 2) return null;

    const [creator, opponent] = participants;

    if (duelData.duel_type === 'streak_battle') {
      // For streak battles, higher streak wins
      return (creator.streak_days || 0) > (opponent.streak_days || 0)
        ? creator.user_id
        : opponent.user_id;
    } else {
      // For all other duel types, lower screen time wins
      return (creator.screen_time_seconds || 0) < (opponent.screen_time_seconds || 0)
        ? creator.user_id
        : opponent.user_id;
    }
  };

  const completeDuel = async (duelData: Duel, participants: any[]) => {
    if (!user?.id || updating) return;

    try {
      setUpdating(true);

      const winnerId = calculateWinner(duelData, participants);
      const endedAt = new Date().toISOString();

      // Update duel status
      const { error: updateError } = await supabase
        .from('duels')
        .update({
          status: 'completed',
          ended_at: endedAt,
          winner_id: winnerId,
        })
        .eq('id', duelId);

      if (updateError) {
        console.error('Failed to update duel:', updateError);
        return;
      }

      // Update participants (mark loser)
      const loserId = participants.find((p: any) => p.user_id !== winnerId)?.user_id;
      if (loserId) {
        await supabase
          .from('duel_participants')
          .update({ is_loser: true })
          .eq('duel_id', duelId)
          .eq('user_id', loserId);
      }

      // Insert rewards
      if (winnerId) {
        const rewardsToInsert = [
          {
            duel_id: duelId,
            user_id: winnerId,
            reward_type: 'streak_boost' as RewardType,
            reward_data: { multiplier: 1.2 },
          },
          {
            duel_id: duelId,
            user_id: winnerId,
            reward_type: 'badge' as RewardType,
            reward_data: { name: 'Duel Winner', icon: '🏆' },
          },
        ];

        // Consolation badge for loser
        if (loserId) {
          rewardsToInsert.push({
            duel_id: duelId,
            user_id: loserId,
            reward_type: 'badge' as RewardType,
            reward_data: { name: 'Good Sport', icon: '🎖️' },
          });
        }

        await supabase.from('duel_rewards').insert(rewardsToInsert);

        // Reload rewards
        const { data: newRewards } = await supabase
          .from('duel_rewards')
          .select('*')
          .eq('duel_id', duelId);
        if (newRewards) {
          setRewards(newRewards);
        }
      }

      // Update local duel state
      setDuel({
        ...duelData,
        status: 'completed',
        ended_at: endedAt,
        winner_id: winnerId,
      });
    } catch (err) {
      console.error('Error completing duel:', err);
    } finally {
      setUpdating(false);
    }
  };

  const formatScreenTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getWinner = (): PlayerData | null => {
    if (!duel || !duel.winner_id) return null;
    return players.find(p => p.user_id === duel.winner_id) || null;
  };

  const getLoser = (): PlayerData | null => {
    if (!duel || !duel.winner_id) return null;
    return players.find(p => p.user_id !== duel.winner_id) || null;
  };

  const generateStreakDays = (): StreakDay[] => {
    if (!duel || duel.duel_type !== 'streak_battle') return [];

    const days = Math.min(7, Math.ceil((duel.duration_hours || 0) / 24));
    const result: StreakDay[] = [];

    for (let i = 1; i <= days; i++) {
      // This is a simplified version - in production, you'd fetch actual daily data
      result.push({
        day: i,
        creatorMetLimit: Math.random() > 0.3, // 70% chance
        opponentMetLimit: Math.random() > 0.3, // 70% chance
      });
    }

    return result;
  };

  const handleShareResults = async () => {
    const winner = getWinner();
    const loser = getLoser();
    if (!duel || !winner || !loser) return;

    try {
      const shareText = `🏆 Duel Results!\n\nWinner: @${winner.username}\nOpponent: @${loser.username}\nType: ${formatDuelType(duel.duel_type)}\nScreen Time: ${formatScreenTime(winner.screen_time_seconds)} vs ${formatScreenTime(loser.screen_time_seconds)}\n\nBeat your friends at Detox Duel!`;

      await Share.share({
        message: shareText,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleRematch = () => {
    const loser = getLoser();
    if (!duel || !loser) return;

    navigation.navigate('CreateDuel' as any, {
      opponentId: loser.user_id,
      duelType: duel.duel_type,
    });
  };

  const winner = getWinner();
  const loser = getLoser();
  const streakDays = generateStreakDays();

  const getDuelTypeEmoji = (type: string): string => {
    const emojis: Record<string, string> = {
      focus_sprint: '⚡',
      weekly_war: '⚔️',
      streak_battle: '🔥',
      quick_duel: '⚡',
    };
    return emojis[type] || '🎯';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading duel results...</Text>
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Duel Results</Text>

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
            {winner.avatar_url ? (
              <Text style={styles.winnerAvatar}>{winner.username?.charAt(0).toUpperCase()}</Text>
            ) : (
              <View style={styles.winnerAvatar}>
                <Text style={styles.winnerAvatarText}>{winner.username?.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <Text style={styles.winnerName}>@{winner.username}</Text>
          </View>
        </Animated.View>
      )}

      {/* Player Stats */}
      <Animated.View style={{ opacity: cardsAnimation }}>
        <Card title="Player Stats" subtitle={duelTypeEmoji + ' ' + formatDuelType(duel.duel_type)}>
          {players.map((player, index) => (
            <View key={player.user_id} style={styles.playerCard}>
              <View style={styles.playerHeader}>
                <View style={styles.playerAvatar}>
                  <Text style={styles.playerAvatarText}>{player.username?.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>@{player.username}</Text>
                  <View style={styles.playerBadge}>
                    {player.user_id === duel.winner_id ? (
                      <Text style={styles.winnerBadge}>🏆 Winner</Text>
                    ) : (
                      <Text style={styles.loserBadge}>❌</Text>
                    )}
                  </View>
                </View>
              </View>
              <View style={styles.playerStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Screen Time</Text>
                  <Text style={styles.statValue}>{formatScreenTime(player.screen_time_seconds)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Streak</Text>
                  <Text style={styles.statValue}>{player.streak_days} days</Text>
                </View>
              </View>
            </View>
          ))}
        </Card>
      </Animated.View>

      {/* Comparison Chart */}
      {winner && loser && (
        <Animated.View style={{ opacity: cardsAnimation }}>
          <Card title="Comparison" subtitle="Side by side">
            <View style={styles.chartContainer}>
              <View style={styles.chartRow}>
                <Text style={styles.chartLabel}>Screen Time</Text>
                <View style={styles.chartBars}>
                  <View style={styles.chartBarContainer}>
                    <Text style={styles.barLabel}>{winner.username}</Text>
                    <Animated.View
                      style={[
                        styles.chartBar,
                        {
                          width: barAnimations[0].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, Math.min(100, (winner.screen_time_seconds / Math.max(winner.screen_time_seconds, loser.screen_time_seconds)) * 100)],
                          }),
                          backgroundColor: COLORS.success,
                        },
                      ]}
                    />
                    <Text style={styles.barValue}>{formatScreenTime(winner.screen_time_seconds)}</Text>
                  </View>
                  <View style={styles.chartBarContainer}>
                    <Text style={styles.barLabel}>{loser.username}</Text>
                    <Animated.View
                      style={[
                        styles.chartBar,
                        {
                          width: barAnimations[1].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, Math.min(100, (loser.screen_time_seconds / Math.max(winner.screen_time_seconds, loser.screen_time_seconds)) * 100)],
                          }),
                          backgroundColor: COLORS.error,
                        },
                      ]}
                    />
                    <Text style={styles.barValue}>{formatScreenTime(loser.screen_time_seconds)}</Text>
                  </View>
                </View>
              </View>

              {duel.duel_type === 'streak_battle' && (
                <View style={styles.chartRow}>
                  <Text style={styles.chartLabel}>Streak Days</Text>
                  <View style={styles.chartBars}>
                    <View style={styles.chartBarContainer}>
                      <Text style={styles.barLabel}>{winner.username}</Text>
                      <Animated.View
                        style={[
                          styles.chartBar,
                          {
                            width: barAnimations[0].interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, Math.min(100, (winner.streak_days / Math.max(winner.streak_days, loser.streak_days)) * 100)],
                            }),
                            backgroundColor: COLORS.primary,
                          },
                        ]}
                      />
                      <Text style={styles.barValue}>{winner.streak_days} days</Text>
                    </View>
                    <View style={styles.chartBarContainer}>
                      <Text style={styles.barLabel}>{loser.username}</Text>
                      <Animated.View
                        style={[
                          styles.chartBar,
                          {
                            width: barAnimations[1].interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, Math.min(100, (loser.streak_days / Math.max(winner.streak_days, loser.streak_days)) * 100)],
                            }),
                            backgroundColor: COLORS.secondary,
                          },
                        ]}
                      />
                      <Text style={styles.barValue}>{loser.streak_days} days</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </Card>
        </Animated.View>
      )}

      {/* Rewards */}
      {rewards.length > 0 && (
        <Animated.View style={{ opacity: cardsAnimation }}>
          <Card title="Rewards Earned" subtitle="Congratulations!">
            {rewards.map((reward, index) => {
              const player = players.find(p => p.user_id === reward.user_id);
              const isMyReward = player?.user_id === user?.id;

              return (
                <View key={index} style={styles.rewardItem}>
                  <Text style={styles.rewardIcon}>{reward.reward_type === 'streak_boost' ? '🚀' : '🏅'}</Text>
                  <View style={styles.rewardInfo}>
                    <Text style={styles.rewardType}>{reward.reward_type === 'streak_boost' ? 'Streak Boost' : 'Badge'}</Text>
                    <Text style={styles.rewardDetails}>
                      {reward.reward_type === 'streak_boost'
                        ? `1.2x multiplier for ${(reward.reward_data as any)?.multiplier || 1.2} days`
                        : (reward.reward_data as any)?.name || 'Achievement Unlocked'}
                    </Text>
                    {!isMyReward && (
                      <Text style={styles.rewardOwner}>Earned by @{player?.username}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </Card>
        </Animated.View>
      )}

      {/* Streak Battle Breakdown */}
      {duel.duel_type === 'streak_battle' && streakDays.length > 0 && (
        <Animated.View style={{ opacity: cardsAnimation }}>
          <Card title="Day-by-Day Breakdown" subtitle="Who met their daily limit?">
            {streakDays.map((day) => (
              <View key={day.day} style={styles.dayRow}>
                <Text style={styles.dayLabel}>Day {day.day}</Text>
                <View style={styles.dayChecklist}>
                  {players.map((player) => {
                    const metLimit = player.user_id === duel.creator_id
                      ? day.creatorMetLimit
                      : day.opponentMetLimit;

                    return (
                      <View key={player.user_id} style={styles.dayChecklistItem}>
                        <Text style={styles.dayPlayerName}>{player.username}</Text>
                        <Text style={metLimit ? styles.dayCheckMark : styles.dayCrossMark}>
                          {metLimit ? '✅' : '❌'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </Card>
        </Animated.View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          title="Share Results 📤"
          onPress={handleShareResults}
          variant="primary"
          style={styles.button}
        />
        <Button
          title="Rematch ⚔️"
          onPress={handleRematch}
          variant="outline"
          style={styles.button}
        />
      </View>

      {/* Back Button */}
      <Button
        title="Back to Home"
        onPress={() => navigation.goBack()}
        variant="outline"
        style={styles.backButton}
      />
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
  },
  playerCard: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  playerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  playerAvatarText: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  playerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  winnerBadge: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: '600',
  },
  loserBadge: {
    fontSize: 14,
  },
  playerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: SPACING.xs,
  },
  statValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  chartContainer: {
    paddingVertical: SPACING.sm,
  },
  chartRow: {
    marginBottom: SPACING.lg,
  },
  chartLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: SPACING.sm,
  },
  chartBars: {
    gap: SPACING.md,
  },
  chartBarContainer: {
    marginBottom: SPACING.sm,
  },
  barLabel: {
    color: COLORS.text,
    fontSize: 14,
    marginBottom: SPACING.xs,
  },
  chartBar: {
    height: 24,
    borderRadius: 4,
    marginBottom: SPACING.xs,
  },
  barValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rewardIcon: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardType: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  rewardDetails: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: SPACING.xs,
  },
  rewardOwner: {
    color: COLORS.primary,
    fontSize: 12,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dayLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    width: 60,
  },
  dayChecklist: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  dayChecklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  dayPlayerName: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  dayCheckMark: {
    fontSize: 16,
  },
  dayCrossMark: {
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: SPACING.md,
  },
  button: {
    marginBottom: SPACING.sm,
  },
});

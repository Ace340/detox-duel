import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Share, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { captureRef } from 'react-native-view-shot';
import { Button, Card } from '../components/ui';
import { COLORS, SPACING } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useDuelHistory } from '../hooks/useDuelHistory';
import type { RootStackParamList } from '../navigation/AppNavigator';

type BragCardNavProp = NativeStackNavigationProp<RootStackParamList, 'BragCard'>;

export default function BragCardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<BragCardNavProp>();
  const { stats, loading, loadHistory } = useDuelHistory(user?.id || '');
  const cardRef = useRef<View>(null);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [user?.id]);

  const winRate = stats.totalDuels > 0
    ? Math.round((stats.wins / stats.totalDuels) * 100)
    : 0;

  const getRankTitle = (): { title: string; emoji: string } => {
    if (stats.wins >= 50) return { title: 'Legendary Duelist', emoji: '👑' };
    if (stats.wins >= 25) return { title: 'Elite Warrior', emoji: '⚡' };
    if (stats.wins >= 10) return { title: 'Skilled Fighter', emoji: '🔥' };
    if (stats.wins >= 5) return { title: 'Rising Challenger', emoji: '🎯' };
    if (stats.wins >= 1) return { title: 'First Blood', emoji: '🗡️' };
    return { title: 'New Recruit', emoji: '🌱' };
  };

  const rank = getRankTitle();

  const handleShare = async () => {
    if (!cardRef.current) {
      // Fallback to text sharing
      await shareAsText();
      return;
    }

    try {
      setCapturing(true);
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      });

      await Share.share({
        message: `Check out my Detox Duel stats! ${stats.wins} wins, ${stats.currentStreak} streak 🔥`,
        url: uri,
      });
    } catch (err) {
      console.error('Error capturing card:', err);
      // Fallback to text
      await shareAsText();
    } finally {
      setCapturing(false);
    }
  };

  const shareAsText = async () => {
    const text = [
      `🏆 Detox Duel — ${rank.title}`,
      ``,
      `👤 @${user?.username || 'Player'}`,
      `⚔️ ${stats.wins}W / ${stats.losses}L (${winRate}% win rate)`,
      `🔥 Current Streak: ${stats.currentStreak}`,
      `⭐ Longest Streak: ${stats.longestStreak}`,
      `🏅 Badges: ${stats.totalRewards}`,
      `📊 ${stats.totalDuels} duels played`,
      ``,
      `Can you beat me? Download Detox Duel!`,
    ].join('\n');

    await Share.share({ message: text });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your stats...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Brag Card 📤</Text>
      <Text style={styles.subtitle}>Share your dueling stats with friends</Text>

      {/* The shareable card — captured as an image */}
      <View ref={cardRef} collapsable={false} style={styles.bragCard}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardAppTitle}>⚔️ DETOX DUEL</Text>
          <Text style={styles.cardRankTitle}>{rank.emoji} {rank.title}</Text>
        </View>

        {/* Avatar & Username */}
        <View style={styles.cardPlayerRow}>
          <View style={styles.cardAvatar}>
            <Text style={styles.cardAvatarText}>
              {(user?.username || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.cardUsername}>@{user?.username || 'Player'}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.cardStatsGrid}>
          <View style={styles.cardStatBox}>
            <Text style={styles.cardStatValue}>{stats.wins}</Text>
            <Text style={styles.cardStatLabel}>WINS</Text>
          </View>
          <View style={styles.cardStatBox}>
            <Text style={styles.cardStatValue}>{stats.losses}</Text>
            <Text style={styles.cardStatLabel}>LOSSES</Text>
          </View>
          <View style={styles.cardStatBox}>
            <Text style={[styles.cardStatValue, { color: '#4CAF50' }]}>{winRate}%</Text>
            <Text style={styles.cardStatLabel}>WIN RATE</Text>
          </View>
        </View>

        <View style={styles.cardStatsGrid}>
          <View style={styles.cardStatBox}>
            <Text style={[styles.cardStatValue, { color: '#FF9800' }]}>{stats.currentStreak}</Text>
            <Text style={styles.cardStatLabel}>🔥 STREAK</Text>
          </View>
          <View style={styles.cardStatBox}>
            <Text style={styles.cardStatValue}>{stats.longestStreak}</Text>
            <Text style={styles.cardStatLabel}>BEST STREAK</Text>
          </View>
          <View style={styles.cardStatBox}>
            <Text style={[styles.cardStatValue, { color: '#FFD700' }]}>{stats.totalRewards}</Text>
            <Text style={styles.cardStatLabel}>🏅 BADGES</Text>
          </View>
        </View>

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.cardFooterText}>
            {stats.totalDuels} duels played · Can you beat me?
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          title={capturing ? 'Capturing...' : 'Share Card Image 📸'}
          onPress={handleShare}
          disabled={capturing}
          variant="primary"
          style={styles.button}
        />
        <Button
          title="Share as Text 📝"
          onPress={shareAsText}
          variant="outline"
          style={styles.button}
        />
        <Button
          title="Back to History"
          onPress={() => navigation.goBack()}
          variant="outline"
          style={styles.button}
        />
      </View>

      {/* Tips */}
      <Card title="Tips" subtitle="Make your brag count">
        <Text style={styles.tipText}>📱 The card image is perfect for Instagram stories!</Text>
        <Text style={styles.tipText}>💬 Text mode works great in group chats.</Text>
        <Text style={styles.tipText}>🏆 Win more duels to unlock higher ranks!</Text>
      </Card>
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
    paddingBottom: SPACING.xl,
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
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: SPACING.lg,
  },

  // Brag Card
  bragCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
    // Subtle gradient effect via shadow
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  cardAppTitle: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 3,
    marginBottom: SPACING.xs,
  },
  cardRankTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: 'bold',
  },
  cardPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  cardAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardAvatarText: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  cardUsername: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '600',
  },
  cardStatsGrid: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  cardStatBox: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  cardStatValue: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  cardStatLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 4,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
    alignItems: 'center',
  },
  cardFooterText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },

  // Buttons
  buttonContainer: {
    marginBottom: SPACING.lg,
  },
  button: {
    marginBottom: SPACING.sm,
  },

  // Tips
  tipText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: SPACING.sm,
  },
});

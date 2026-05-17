import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface StreakMilestoneCelebrationProps {
  milestone: number;
  emoji: string;
  visible: boolean;
  onDismiss: () => void;
}

// =====================================================
// MILESTONE EMOJI MAP
// =====================================================

const MILESTONE_EMOJIS: Record<number, string> = {
  3: '🔥',
  7: '⚡',
  14: '💎',
  30: '👑',
};

const MILESTONE_LABELS: Record<number, string> = {
  3: '3-Day Streak!',
  7: 'Week Warrior!',
  14: '2-Week Champion!',
  30: '30-Day Legend!',
};

// =====================================================
// COMPONENT
// =====================================================

/**
 * Streak Milestone Celebration Component
 *
 * Displays an animated celebration when user reaches a streak milestone.
 * Auto-dismisses after 3 seconds or can be dismissed by tapping.
 */
export function StreakMilestoneCelebration({
  milestone,
  emoji,
  visible,
  onDismiss,
}: StreakMilestoneCelebrationProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      startAnimations();

      const timer = setTimeout(() => {
        dismiss();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const startAnimations = () => {
    scaleAnim.setValue(0);
    opacityAnim.setValue(0);
    rotateAnim.setValue(0);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const handleBackdropPress = () => {
    dismiss();
  };

  if (!visible) {
    return null;
  }

  const displayEmoji = emoji || MILESTONE_EMOJIS[milestone] || '🎉';
  const label = MILESTONE_LABELS[milestone] || `${milestone}-Day Streak!`;

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '10deg', '0deg'],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={dismiss}
    >
      <Animated.View style={[styles.container, { opacity: opacityAnim }]}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleBackdropPress}
        >
          <TouchableOpacity activeOpacity={1} style={styles.contentContainer}>
            <Animated.View
              style={[
                styles.celebrationCard,
                {
                  transform: [{ scale: scaleAnim }],
                },
               ]}
             >
               <Animated.View
                 style={[
                   styles.emojiContainer,
                   {
                     transform: [{ rotate: rotateInterpolate }],
                   },
                 ]}
               >
                 <Text style={styles.emoji}>{displayEmoji}</Text>
               </Animated.View>

               <Text style={styles.label}>{label}</Text>

               <Text style={styles.subtitle}>
                 Amazing work! Keep it going!
               </Text>

               <TouchableOpacity onPress={dismiss} style={styles.dismissButton}>
                 <Text style={styles.dismissText}>Tap to dismiss</Text>
               </TouchableOpacity>
             </Animated.View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  contentContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationCard: {
    width: SCREEN_WIDTH * 0.85,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: SPACING.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emojiContainer: {
    marginBottom: SPACING.md,
  },
  emoji: {
    fontSize: 80,
    textAlign: 'center',
  },
  label: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  dismissButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  dismissText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

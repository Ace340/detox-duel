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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface Badge {
  emoji: string;
  name: string;
  description: string;
}

export interface BadgeCelebrationProps {
  badge: Badge;
  visible: boolean;
  onDismiss: () => void;
}

// =====================================================
// COMPONENT
// =====================================================

/**
 * Badge Celebration Component
 *
 * Displays an animated celebration when user earns a new badge.
 * Auto-dismisses after 3 seconds or can be dismissed by tapping.
 */
export function BadgeCelebration({
  badge,
  visible,
  onDismiss,
}: BadgeCelebrationProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

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

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
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
               <Text style={styles.emoji}>{badge.emoji}</Text>

               <Text style={styles.heading}>Congratulations!</Text>

               <Text style={styles.badgeName}>{badge.name}</Text>

               <Text style={styles.badgeDescription}>{badge.description}</Text>
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
  emoji: {
    fontSize: 80,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  badgeName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  badgeDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

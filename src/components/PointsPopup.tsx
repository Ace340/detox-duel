import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/theme';

interface PointsPopupProps {
  visible: boolean;
  points: number;
  onComplete?: () => void;
  x?: number;
  y?: number;
}

/**
 * Animated popup component for displaying points notifications
 * Shows points with emoji, fades in, floats up, and fades out
 */
const PointsPopup: React.FC<PointsPopupProps> = ({
  visible,
  points,
  onComplete,
  x,
  y,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  const [show, setShow] = useState(visible);

  const animateIn = () => {
    fadeAnim.setValue(0);
    translateY.setValue(50);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();
  };

  const animateOut = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -50, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setShow(false);
      onComplete?.();
    });
  };

  useEffect(() => {
    if (visible) {
      setShow(true);
      animateIn();
      const timer = setTimeout(animateOut, 1700);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const position = x !== undefined && y !== undefined ? { left: x, top: y } : {};

  return (
    <View style={[styles.overlay, position]}>
      <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY }] }]}>
        <Text style={styles.text}>+{points} 🪙</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  container: {
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  text: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default PointsPopup;
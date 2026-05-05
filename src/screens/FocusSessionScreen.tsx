import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Card } from '../components/ui';
import { COLORS, SPACING } from '../constants/theme';
import { useFocusTimer } from '../hooks/useFocusTimer';
import { formatSecondsToMMSS } from '../utils/timeFormat';

type RootStackParamList = {
  Tabs: undefined;
  FocusSession: {
    duration: number;
    onComplete: () => void;
    onCancel: () => void;
  };
};

type FocusSessionScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'FocusSession'
>;

export default function FocusSessionScreen({ route, navigation }: FocusSessionScreenProps) {
  const { duration, onComplete, onCancel } = route.params;
  const { remainingSeconds, isRunning, startTimer, stopTimer, resetTimer } =
    useFocusTimer(duration * 60);

  useEffect(() => {
    startTimer();
  }, [startTimer]);

  useEffect(() => {
    if (remainingSeconds === 0 && !isRunning) {
      onComplete();
    }
  }, [remainingSeconds, isRunning, onComplete]);

  const handleComplete = () => {
    stopTimer();
    onComplete();
  };

  const handleCancel = () => {
    stopTimer();
    onCancel();
  };

  return (
    <View style={styles.container}>
      <Card title="Focus Mode Active" subtitle={`Session: ${duration} minutes`}>
        <Text style={styles.timer}>{formatSecondsToMMSS(remainingSeconds)}</Text>
        <View style={styles.buttonContainer}>
          <Button title="Complete Session" onPress={handleComplete} />
          <Button
            title="Cancel"
            variant="secondary"
            onPress={handleCancel}
          />
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  timer: {
    color: COLORS.primary,
    fontSize: 72,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: SPACING.xl,
  },
  buttonContainer: {
    gap: SPACING.sm,
  },
});

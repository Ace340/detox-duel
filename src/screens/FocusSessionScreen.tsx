import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, Card } from '../components/ui';
import { COLORS, SPACING } from '../constants/theme';
import { useFocusTimer } from '../hooks/useFocusTimer';
import { formatSecondsToMMSS } from '../utils/timeFormat';
import { useFocusSession } from '../hooks/useFocusSession';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// TODO: Replace with actual UUID from Supabase
const MOCK_USER_ID = 'YOUR_UUID_HERE';

type Props = NativeStackScreenProps<RootStackParamList, 'FocusSession'>;

export default function FocusSessionScreen({ route, navigation }: Props) {
  const { duration } = route.params;
  const { completeSession, cancelSession } = useFocusSession(MOCK_USER_ID);
  const { remainingSeconds, isRunning, startTimer, stopTimer } = useFocusTimer(duration * 60);

  useEffect(() => {
    startTimer();
  }, [startTimer]);

  useEffect(() => {
    if (remainingSeconds === 0 && !isRunning) {
      completeSession();
      navigation.goBack();
    }
  }, [remainingSeconds, isRunning, completeSession, navigation]);

  const handleComplete = () => {
    stopTimer();
    completeSession();
    navigation.goBack();
  };

  const handleCancel = () => {
    stopTimer();
    cancelSession();
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Card title="Focus Mode Active" subtitle={`Session: ${duration} minutes`}>
        <Text style={styles.timer}>{formatSecondsToMMSS(remainingSeconds)}</Text>
        <View style={styles.buttonContainer}>
          <Button title="Complete Session" onPress={handleComplete} />
          <Button title="Cancel" variant="secondary" onPress={handleCancel} />
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

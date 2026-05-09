import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Button, Card } from '../components/ui';
import { COLORS, SPACING } from '../constants/theme';
import type { RootStackParamList } from '../navigation/AppNavigator';

type CreateDuelScreenRouteProp = RouteProp<RootStackParamList, 'CreateDuel'>;

export default function CreateDuelScreen({ navigation }: any) {
  const route = useRoute<CreateDuelScreenRouteProp>();
  const { opponentId, duelType } = route.params || {};

  const handleCreateDuel = () => {
    navigation.navigate('SelectFriend' as any);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Welcome to Duels! ⚔️</Text>
      <Text style={styles.description}>
        Challenge your friends to focus competitions. Block apps together, stay focused, and see who can maintain the longest streak!
      </Text>

      <Card
        title="Create New Duel"
        subtitle="Start a new focus challenge with a friend"
      >
        <View style={styles.spacer} />
        <Text style={styles.info}>🎯 Choose a friend to challenge</Text>
        <Text style={styles.info}>⏱️ Pick a duel duration</Text>
        <Text style={styles.info}>📱 Select apps to ban</Text>
        <Text style={styles.info}>🏆 Compete and win rewards</Text>

        <View style={styles.spacer} />
        <Button
          title="Select Friend 👥"
          variant="primary"
          onPress={handleCreateDuel}
        />
      </Card>

      <Card title="How Duels Work" subtitle="Simple steps to get started">
        <View style={styles.step}>
          <Text style={styles.stepNumber}>1</Text>
          <Text style={styles.stepText}>Select a friend to challenge</Text>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>2</Text>
          <Text style={styles.stepText}>Choose duel type and duration</Text>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>3</Text>
          <Text style={styles.stepText}>Pick apps to block during the duel</Text>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>4</Text>
          <Text style={styles.stepText}>Send challenge and compete!</Text>
        </View>
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
  },
  greeting: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: SPACING.lg,
    lineHeight: 24,
  },
  spacer: {
    height: SPACING.md,
  },
  info: {
    color: COLORS.text,
    fontSize: 16,
    marginBottom: SPACING.sm,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 28,
    marginRight: SPACING.sm,
  },
  stepText: {
    color: COLORS.text,
    fontSize: 15,
    flex: 1,
  },
});

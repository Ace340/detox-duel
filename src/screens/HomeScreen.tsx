import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button, Card } from '../components/ui';
import { COLORS, SPACING, FOCUS_PRESETS } from '../constants/theme';

export default function HomeScreen() {
  const [activeSession, setActiveSession] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(30);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Ready to focus? 🎯</Text>

      <Card title="Start Focus Session" subtitle="Block distractions and get in the zone">
        <Text style={styles.label}>Choose duration:</Text>
        <View style={styles.presets}>
          {FOCUS_PRESETS.map((preset) => (
            <Button
              key={preset.minutes}
              title={preset.label}
              variant={selectedDuration === preset.minutes ? 'primary' : 'outline'}
              onPress={() => setSelectedDuration(preset.minutes)}
            />
          ))}
        </View>
        <View style={styles.spacer} />
        <Button
          title={activeSession ? 'End Session' : 'Start Focusing'}
          variant={activeSession ? 'secondary' : 'primary'}
          onPress={() => setActiveSession(!activeSession)}
        />
      </Card>

      <Card title="Today's Progress" subtitle="Keep it up!">
        <Text style={styles.stat}>🔥 0 min focused today</Text>
        <Text style={styles.stat}>📅 0 sessions completed</Text>
      </Card>

      <Card title="Weekly Rank" subtitle="#1 — That's you! (for now)">
        <Text style={styles.stat}>🏆 You: 0 min</Text>
        <Text style={styles.stat}>Add friends to compete!</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  greeting: { color: COLORS.text, fontSize: 28, fontWeight: 'bold', marginBottom: SPACING.lg },
  label: { color: COLORS.textSecondary, fontSize: 14, marginBottom: SPACING.sm },
  presets: { gap: SPACING.sm },
  spacer: { height: SPACING.md },
  stat: { color: COLORS.text, fontSize: 16, marginBottom: SPACING.sm },
});

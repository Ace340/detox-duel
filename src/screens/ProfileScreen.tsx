import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Button } from '../components/ui';
import { COLORS, SPACING } from '../constants/theme';

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile 👤</Text>

      <Card title="Your Stats">
        <Text style={styles.stat}>📅 Total focus sessions: 0</Text>
        <Text style={styles.stat}>⏱ Total focus time: 0 min</Text>
        <Text style={styles.stat}>🔥 Best streak: 0 days</Text>
        <Text style={styles.stat}>🏆 Weekly rank: #1</Text>
      </Card>

      <Card title="Settings">
        <Button title="Edit Profile (coming soon)" variant="outline" onPress={() => {}} />
        <View style={styles.spacer} />
        <Button title="Sign Out" variant="secondary" onPress={() => {}} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  title: { color: COLORS.text, fontSize: 28, fontWeight: 'bold', marginBottom: SPACING.lg },
  stat: { color: COLORS.text, fontSize: 16, marginBottom: SPACING.sm },
  spacer: { height: SPACING.sm },
});

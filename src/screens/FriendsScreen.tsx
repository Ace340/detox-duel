import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Button } from '../components/ui';
import { COLORS, SPACING } from '../constants/theme';

export default function FriendsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Friends 👥</Text>

      <Card title="Add Friend" subtitle="Enter their username to challenge them">
        <Button title="Search (coming soon)" variant="outline" onPress={() => {}} />
      </Card>

      <Card title="Your Friends" subtitle="No friends yet — add someone to start competing!">
        <Text style={styles.empty}>Send your username to friends so they can add you.</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  title: { color: COLORS.text, fontSize: 28, fontWeight: 'bold', marginBottom: SPACING.lg },
  empty: { color: COLORS.textSecondary, fontSize: 14 },
});

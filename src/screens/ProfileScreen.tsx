import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Button } from '../components/ui';
import { COLORS, SPACING } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useFocusSession } from '../hooks/useFocusSession';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { todayTotal } = useFocusSession(user?.id || '');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile 👤</Text>

      <Card title={user?.username || 'User'} subtitle={user?.email}>
        <Text style={styles.stat}>📅 Total focus time: {todayTotal} min</Text>
      </Card>

      <Card title="Settings">
        <Button title="Sign Out" variant="secondary" onPress={signOut} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  title: { color: COLORS.text, fontSize: 28, fontWeight: 'bold', marginBottom: SPACING.lg },
  stat: { color: COLORS.text, fontSize: 16, marginBottom: SPACING.sm },
});

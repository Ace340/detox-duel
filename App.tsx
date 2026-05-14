import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from './src/constants/theme';
import AppNavigator from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';

export default function App() {
  return (
    <SafeAreaProvider style={styles.container}>
      <ErrorBoundary>
        <AppNavigator />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
});

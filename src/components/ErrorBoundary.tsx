import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>😵</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            We encountered an unexpected error. Please try again.
          </Text>
          <TouchableOpacity style={styles.restartButton} onPress={this.handleRestart}>
            <Text style={styles.restartButtonText}>Restart App</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emoji: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  restartButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
  },
  restartButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { Linking } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { AppBlocker, PermissionStatus } from '../services/appBlocker';

type AccessibilityGuideNavProp = NativeStackNavigationProp<RootStackParamList>;

interface StepCardProps {
  stepNumber: number;
  title: string;
  description: string;
  emoji?: string;
}

function StepCard({ stepNumber, title, description, emoji = '📋' }: StepCardProps) {
  return (
    <View style={styles.stepCard}>
      <View style={styles.stepHeader}>
        <View style={styles.stepNumberContainer}>
          <Text style={styles.stepNumber}>{stepNumber}</Text>
        </View>
        <View style={styles.stepTitleContainer}>
          <Text style={styles.stepEmoji}>{emoji}</Text>
          <Text style={styles.stepTitle}>{title}</Text>
        </View>
      </View>
      <Text style={styles.stepDescription}>{description}</Text>
    </View>
  );
}

function VisualGuidePlaceholder() {
  return (
    <View style={styles.visualGuideContainer}>
      <View style={styles.visualGuidePlaceholder}>
        <Text style={styles.visualGuideIcon}>📱</Text>
        <Text style={styles.visualGuideText}>Visual Guide</Text>
        <Text style={styles.visualGuideSubtext}>Screenshot coming soon</Text>
      </View>
    </View>
  );
}

export default function AccessibilityGuideScreen() {
  const navigation = useNavigation<AccessibilityGuideNavProp>();
  const [checking, setChecking] = useState(false);
  const [lastStatus, setLastStatus] = useState<PermissionStatus | null>(null);

  const handleOpenOverlaySettings = useCallback(async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error('Failed to open overlay settings:', error);
    }
  }, []);

  const handleOpenAccessibilitySettings = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        await Linking.sendIntent('android.settings.ACCESSIBILITY_SETTINGS');
      }
    } catch (error) {
      console.error('Failed to open accessibility settings:', error);
      try {
        await Linking.openSettings();
      } catch (fallbackError) {
        console.error('Failed to open fallback settings:', fallbackError);
      }
    }
  }, []);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handlePermissionGranted = useCallback(async () => {
    setChecking(true);
    try {
      const status = await AppBlocker.getPermissionStatus();
      setLastStatus(status);

      if (status.allGranted) {
        navigation.goBack();
      } else {
        const missing: string[] = [];
        if (!status.overlay) missing.push('"Display over other apps" (overlay)');
        if (!status.accessibility) missing.push('Accessibility Service');

        Alert.alert(
          'Not Yet Enabled',
          `Still missing:\n\n${missing.map(m => `• ${m}`).join('\n')}\n\n` +
          'Please follow all steps below and enable both permissions.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to check permission:', error);
      Alert.alert(
        'Error',
        'Could not verify permission status. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setChecking(false);
    }
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🛡️ Accessibility Setup Guide</Text>
        </View>

        {/* Status Banner */}
        {lastStatus && !lastStatus.allGranted && (
          <View style={styles.statusBanner}>
            <Text style={styles.statusBannerText}>
              ⚠️ Missing: {!lastStatus.overlay ? ' Overlay' : ''}{!lastStatus.accessibility ? ' Accessibility' : ''}
            </Text>
          </View>
        )}

        {/* Explanation Card */}
        <View style={styles.explanationCard}>
          <Text style={styles.explanationTitle}>Why is this needed?</Text>
          <Text style={styles.explanationText}>
            Detox Duel needs TWO permissions to block distracting apps during focus sessions and duels:
          </Text>
          <Text style={styles.explanationDetail}>
            1. Display over other apps — to show the blocking screen{'\n'}
            2. Accessibility Service — to detect when you open a banned app
          </Text>
          <Text style={styles.explanationPrivacy}>
            🔒 Your privacy is important — we never collect your personal data or track what apps you use.
          </Text>
        </View>

        {/* Visual Guide Placeholder */}
        <VisualGuidePlaceholder />

        {/* Steps */}
        <View style={styles.stepsContainer}>
          <Text style={styles.sectionTitle}>Setup Steps</Text>

          <StepCard
            stepNumber={1}
            emoji="📱"
            title="Enable Display Over Other Apps"
            description="Open your device Settings → Apps → Special access → Display over other apps → find Detox Duel → toggle ON. This lets the app show the blocking screen on top of other apps."
          />

          <TouchableOpacity
            style={styles.inlineButton}
            onPress={handleOpenOverlaySettings}
            activeOpacity={0.7}
          >
            <Text style={styles.inlineButtonText}>📱 Open App Settings for Overlay</Text>
          </TouchableOpacity>

          <View style={styles.stepDivider} />

          <StepCard
            stepNumber={2}
            emoji="⚙️"
            title="Open Accessibility Settings"
            description="Tap the button below, or go to Settings → Accessibility"
          />

          <StepCard
            stepNumber={3}
            emoji="🔍"
            title="Find Installed Services"
            description="On Samsung: scroll to bottom and tap 'Installed services'. On other devices: look for 'Services' or 'Downloaded services'."
          />

          <StepCard
            stepNumber={4}
            emoji="🔘"
            title="Enable Detox Duel"
            description="Find 'Detox Duel App Blocker' in the list, tap it, and toggle it ON"
          />

          <StepCard
            stepNumber={5}
            emoji="✅"
            title="Allow & Confirm"
            description="A permission warning will appear. Tap 'Allow' or 'OK' to confirm, then come back and tap 'I've Enabled Both' below"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handlePermissionGranted}
            activeOpacity={0.7}
            disabled={checking}
          >
            <Text style={styles.primaryButtonText}>
              {checking ? 'Checking...' : '✅ I\'ve Enabled Both'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleOpenAccessibilitySettings}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>⚙️ Open Accessibility Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tertiaryButton}
            onPress={handleGoBack}
            activeOpacity={0.7}
          >
            <Text style={styles.tertiaryButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
  },
  explanationCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  explanationTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  explanationText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  explanationDetail: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: SPACING.md,
    fontWeight: '500',
  },
  explanationPrivacy: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  visualGuideContainer: {
    marginBottom: SPACING.lg,
  },
  visualGuidePlaceholder: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  visualGuideIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  visualGuideText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  visualGuideSubtext: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  stepsContainer: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  stepCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  stepNumberContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${COLORS.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  stepNumber: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepEmoji: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  stepTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  stepDescription: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 52,
  },
  actionButtons: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  tertiaryButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
  },
  tertiaryButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  statusBanner: {
    backgroundColor: `${COLORS.warning || '#FF9800'}20`,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.warning || '#FF9800',
  },
  statusBannerText: {
    color: COLORS.warning || '#FF9800',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  inlineButton: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: SPACING.md,
  },
  inlineButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  stepDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
    marginLeft: 52,
  },
});
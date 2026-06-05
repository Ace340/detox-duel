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
  useWindowDimensions,
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

/**
 * Tablet-specific OEM instructions for finding Accessibility settings.
 */
function TabletOEMGuide() {
  return (
    <View style={styles.oemCard}>
      <Text style={styles.oemTitle}>📋 Tablet-Specific Instructions</Text>
      <Text style={styles.oemSubtitle}>
        Accessibility settings locations vary by tablet manufacturer:
      </Text>

      <View style={styles.oemEntry}>
        <Text style={styles.oemBrand}>Samsung Galaxy Tab</Text>
        <Text style={styles.oemPath}>
          Settings → Accessibility → Installed services → Detox Duel App Blocker → Enable
        </Text>
      </View>

      <View style={styles.oemEntry}>
        <Text style={styles.oemBrand}>Xiaomi / Poco Pad</Text>
        <Text style={styles.oemPath}>
          Settings → Additional settings → Accessibility → Downloaded services → Detox Duel → Enable
        </Text>
      </View>

      <View style={styles.oemEntry}>
        <Text style={styles.oemBrand}>Huawei / Honor MatePad</Text>
        <Text style={styles.oemPath}>
          Settings → Accessibility → Accessibility → Installed services → Detox Duel → Enable
        </Text>
      </View>

      <View style={styles.oemEntry}>
        <Text style={styles.oemBrand}>Lenovo Tab</Text>
        <Text style={styles.oemPath}>
          Settings → Accessibility → Services → Detox Duel App Blocker → Enable
        </Text>
      </View>

      <View style={styles.oemEntry}>
        <Text style={styles.oemBrand}>Amazon Fire Tablet</Text>
        <Text style={styles.oemPath}>
          Settings → Accessibility → Detected services → Detox Duel → Enable
        </Text>
      </View>

      <View style={styles.oemEntry}>
        <Text style={styles.oemBrand}>OPPO / OnePlus Pad</Text>
        <Text style={styles.oemPath}>
          Settings → Additional settings → Accessibility → Installed services → Detox Duel → Enable
        </Text>
      </View>

      <Text style={styles.oemTip}>
        💡 Tip: If you can't find "Accessibility" in Settings, try searching for it using the search bar at the top of Settings.
      </Text>
    </View>
  );
}

export default function AccessibilityGuideScreen() {
  const navigation = useNavigation<AccessibilityGuideNavProp>();
  const [checking, setChecking] = useState(false);
  const [lastStatus, setLastStatus] = useState<PermissionStatus | null>(null);
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 600;
  const maxContentWidth = isTablet ? 700 : undefined;

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

  const handleOpenBatteryOptimization = useCallback(async () => {
    try {
      await AppBlocker.requestBatteryOptimizationWhitelist();
    } catch (error) {
      console.error('Failed to open battery optimization settings:', error);
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
        <View style={[styles.header, { maxWidth: maxContentWidth }]}>
          <Text style={[styles.headerTitle, { fontSize: isTablet ? 34 : 28 }]}>
            🛡️ Accessibility Setup Guide
          </Text>
        </View>

        {/* Status Banner */}
        {lastStatus && !lastStatus.allGranted && (
          <View style={[styles.statusBanner, { maxWidth: maxContentWidth }]}>
            <Text style={styles.statusBannerText}>
              ⚠️ Missing: {!lastStatus.overlay ? ' Overlay' : ''}{!lastStatus.accessibility ? ' Accessibility' : ''}
            </Text>
          </View>
        )}

        {/* Explanation Card */}
        <View style={[styles.explanationCard, { maxWidth: maxContentWidth, padding: isTablet ? SPACING.xl : SPACING.lg }]}>
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
        <View style={[styles.stepsContainer, { maxWidth: maxContentWidth }]}>
          <Text style={[styles.sectionTitle, { fontSize: isTablet ? 24 : 20 }]}>Setup Steps</Text>

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
            description={
              'On most devices: scroll to "Installed services" or "Downloaded services".\n' +
              'On Samsung: scroll to bottom and tap "Installed services".\n' +
              'On Xiaomi/Huawei: look under "Additional settings" first.'
            }
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

          <View style={styles.stepDivider} />

          <StepCard
            stepNumber={6}
            emoji="🔋"
            title="Disable Battery Optimization (Recommended)"
            description="On some tablets (Xiaomi, Huawei, Lenovo), the system may kill the blocking service to save battery. Whitelist Detox Duel to keep it running reliably during focus sessions."
          />

          <TouchableOpacity
            style={styles.inlineButton}
            onPress={handleOpenBatteryOptimization}
            activeOpacity={0.7}
          >
            <Text style={styles.inlineButtonText}>🔋 Open Battery Optimization</Text>
          </TouchableOpacity>
        </View>

        {/* Tablet-Specific OEM Guide */}
        <View style={[{ maxWidth: maxContentWidth, width: '100%' }]}>
          <TabletOEMGuide />
        </View>

        {/* Action Buttons */}
        <View style={[styles.actionButtons, { maxWidth: maxContentWidth }]}>
          <TouchableOpacity
            style={[styles.primaryButton, { paddingVertical: isTablet ? SPACING.xl : SPACING.lg }]}
            onPress={handlePermissionGranted}
            activeOpacity={0.7}
            disabled={checking}
          >
            <Text style={[styles.primaryButtonText, { fontSize: isTablet ? 18 : 16 }]}>
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
    alignItems: 'center',
  },
  header: {
    marginBottom: SPACING.lg,
    width: '100%',
  },
  headerTitle: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
  explanationCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    width: '100%',
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
    width: '100%',
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
    width: '100%',
  },
  sectionTitle: {
    color: COLORS.text,
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
  oemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  oemTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  oemSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: SPACING.md,
  },
  oemEntry: {
    marginBottom: SPACING.md,
    paddingLeft: SPACING.md,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.primary,
  },
  oemBrand: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  oemPath: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  oemTip: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '500',
    marginTop: SPACING.sm,
  },
  actionButtons: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
    width: '100%',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.background,
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
    width: '100%',
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

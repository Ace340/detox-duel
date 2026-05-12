import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { ScreenTimeTracker } from '../services/screenTimeTracker';

export function ScreenTimeTestScreen() {
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [usageData, setUsageData] = useState<{ [key: string]: number }>({});
  const [totalUsage, setTotalUsage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Common package names to test
  const testPackages = [
    'com.instagram.android',
    'com.twitter.android',
    'com.facebook.katana',
    'com.youtube.android',
  ];

  const checkPermission = async () => {
    setLoading(true);
    setError(null);
    try {
      const hasPermission = await ScreenTimeTracker.checkPermission();
      setPermissionStatus(hasPermission ? 'granted' : 'denied');
      console.log('Permission status:', hasPermission);
    } catch (err) {
      setError(`Error checking permission: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Permission check error:', err);
    } finally {
      setLoading(false);
    }
  };

  const requestPermission = () => {
    try {
      ScreenTimeTracker.requestPermission();
      Alert.alert(
        'Permission Requested',
        'Please grant "Usage access" permission in system settings:\n\n1. Find this app in the list\n2. Enable "Allow usage access"\n3. Return to this screen and tap "Check Permission" again'
      );
    } catch (err) {
      setError(`Error requesting permission: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Permission request error:', err);
    }
  };

  const getUsage = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get usage from last 24 hours
      const sinceTimestamp = Date.now() - (24 * 60 * 60 * 1000);
      const usage = await ScreenTimeTracker.getUsageForApps(testPackages, sinceTimestamp);

      console.log('Usage data:', usage);
      setUsageData(usage);

      // Calculate total
      const total = Object.values(usage).reduce((sum, secs) => sum + secs, 0);
      setTotalUsage(total);

      Alert.alert(
        'Usage Retrieved',
        `Total screen time: ${Math.floor(total / 60)} minutes`
      );
    } catch (err) {
      setError(`Error getting usage: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Usage error:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkLimit = async () => {
    setLoading(true);
    setError(null);
    try {
      const sinceTimestamp = Date.now() - (24 * 60 * 60 * 1000);
      const limitMinutes = 30; // 30 minute limit
      const limitSeconds = limitMinutes * 60;

      const exceeded = await ScreenTimeTracker.hasExceededLimit(
        testPackages,
        sinceTimestamp,
        limitSeconds
      );

      Alert.alert(
        'Limit Check',
        exceeded
          ? `⚠️ Exceeded ${limitMinutes} minute limit!`
          : `✅ Within ${limitMinutes} minute limit`
      );
    } catch (err) {
      setError(`Error checking limit: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Limit check error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Screen Time Tracker Test</Text>

      {/* Permission Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Permission Status</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={checkPermission}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Checking...' : 'Check Permission'}
            </Text>
          </TouchableOpacity>

          {permissionStatus === 'denied' && (
            <TouchableOpacity
              style={[styles.button, styles.warningButton]}
              onPress={requestPermission}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Request Permission</Text>
            </TouchableOpacity>
          )}
        </View>

        {permissionStatus !== 'unknown' && (
          <View style={styles.statusBox}>
            <Text style={[
              styles.statusText,
              { color: permissionStatus === 'granted' ? COLORS.success : COLORS.error }
            ]}>
              {permissionStatus === 'granted' ? '✅ Granted' : '❌ Denied'}
            </Text>
          </View>
        )}
      </View>

      {/* Usage Tracking */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Usage Tracking</Text>
        <Text style={styles.subtitle}>
          Tracking apps: {testPackages.join(', ')}
        </Text>

        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={getUsage}
            disabled={loading || permissionStatus !== 'granted'}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Loading...' : 'Get Usage (24h)'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.infoButton]}
            onPress={checkLimit}
            disabled={loading || permissionStatus !== 'granted'}
          >
            <Text style={styles.buttonText}>Check 30m Limit</Text>
          </TouchableOpacity>
        </View>

        {totalUsage > 0 && (
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total Usage (24h):</Text>
            <Text style={styles.totalValue}>{formatTime(totalUsage)}</Text>
          </View>
        )}

        {/* Per-App Usage */}
        {Object.entries(usageData).length > 0 && (
          <View style={styles.usageList}>
            <Text style={styles.usageListTitle}>Per-App Usage:</Text>
            {Object.entries(usageData).map(([packageName, seconds]) => (
              <View key={packageName} style={styles.usageItem}>
                <Text style={styles.packageName}>{packageName}</Text>
                <Text style={styles.packageTime}>{formatTime(seconds)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Error:</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        <Text style={styles.instructionText}>
          1. Tap "Check Permission" to see if permission is granted{'\n'}
          2. If denied, tap "Request Permission" and enable "Usage access"{'\n'}
          3. Return to this screen and tap "Check Permission" again{'\n'}
          4. Tap "Get Usage" to see screen time data
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  section: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  button: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  warningButton: {
    backgroundColor: COLORS.warning,
  },
  infoButton: {
    backgroundColor: COLORS.info,
  },
  statusBox: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalBox: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  usageList: {
    marginTop: SPACING.sm,
  },
  usageListTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  usageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 6,
    marginBottom: SPACING.xs,
  },
  packageName: {
    fontSize: 12,
    color: COLORS.text,
    flex: 1,
  },
  packageTime: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: COLORS.error,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.text,
  },
  instructionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

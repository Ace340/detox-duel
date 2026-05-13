import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'has_completed_onboarding';

interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function getItem<T>(key: string): Promise<StorageResult<T>> {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) {
      return { success: false, error: 'Item not found' };
    }
    return { success: true, data: JSON.parse(value) as T };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function setItem<T>(key: string, value: T): Promise<StorageResult<T>> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return { success: true, data: value };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function checkOnboardingStatus(): Promise<boolean> {
  const result = await getItem<boolean>(ONBOARDING_KEY);
  return result.success && result.data === true;
}

export async function completeOnboarding(): Promise<boolean> {
  const result = await setItem(ONBOARDING_KEY, true);
  if (!result.success) {
    console.error('Failed to complete onboarding:', result.error);
  }
  return result.success;
}

export async function resetOnboarding(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    return true;
  } catch (error) {
    console.error('Failed to reset onboarding:', error);
    return false;
  }
}

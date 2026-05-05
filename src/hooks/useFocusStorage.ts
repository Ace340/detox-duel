import AsyncStorage from '@react-native-async-storage/async-storage';
import { FocusSession } from '../types';

const STORAGE_KEYS = {
  ACTIVE_SESSION: 'focus_active_session',
  COMPLETED_SESSIONS: 'focus_completed_sessions',
  TODAY_TOTAL: 'focus_today_total',
} as const;

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

export async function saveActiveSession(session: FocusSession): Promise<boolean> {
  const result = await setItem(STORAGE_KEYS.ACTIVE_SESSION, session);
  if (!result.success) {
    console.error('Failed to save active session:', result.error);
  }
  return result.success;
}

export async function loadActiveSession(): Promise<FocusSession | null> {
  const result = await getItem<FocusSession>(STORAGE_KEYS.ACTIVE_SESSION);
  return result.success && result.data ? result.data : null;
}

export async function clearActiveSession(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    return true;
  } catch (error) {
    console.error('Failed to clear active session:', error);
    return false;
  }
}

export async function saveCompletedSession(session: FocusSession): Promise<boolean> {
  const result = await getItem<FocusSession[]>(STORAGE_KEYS.COMPLETED_SESSIONS);
  const sessions: FocusSession[] = result.success && result.data ? result.data : [];

  const updatedSessions = [...sessions, session];
  const saveResult = await setItem(STORAGE_KEYS.COMPLETED_SESSIONS, updatedSessions);

  if (!saveResult.success) {
    console.error('Failed to save completed session:', saveResult.error);
  }

  return saveResult.success;
}

export async function loadCompletedSessions(): Promise<FocusSession[]> {
  const result = await getItem<FocusSession[]>(STORAGE_KEYS.COMPLETED_SESSIONS);
  return result.success && result.data ? result.data : [];
}

export async function updateTodayTotal(minutes: number): Promise<boolean> {
  const result = await getItem<number>(STORAGE_KEYS.TODAY_TOTAL);
  const currentTotal = result.success && result.data !== undefined ? result.data : 0;
  const newTotal = currentTotal + minutes;

  const saveResult = await setItem(STORAGE_KEYS.TODAY_TOTAL, newTotal);

  if (!saveResult.success) {
    console.error('Failed to update today total:', saveResult.error);
  }

  return saveResult.success;
}

export async function loadTodayTotal(): Promise<number> {
  const result = await getItem<number>(STORAGE_KEYS.TODAY_TOTAL);
  return result.success && result.data !== undefined ? result.data : 0;
}

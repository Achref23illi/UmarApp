/**
 * Storage Service
 * =================
 * AsyncStorage wrapper with type safety
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const StorageKeys = {
  // Auth
  AUTH_TOKEN: '@auth_token',
  REFRESH_TOKEN: '@refresh_token',
  USER: '@user',

  // Settings
  LANGUAGE: '@language',
  THEME: '@theme',
  ONBOARDING_COMPLETED: '@onboarding_completed',
  NOTIFICATIONS_ENABLED: '@notifications_enabled',

  // Cache
  CACHED_DATA: '@cached_data',
} as const;

type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

/**
 * Storage utility functions
 */
export const storage = {
  /**
   * Get item from storage
   */
  get: async <T>(key: StorageKey): Promise<T | null> => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error getting ${key} from storage:`, error);
      return null;
    }
  },

  /**
   * Set item in storage
   */
  set: async <T>(key: StorageKey, value: T): Promise<boolean> => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting ${key} in storage:`, error);
      return false;
    }
  },

  /**
   * Remove item from storage
   */
  remove: async (key: StorageKey): Promise<boolean> => {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error);
      return false;
    }
  },

  /**
   * Clear multiple keys
   */
  multiRemove: async (keys: StorageKey[]): Promise<boolean> => {
    try {
      await AsyncStorage.multiRemove(keys);
      return true;
    } catch (error) {
      console.error('Error removing multiple keys from storage:', error);
      return false;
    }
  },

  /**
   * Clear all storage (use with caution)
   */
  clear: async (): Promise<boolean> => {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  },

  /**
   * Get all keys
   */
  getAllKeys: async (): Promise<string[]> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return [...keys];
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  },
};

// ============ Auth Storage Helpers ============
export const authStorage = {
  getToken: () => storage.get<string>(StorageKeys.AUTH_TOKEN),
  setToken: (token: string) => storage.set(StorageKeys.AUTH_TOKEN, token),
  removeToken: () => storage.remove(StorageKeys.AUTH_TOKEN),

  getRefreshToken: () => storage.get<string>(StorageKeys.REFRESH_TOKEN),
  setRefreshToken: (token: string) => storage.set(StorageKeys.REFRESH_TOKEN, token),
  removeRefreshToken: () => storage.remove(StorageKeys.REFRESH_TOKEN),

  getUser: <T>() => storage.get<T>(StorageKeys.USER),
  setUser: <T>(user: T) => storage.set(StorageKeys.USER, user),
  removeUser: () => storage.remove(StorageKeys.USER),

  clearAll: () =>
    storage.multiRemove([StorageKeys.AUTH_TOKEN, StorageKeys.REFRESH_TOKEN, StorageKeys.USER]),
};

// ============ Settings Storage Helpers ============
export const settingsStorage = {
  getLanguage: () => storage.get<string>(StorageKeys.LANGUAGE),
  setLanguage: (lang: string) => storage.set(StorageKeys.LANGUAGE, lang),

  getTheme: () => storage.get<'light' | 'dark' | 'system'>(StorageKeys.THEME),
  setTheme: (theme: 'light' | 'dark' | 'system') => storage.set(StorageKeys.THEME, theme),

  getOnboardingCompleted: () => storage.get<boolean>(StorageKeys.ONBOARDING_COMPLETED),
  setOnboardingCompleted: (completed: boolean) =>
    storage.set(StorageKeys.ONBOARDING_COMPLETED, completed),

  getNotificationsEnabled: () => storage.get<boolean>(StorageKeys.NOTIFICATIONS_ENABLED),
  setNotificationsEnabled: (enabled: boolean) =>
    storage.set(StorageKeys.NOTIFICATIONS_ENABLED, enabled),
};

/**
 * Quran.Foundation API Configuration
 * ==================================
 * Configuration for the Quran.Foundation API (v4).
 * Supports both Pre-Production and Production environments.
 */

// Environment toggle: Set to 'production' for live app, 'pre-production' for testing
export const CURRENT_ENV: 'pre-production' | 'production' =
  process.env.EXPO_PUBLIC_QURAN_API_ENV === 'pre-production' ? 'pre-production' : 'production';

interface ApiConfig {
  clientId: string;
  clientSecret: string;
  authUrl: string;
  apiBaseUrl: string;
}

const ENV_CONFIG: Record<'pre-production' | 'production', ApiConfig> = {
  'pre-production': {
    clientId:
      process.env.EXPO_PUBLIC_QURAN_API_CLIENT_ID_PRELIVE || '2d5015f0-55f7-422b-a07b-e07ec73b1a93',
    clientSecret:
      process.env.EXPO_PUBLIC_QURAN_API_CLIENT_SECRET_PRELIVE || 'iS_TycQR8HRwe-dPVwWG4Qi.YJ',
    authUrl: 'https://prelive-oauth2.quran.foundation/oauth2/token',
    apiBaseUrl: 'https://apis-prelive.quran.foundation/content/api/v4',
  },
  production: {
    clientId: process.env.EXPO_PUBLIC_QURAN_API_CLIENT_ID || 'bfa2e145-b83b-4b53-b337-49adb7a22d44',
    clientSecret: process.env.EXPO_PUBLIC_QURAN_API_CLIENT_SECRET || 'Q4NWw783vcNCrt8dkHCuAgwx5g',
    authUrl: 'https://oauth2.quran.foundation/oauth2/token',
    apiBaseUrl: 'https://apis.quran.foundation/content/api/v4',
  },
};

export const QURAN_API_CONFIG = ENV_CONFIG[CURRENT_ENV];
export const QURAN_FRENCH_TRANSLATION_RESOURCE_ID = Number(
  process.env.EXPO_PUBLIC_QURAN_FRENCH_TRANSLATION_RESOURCE_ID || '136'
);

/**
 * App Theme Configuration
 * ========================
 * Central export for all design system tokens
 */

export * from './assets';
export * from './colors';
export * from './spacing';
export * from './typography';

// App-wide constants
export const AppConfig = {
  name: 'UmarApp',
  version: '1.0.0',

  // Supported languages
  languages: ['en', 'fr', 'ar'] as const,
  defaultLanguage: 'en' as const,
  rtlLanguages: ['ar'] as const,

  // Layout
  statusBarStyle: 'dark-content' as const,
  backgroundColor: '#F5F5F5',
} as const;

/**
 * API Configuration
 * ===================
 * Environment-based API settings
 */

// Environment variables (will be set in .env files)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
const API_TIMEOUT = Number(process.env.EXPO_PUBLIC_API_TIMEOUT) || 30000;

export const ApiConfig = {
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,

  // API Endpoints - Update these when backend is ready
  endpoints: {
    // Auth
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      logout: '/auth/logout',
      refreshToken: '/auth/refresh',
      forgotPassword: '/auth/forgot-password',
      resetPassword: '/auth/reset-password',
      verifyEmail: '/auth/verify-email',
      me: '/auth/me',
    },
    // Users
    users: {
      list: '/users',
      get: (id: string) => `/users/${id}`,
      update: (id: string) => `/users/${id}`,
      delete: (id: string) => `/users/${id}`,
      profile: '/users/profile',
    },
    // Example resources - customize for your app
    posts: {
      list: '/posts',
      get: (id: string) => `/posts/${id}`,
      create: '/posts',
      update: (id: string) => `/posts/${id}`,
      delete: (id: string) => `/posts/${id}`,
    },
  },

  // Request headers
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
} as const;

// Query keys for React Query
export const QueryKeys = {
  // Auth
  user: ['user'] as const,
  session: ['session'] as const,

  // Users
  users: ['users'] as const,
  userById: (id: string) => ['users', id] as const,
  userProfile: ['users', 'profile'] as const,

  // Posts (example)
  posts: ['posts'] as const,
  postById: (id: string) => ['posts', id] as const,
  postsByUser: (userId: string) => ['posts', 'user', userId] as const,
} as const;

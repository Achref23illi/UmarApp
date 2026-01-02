/**
 * Axios API Client
 * ==================
 * Configured Axios instance with interceptors
 */

import { store } from '@/store';
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ApiConfig } from './config';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: ApiConfig.baseURL,
  timeout: ApiConfig.timeout,
  headers: ApiConfig.headers,
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from Redux store
    const state = store.getState();
    const token = state.user.token;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    if (__DEV__) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and refresh token
apiClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (__DEV__) {
      console.log(`✅ API Response: ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Log error in development
    if (__DEV__) {
      console.log(`❌ API Error: ${originalRequest?.url} - ${error.response?.status}`);
    }

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // TODO: Implement token refresh logic
      // try {
      //   const newToken = await refreshToken();
      //   originalRequest.headers.Authorization = `Bearer ${newToken}`;
      //   return apiClient(originalRequest);
      // } catch {
      //   // Redirect to login
      //   store.dispatch(logout());
      // }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// Type-safe request methods
export const api = {
  get: <T>(url: string, config?: object) => apiClient.get<T>(url, config).then((res) => res.data),

  post: <T>(url: string, data?: object, config?: object) =>
    apiClient.post<T>(url, data, config).then((res) => res.data),

  put: <T>(url: string, data?: object, config?: object) =>
    apiClient.put<T>(url, data, config).then((res) => res.data),

  patch: <T>(url: string, data?: object, config?: object) =>
    apiClient.patch<T>(url, data, config).then((res) => res.data),

  delete: <T>(url: string, config?: object) =>
    apiClient.delete<T>(url, config).then((res) => res.data),
};

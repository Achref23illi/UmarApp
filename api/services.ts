/**
 * API Services
 * ==============
 * Service functions for API calls
 */

import { api } from './client';
import { ApiConfig, QueryKeys } from './config';
import type {
  AuthResponse,
  CreatePostRequest,
  LoginRequest,
  PaginatedResponse,
  PaginationParams,
  Post,
  RegisterRequest,
  UpdatePostRequest,
  UpdateUserRequest,
  User,
} from './types';

// ============ Auth Services ============
export const authService = {
  login: (data: LoginRequest) => api.post<AuthResponse>(ApiConfig.endpoints.auth.login, data),

  register: (data: RegisterRequest) =>
    api.post<AuthResponse>(ApiConfig.endpoints.auth.register, data),

  logout: () => api.post<void>(ApiConfig.endpoints.auth.logout),

  getMe: () => api.get<User>(ApiConfig.endpoints.auth.me),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>(ApiConfig.endpoints.auth.forgotPassword, { email }),

  resetPassword: (token: string, password: string) =>
    api.post<{ message: string }>(ApiConfig.endpoints.auth.resetPassword, { token, password }),
};

// ============ User Services ============
export const userService = {
  getProfile: () => api.get<User>(ApiConfig.endpoints.users.profile),

  updateProfile: (data: UpdateUserRequest) =>
    api.put<User>(ApiConfig.endpoints.users.profile, data),

  getById: (id: string) => api.get<User>(ApiConfig.endpoints.users.get(id)),

  getAll: (params?: PaginationParams) =>
    api.get<PaginatedResponse<User>>(ApiConfig.endpoints.users.list, { params }),
};

// ============ Posts Services (Example) ============
export const postService = {
  getAll: (params?: PaginationParams) =>
    api.get<PaginatedResponse<Post>>(ApiConfig.endpoints.posts.list, { params }),

  getById: (id: string) => api.get<Post>(ApiConfig.endpoints.posts.get(id)),

  create: (data: CreatePostRequest) => api.post<Post>(ApiConfig.endpoints.posts.create, data),

  update: (id: string, data: UpdatePostRequest) =>
    api.put<Post>(ApiConfig.endpoints.posts.update(id), data),

  delete: (id: string) => api.delete<void>(ApiConfig.endpoints.posts.delete(id)),
};

// Export query keys for use with React Query
export { QueryKeys };

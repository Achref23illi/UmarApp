/**
 * API Module Export
 * ===================
 * Central export for all API-related utilities
 */

// Client
export { api, default as apiClient } from './client';

// Configuration
export { ApiConfig, QueryKeys } from './config';

// Services
export { authService, postService, userService } from './services';

// Hooks
export {
  useCreatePost,
  // Auth
  useCurrentUser,
  useDeletePost,
  useLogin,
  useLogout,
  usePost,
  // Posts
  usePosts,
  useRegister,
  useUpdatePost,
  useUpdateProfile,
  useUser,
  // Users
  useUserProfile,
} from './hooks';

// Types
export type {
  ApiError,
  ApiResponse,
  AuthResponse,
  CreatePostRequest,
  LoginRequest,
  PaginatedResponse,
  PaginationParams,
  Post,
  RegisterRequest,
  SearchParams,
  UpdatePostRequest,
  UpdateUserRequest,
  User,
} from './types';

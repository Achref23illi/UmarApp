/**
 * React Query Hooks
 * ===================
 * Custom hooks for data fetching with React Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from './config';
import { authService, postService, userService } from './services';
import type {
  CreatePostRequest,
  LoginRequest,
  PaginationParams,
  RegisterRequest,
  UpdatePostRequest,
  UpdateUserRequest,
} from './types';

// ============ Auth Hooks ============
export function useCurrentUser() {
  return useQuery({
    queryKey: QueryKeys.user,
    queryFn: authService.getMe,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: (data) => {
      // Update user cache
      queryClient.setQueryData(QueryKeys.user, data.user);
      // TODO: Store token in secure storage
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: (data) => {
      queryClient.setQueryData(QueryKeys.user, data.user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
    },
  });
}

// ============ User Hooks ============
export function useUserProfile() {
  return useQuery({
    queryKey: QueryKeys.userProfile,
    queryFn: userService.getProfile,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserRequest) => userService.updateProfile(data),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(QueryKeys.userProfile, updatedUser);
      queryClient.setQueryData(QueryKeys.user, updatedUser);
    },
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: QueryKeys.userById(id),
    queryFn: () => userService.getById(id),
    enabled: !!id,
  });
}

// ============ Posts Hooks (Example) ============
export function usePosts(params?: PaginationParams) {
  return useQuery({
    queryKey: [...QueryKeys.posts, params],
    queryFn: () => postService.getAll(params),
  });
}

export function usePost(id: string) {
  return useQuery({
    queryKey: QueryKeys.postById(id),
    queryFn: () => postService.getById(id),
    enabled: !!id,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePostRequest) => postService.create(data),
    onSuccess: () => {
      // Invalidate posts list to refetch
      queryClient.invalidateQueries({ queryKey: QueryKeys.posts });
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePostRequest }) =>
      postService.update(id, data),
    onSuccess: (updatedPost) => {
      queryClient.setQueryData(QueryKeys.postById(updatedPost.id), updatedPost);
      queryClient.invalidateQueries({ queryKey: QueryKeys.posts });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => postService.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: QueryKeys.postById(id) });
      queryClient.invalidateQueries({ queryKey: QueryKeys.posts });
    },
  });
}

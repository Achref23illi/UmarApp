import { supabase } from '@/lib/supabase';
import {
    AdminAnalyticsOverview,
    AdminChallengeArticle,
    AdminChallengeCategory,
    AdminChallengeLevel,
    AdminComment,
    AdminContentHealth,
    AdminEngagementBreakdown,
    AdminListResponse,
    AdminPost,
    AdminPostDetail,
    AdminQuiz,
    AdminQuizAnalytics,
    AdminQuizCategory,
    AdminQuizQuestion,
    AdminTimeseries,
} from '@/types/admin';

const RAW_API_URL = process.env.EXPO_PUBLIC_API_URL;

function getAdminBaseUrl() {
  if (!RAW_API_URL) {
    throw new Error('EXPO_PUBLIC_API_URL is not configured');
  }

  const base = RAW_API_URL.replace(/\/$/, '');
  if (base.endsWith('/api')) {
    return `${base}/admin`;
  }

  return `${base}/api/admin`;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  // First try current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    // Verify the token is still valid; if not, force a refresh
    const { error } = await supabase.auth.getUser(session.access_token);
    if (!error) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  }

  // Token was missing or expired — refresh it
  const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError || !refreshData.session?.access_token) {
    throw new Error('Not authenticated');
  }

  return {
    Authorization: `Bearer ${refreshData.session.access_token}`,
  };
}

async function adminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getAdminBaseUrl();
  const authHeaders = await getAuthHeaders();

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
      ...authHeaders,
    },
  });

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || `Request failed: ${response.status}`);
  }

  return payload as T;
}

function qs(params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, String(value));
  });
  const value = search.toString();
  return value ? `?${value}` : '';
}

export const adminService = {
  analytics: {
    getOverview: (from?: string, to?: string) =>
      adminRequest<AdminAnalyticsOverview>(`/analytics/overview${qs({ from, to })}`),
    getTimeseries: (metric: string, from?: string, to?: string) =>
      adminRequest<AdminTimeseries>(
        `/analytics/timeseries${qs({ metric, from, to, interval: 'day' })}`
      ),
    getContentHealth: (from?: string, to?: string) =>
      adminRequest<AdminContentHealth>(`/analytics/content-health${qs({ from, to })}`),
    getEngagementBreakdown: (from?: string, to?: string) =>
      adminRequest<AdminEngagementBreakdown>(`/analytics/engagement-breakdown${qs({ from, to })}`),
  },

  posts: {
    list: (params?: {
      status?: string;
      type?: string;
      q?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortDirection?: 'asc' | 'desc';
    }) => adminRequest<AdminListResponse<AdminPost>>(`/posts${qs(params || {})}`),
    get: (id: string) => adminRequest<{ item: AdminPostDetail }>(`/posts/${id}`),
    moderate: (id: string, status: 'pending' | 'approved' | 'rejected', note?: string) =>
      adminRequest<{ item: AdminPost }>(`/posts/${id}/moderation`, {
        method: 'PATCH',
        body: JSON.stringify({ status, note }),
      }),
    update: (id: string, payload: Partial<AdminPost>) =>
      adminRequest<{ item: AdminPost }>(`/posts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    remove: (id: string) =>
      adminRequest<{ success: boolean }>(`/posts/${id}`, {
        method: 'DELETE',
      }),
  },

  comments: {
    list: (params?: {
      status?: string;
      postId?: string;
      q?: string;
      page?: number;
      limit?: number;
    }) => adminRequest<AdminListResponse<AdminComment>>(`/comments${qs(params || {})}`),
    approve: (id: string) =>
      adminRequest<{ item: AdminComment }>(`/comments/${id}/approve`, {
        method: 'PATCH',
      }),
    remove: (id: string) =>
      adminRequest<{ success: boolean }>(`/comments/${id}`, {
        method: 'DELETE',
      }),
  },

  challenges: {
    listCategories: (params?: { q?: string; page?: number; limit?: number }) =>
      adminRequest<AdminListResponse<AdminChallengeCategory>>(
        `/challenges/categories${qs(params || {})}`
      ),
    createCategory: (payload: Partial<AdminChallengeCategory>) =>
      adminRequest<{ item: AdminChallengeCategory }>(`/challenges/categories`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    updateCategory: (id: string, payload: Partial<AdminChallengeCategory>) =>
      adminRequest<{ item: AdminChallengeCategory }>(`/challenges/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    deleteCategory: (id: string) =>
      adminRequest<{ success: boolean }>(`/challenges/categories/${id}`, {
        method: 'DELETE',
      }),
    reorderCategories: (items: { id: string; sort_order?: number }[]) =>
      adminRequest<{ success: boolean }>(`/challenges/categories/reorder`, {
        method: 'POST',
        body: JSON.stringify({ items }),
      }),

    listLevels: (params?: { categoryId?: string; page?: number; limit?: number }) =>
      adminRequest<AdminListResponse<AdminChallengeLevel>>(`/challenges/levels${qs(params || {})}`),
    createLevel: (payload: Partial<AdminChallengeLevel>) =>
      adminRequest<{ item: AdminChallengeLevel }>(`/challenges/levels`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    updateLevel: (id: string, payload: Partial<AdminChallengeLevel>) =>
      adminRequest<{ item: AdminChallengeLevel }>(`/challenges/levels/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    deleteLevel: (id: string) =>
      adminRequest<{ success: boolean }>(`/challenges/levels/${id}`, {
        method: 'DELETE',
      }),
    reorderLevels: (items: { id: string; level_number?: number }[]) =>
      adminRequest<{ success: boolean }>(`/challenges/levels/reorder`, {
        method: 'POST',
        body: JSON.stringify({ items }),
      }),

    listArticles: (params?: {
      categoryId?: string;
      levelId?: string;
      page?: number;
      limit?: number;
    }) =>
      adminRequest<AdminListResponse<AdminChallengeArticle>>(
        `/challenges/articles${qs(params || {})}`
      ),
    createArticle: (payload: Partial<AdminChallengeArticle>) =>
      adminRequest<{ item: AdminChallengeArticle }>(`/challenges/articles`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    updateArticle: (id: string, payload: Partial<AdminChallengeArticle>) =>
      adminRequest<{ item: AdminChallengeArticle }>(`/challenges/articles/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    deleteArticle: (id: string) =>
      adminRequest<{ success: boolean }>(`/challenges/articles/${id}`, {
        method: 'DELETE',
      }),
  },

  quiz: {
    listCategories: (params?: { q?: string; page?: number; limit?: number }) =>
      adminRequest<AdminListResponse<AdminQuizCategory>>(`/quiz/categories${qs(params || {})}`),
    createCategory: (payload: Partial<AdminQuizCategory>) =>
      adminRequest<{ item: AdminQuizCategory }>(`/quiz/categories`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    updateCategory: (id: string, payload: Partial<AdminQuizCategory>) =>
      adminRequest<{ item: AdminQuizCategory }>(`/quiz/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    deleteCategory: (id: string) =>
      adminRequest<{ success: boolean; softDisabled?: boolean; item?: AdminQuizCategory }>(
        `/quiz/categories/${id}`,
        {
          method: 'DELETE',
        }
      ),

    listQuizzes: (params?: { categoryId?: string; page?: number; limit?: number }) =>
      adminRequest<AdminListResponse<AdminQuiz>>(`/quiz/quizzes${qs(params || {})}`),
    createQuiz: (payload: Partial<AdminQuiz>) =>
      adminRequest<{ item: AdminQuiz }>(`/quiz/quizzes`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    updateQuiz: (id: string, payload: Partial<AdminQuiz>) =>
      adminRequest<{ item: AdminQuiz }>(`/quiz/quizzes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    deleteQuiz: (id: string) =>
      adminRequest<{ success: boolean; softDisabled?: boolean; item?: AdminQuiz }>(
        `/quiz/quizzes/${id}`,
        {
          method: 'DELETE',
        }
      ),

    listQuestions: (params: { quizId: string; page?: number; limit?: number }) =>
      adminRequest<AdminListResponse<AdminQuizQuestion>>(`/quiz/questions${qs(params)}`),
    createQuestion: (payload: Partial<AdminQuizQuestion> & { quiz_id?: string; quizId?: string }) =>
      adminRequest<{ item: AdminQuizQuestion }>(`/quiz/questions`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    updateQuestion: (id: string, payload: Partial<AdminQuizQuestion>) =>
      adminRequest<{ item: AdminQuizQuestion }>(`/quiz/questions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    deleteQuestion: (id: string) =>
      adminRequest<{ success: boolean; softDisabled?: boolean; item?: AdminQuizQuestion }>(
        `/quiz/questions/${id}`,
        {
          method: 'DELETE',
        }
      ),
    importQuestions: (quizId: string, questions: Partial<AdminQuizQuestion>[]) =>
      adminRequest<{ importedCount: number; items: AdminQuizQuestion[] }>(
        `/quiz/questions/import`,
        {
          method: 'POST',
          body: JSON.stringify({ quizId, questions }),
        }
      ),

    getAnalytics: (from?: string, to?: string) =>
      adminRequest<AdminQuizAnalytics>(`/quiz/analytics${qs({ from, to })}`),
  },
};

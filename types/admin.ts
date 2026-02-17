export interface AdminDateRange {
  from: string;
  to: string;
}

export interface AdminPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface AdminListResponse<T> {
  items: T[];
  pagination: AdminPagination;
}

export interface AdminAnalyticsOverviewMetrics {
  totalUsers: number;
  totalPosts: number;
  totalMosques: number;
  totalComments: number;
  totalLikes: number;
  recentPosts: number;
  newUsers: number;
  dau: number;
  wau: number;
  postsCreated: number;
  pendingPosts: number;
  pendingComments: number;
  challengeStarts: number;
  challengeCompletions: number;
  quizAttempts: number;
  quizCompletions: number;
  averageQuizScore: number;
}

export interface AdminAnalyticsOverview {
  range: AdminDateRange;
  metrics: AdminAnalyticsOverviewMetrics;
}

export interface AdminTimeseriesPoint {
  date: string;
  value: number;
}

export interface AdminTimeseries {
  metric: string;
  interval: 'day';
  range: AdminDateRange;
  points: AdminTimeseriesPoint[];
}

export interface AdminContentHealth {
  range: AdminDateRange;
  posts: {
    approved: number;
    pending: number;
    rejected: number;
    total: number;
  };
  comments: {
    approved: number;
    pending: number;
    rejected: number;
    total: number;
  };
}

export interface AdminEngagementBreakdown {
  range: AdminDateRange;
  metrics: {
    likes: number;
    comments: number;
    posts: number;
    quizAttempts: number;
    challengeCompletions: number;
    avgCommentsPerPost: number;
  };
  postTypes: Record<string, number>;
}

export interface AdminEntityUser {
  id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
}

export type AdminModerationStatus = 'pending' | 'approved' | 'rejected';

export interface AdminPost {
  id: string;
  user_id: string;
  content: string;
  image_url?: string | null;
  type: string;
  metadata?: Record<string, any>;
  likes_count?: number;
  comments_count?: number;
  created_at: string;
  is_approved?: boolean;
  moderation_status: AdminModerationStatus;
  moderation_note?: string | null;
  moderated_by?: string | null;
  moderated_at?: string | null;
  user: AdminEntityUser;
}

export interface AdminPostDetail extends AdminPost {
  comment_count: number;
  like_count: number;
}

export interface AdminComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  is_approved?: boolean;
  moderation_status: AdminModerationStatus;
  moderation_note?: string | null;
  moderated_by?: string | null;
  moderated_at?: string | null;
  user: AdminEntityUser;
  post: {
    id: string;
    content: string;
    type: string;
  } | null;
}

export interface AdminChallengeCategory {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  duration?: string | null;
  levels?: string | null;
  prerequisite?: string | null;
  icon_name?: string | null;
  image_url?: string | null;
  color?: string | null;
  sort_order?: number;
  is_locked?: boolean;
  is_enabled?: boolean;
  created_at?: string;
}

export interface AdminChallengeLevel {
  id: string;
  category_id: string;
  level_number: number;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  duration_days: number;
  created_at?: string;
}

export interface AdminChallengeArticle {
  id: string;
  category_id: string;
  level_id?: string | null;
  title: string;
  content: string;
  sort_order: number;
  created_at?: string;
}

export interface AdminQuizCategory {
  id: string;
  name: string;
  name_fr?: string | null;
  slug?: string | null;
  icon?: string | null;
  description?: string | null;
  description_fr?: string | null;
  color?: string | null;
  sort_order?: number;
  min_question_count?: number;
  is_enabled?: boolean;
  created_at?: string;
}

export interface AdminQuiz {
  id: string;
  category_id: string;
  title: string;
  title_fr?: string | null;
  difficulty?: string | null;
  is_enabled?: boolean;
  created_at?: string;
}

export interface AdminQuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  question_fr?: string | null;
  options: string[];
  options_fr?: string[] | null;
  correct_answer: string;
  correct_answer_fr?: string | null;
  explanation?: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface AdminQuizAnalytics {
  range: AdminDateRange;
  metrics: {
    totalAttempts: number;
    avgScore: number;
    totalQuestions: number;
    activeQuestions: number;
  };
  modeBreakdown: Record<string, number>;
  categoryBreakdown: {
    category_id: string;
    category_name: string;
    category_slug: string | null;
    attempts: number;
  }[];
}

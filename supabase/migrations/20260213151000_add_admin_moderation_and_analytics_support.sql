-- Admin platform schema support: moderation fields, category/quiz enable flags, and analytics indexes.

-- Posts moderation fields
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS moderation_status TEXT,
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS moderation_note TEXT;

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_moderation_status_check;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_moderation_status_check
  CHECK (moderation_status IN ('pending', 'approved', 'rejected'));

UPDATE public.posts
SET moderation_status = CASE
  WHEN is_approved = false THEN 'pending'
  ELSE 'approved'
END
WHERE moderation_status IS NULL;

ALTER TABLE public.posts
  ALTER COLUMN moderation_status SET DEFAULT 'approved';

-- Comments moderation fields
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS moderation_status TEXT,
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS moderation_note TEXT;

ALTER TABLE public.comments
  DROP CONSTRAINT IF EXISTS comments_moderation_status_check;

ALTER TABLE public.comments
  ADD CONSTRAINT comments_moderation_status_check
  CHECK (moderation_status IN ('pending', 'approved', 'rejected'));

UPDATE public.comments
SET is_approved = true
WHERE is_approved IS NULL;

UPDATE public.comments
SET moderation_status = CASE
  WHEN is_approved = false THEN 'pending'
  ELSE 'approved'
END
WHERE moderation_status IS NULL;

ALTER TABLE public.comments
  ALTER COLUMN moderation_status SET DEFAULT 'approved';

-- Challenge categories dynamic enable flag
ALTER TABLE public.challenge_categories
  ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT true;

UPDATE public.challenge_categories
SET is_enabled = CASE
  WHEN slug IN ('quran', 'salat_obligatoire', 'sadaqa') THEN true
  ELSE false
END
WHERE is_enabled IS NULL;

ALTER TABLE public.challenge_categories
  ALTER COLUMN is_enabled SET DEFAULT true;

-- Quiz enable flag for soft-disable behavior
ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT true;

UPDATE public.quizzes
SET is_enabled = true
WHERE is_enabled IS NULL;

ALTER TABLE public.quizzes
  ALTER COLUMN is_enabled SET DEFAULT true;

-- Analytics-friendly indexes
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_moderation_status ON public.posts (moderation_status);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_moderation_status ON public.comments (moderation_status);
CREATE INDEX IF NOT EXISTS idx_comments_is_approved ON public.comments (is_approved);
CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_completed_at ON public.user_quiz_attempts (completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_challenge_daily_completions_completed_date
  ON public.user_challenge_daily_completions (completed_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_challenge_level_progress_started_at
  ON public.user_challenge_level_progress (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_challenge_level_progress_completed_at
  ON public.user_challenge_level_progress (completed_at DESC);

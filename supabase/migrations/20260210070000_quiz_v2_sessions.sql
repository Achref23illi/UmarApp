-- Quiz v2 backend-driven sessions, realtime, and offline sync support.

-- =============================
-- Schema extensions
-- =============================

ALTER TABLE public.quiz_categories
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS min_question_count INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

UPDATE public.quiz_categories
SET slug = CASE
  WHEN lower(name) = 'quran' THEN 'quran'
  WHEN lower(name) = 'prophets' THEN 'prophets'
  WHEN lower(name) = 'sahaba' THEN 'sahaba'
  WHEN lower(name) = 'fiqh' THEN 'fiqh'
  WHEN lower(name) = 'seerah' THEN 'seerah'
  ELSE regexp_replace(lower(name), '[^a-z0-9]+', '_', 'g')
END
WHERE slug IS NULL OR slug = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_categories_slug_unique ON public.quiz_categories(slug);

ALTER TABLE public.quiz_categories
  ALTER COLUMN slug SET NOT NULL;

ALTER TABLE public.quiz_questions
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS explanation TEXT;

-- =============================
-- Core session tables
-- =============================

CREATE TABLE IF NOT EXISTS public.quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode TEXT NOT NULL CHECK (mode IN ('solo', 'duo', 'group', 'hotseat')),
  state TEXT NOT NULL DEFAULT 'lobby' CHECK (state IN ('lobby', 'in_progress', 'finished', 'cancelled')),
  host_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_code TEXT,
  category_id UUID REFERENCES public.quiz_categories(id) ON DELETE SET NULL,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL,
  question_ids UUID[] NOT NULL DEFAULT '{}',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  current_question_index INTEGER NOT NULL DEFAULT 0,
  question_started_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_sessions_access_code_unique
  ON public.quiz_sessions (access_code)
  WHERE access_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_state_updated
  ON public.quiz_sessions (state, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.quiz_session_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  seat_order INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'joined' CHECK (status IN ('joined', 'left', 'ready')),
  score INTEGER NOT NULL DEFAULT 0,
  jokers_left INTEGER NOT NULL DEFAULT 1,
  helps_left INTEGER NOT NULL DEFAULT 1,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_quiz_session_players_session_user
  ON public.quiz_session_players (session_id, user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_session_players_session_user_unique
  ON public.quiz_session_players(session_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_session_players_session_seat_unique
  ON public.quiz_session_players(session_id, seat_order);

CREATE TABLE IF NOT EXISTS public.quiz_session_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.quiz_session_players(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  response_ms INTEGER,
  answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(session_id, player_id, question_index)
);

CREATE INDEX IF NOT EXISTS idx_quiz_session_answers_session_question
  ON public.quiz_session_answers (session_id, question_index);

CREATE TABLE IF NOT EXISTS public.user_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.quiz_sessions(id) ON DELETE SET NULL,
  local_session_id TEXT,
  mode TEXT NOT NULL CHECK (mode IN ('solo', 'duo', 'group', 'hotseat')),
  category_id UUID REFERENCES public.quiz_categories(id) ON DELETE SET NULL,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  accuracy NUMERIC(5,2) NOT NULL DEFAULT 0,
  duration_sec INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  source TEXT NOT NULL DEFAULT 'online' CHECK (source IN ('online', 'offline_sync')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_quiz_attempts_session_user_unique
  ON public.user_quiz_attempts(session_id, user_id)
  WHERE session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_quiz_attempts_local_user_unique
  ON public.user_quiz_attempts(local_session_id, user_id)
  WHERE local_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_user_completed
  ON public.user_quiz_attempts(user_id, completed_at DESC);

ALTER TABLE public.quiz_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.quiz_session_players REPLICA IDENTITY FULL;
ALTER TABLE public.quiz_session_answers REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_sessions;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_session_players;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_session_answers;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

-- =============================
-- RLS helper functions
-- =============================

CREATE OR REPLACE FUNCTION public.quiz_user_is_session_host(p_session_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1
    FROM public.quiz_sessions s
    WHERE s.id = p_session_id
      AND s.host_user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.quiz_user_is_session_member(p_session_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1
    FROM public.quiz_sessions s
    LEFT JOIN public.quiz_session_players p
      ON p.session_id = s.id
     AND p.user_id = p_user_id
    WHERE s.id = p_session_id
      AND (s.host_user_id = p_user_id OR p.id IS NOT NULL)
  );
$$;

GRANT EXECUTE ON FUNCTION public.quiz_user_is_session_host(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.quiz_user_is_session_member(UUID, UUID) TO authenticated;

-- =============================
-- RLS policies
-- =============================

ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_session_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_session_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Quiz sessions readable by participants" ON public.quiz_sessions;
CREATE POLICY "Quiz sessions readable by participants"
  ON public.quiz_sessions
  FOR SELECT
  USING (public.quiz_user_is_session_member(id, auth.uid()));

DROP POLICY IF EXISTS "Quiz sessions insert by host" ON public.quiz_sessions;
CREATE POLICY "Quiz sessions insert by host"
  ON public.quiz_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = host_user_id);

DROP POLICY IF EXISTS "Quiz sessions update by host" ON public.quiz_sessions;
CREATE POLICY "Quiz sessions update by host"
  ON public.quiz_sessions
  FOR UPDATE
  USING (public.quiz_user_is_session_host(id, auth.uid()))
  WITH CHECK (public.quiz_user_is_session_host(id, auth.uid()));

DROP POLICY IF EXISTS "Quiz session players readable by participants" ON public.quiz_session_players;
CREATE POLICY "Quiz session players readable by participants"
  ON public.quiz_session_players
  FOR SELECT
  USING (public.quiz_user_is_session_member(session_id, auth.uid()));

DROP POLICY IF EXISTS "Quiz session players insert by host or self" ON public.quiz_session_players;
CREATE POLICY "Quiz session players insert by host or self"
  ON public.quiz_session_players
  FOR INSERT
  WITH CHECK (
    public.quiz_user_is_session_host(session_id, auth.uid())
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Quiz session players update by host or self" ON public.quiz_session_players;
CREATE POLICY "Quiz session players update by host or self"
  ON public.quiz_session_players
  FOR UPDATE
  USING (
    public.quiz_user_is_session_host(session_id, auth.uid())
    OR user_id = auth.uid()
  )
  WITH CHECK (
    public.quiz_user_is_session_host(session_id, auth.uid())
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Quiz session answers readable by participants" ON public.quiz_session_answers;
CREATE POLICY "Quiz session answers readable by participants"
  ON public.quiz_session_answers
  FOR SELECT
  USING (public.quiz_user_is_session_member(session_id, auth.uid()));

DROP POLICY IF EXISTS "Quiz session answers insert by owner" ON public.quiz_session_answers;
CREATE POLICY "Quiz session answers insert by owner"
  ON public.quiz_session_answers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.quiz_session_players p
      WHERE p.id = player_id
        AND p.session_id = session_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view own quiz attempts" ON public.user_quiz_attempts;
CREATE POLICY "Users can view own quiz attempts"
  ON public.user_quiz_attempts
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own quiz attempts" ON public.user_quiz_attempts;
CREATE POLICY "Users can insert own quiz attempts"
  ON public.user_quiz_attempts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own quiz attempts" ON public.user_quiz_attempts;
CREATE POLICY "Users can update own quiz attempts"
  ON public.user_quiz_attempts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================
-- Internal attempt upsert
-- =============================

CREATE OR REPLACE FUNCTION public.quiz_upsert_attempts(p_session_id UUID, p_source TEXT DEFAULT 'online')
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.quiz_sessions%ROWTYPE;
  v_total_questions INTEGER;
  v_duration_sec INTEGER;
  v_player RECORD;
BEGIN
  SELECT *
  INTO v_session
  FROM public.quiz_sessions
  WHERE id = p_session_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_total_questions := COALESCE(array_length(v_session.question_ids, 1), 0);

  IF v_session.started_at IS NOT NULL THEN
    v_duration_sec := GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (COALESCE(v_session.finished_at, timezone('utc'::text, now())) - v_session.started_at)))::INTEGER);
  ELSE
    v_duration_sec := NULL;
  END IF;

  FOR v_player IN
    SELECT p.*
    FROM public.quiz_session_players p
    WHERE p.session_id = p_session_id
      AND p.user_id IS NOT NULL
  LOOP
    INSERT INTO public.user_quiz_attempts (
      user_id,
      session_id,
      mode,
      category_id,
      score,
      total_questions,
      accuracy,
      duration_sec,
      completed_at,
      source
    ) VALUES (
      v_player.user_id,
      v_session.id,
      v_session.mode,
      v_session.category_id,
      v_player.score,
      v_total_questions,
      CASE
        WHEN v_total_questions > 0 THEN ROUND((v_player.score::NUMERIC * 100.0) / v_total_questions, 2)
        ELSE 0
      END,
      v_duration_sec,
      COALESCE(v_session.finished_at, timezone('utc'::text, now())),
      p_source
    )
    ON CONFLICT (session_id, user_id) WHERE session_id IS NOT NULL
    DO UPDATE SET
      score = EXCLUDED.score,
      total_questions = EXCLUDED.total_questions,
      accuracy = EXCLUDED.accuracy,
      duration_sec = EXCLUDED.duration_sec,
      completed_at = EXCLUDED.completed_at,
      source = EXCLUDED.source;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.quiz_upsert_attempts(UUID, TEXT) TO authenticated;

-- =============================
-- Utility
-- =============================

CREATE OR REPLACE FUNCTION public.quiz_generate_access_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT := '';
  v_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_i INTEGER;
BEGIN
  FOR v_i IN 1..6 LOOP
    v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN v_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.quiz_generate_access_code() TO authenticated;

-- =============================
-- RPC: create session
-- =============================

CREATE OR REPLACE FUNCTION public.quiz_create_session(
  p_mode TEXT,
  p_category_slug TEXT,
  p_settings JSONB DEFAULT '{}'::jsonb,
  p_host_display_name TEXT DEFAULT NULL
)
RETURNS TABLE(session_id UUID, access_code TEXT, player_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_mode TEXT := lower(trim(p_mode));
  v_category public.quiz_categories%ROWTYPE;
  v_settings JSONB := '{}'::jsonb;
  v_question_ids UUID[];
  v_question_count INTEGER;
  v_jokers INTEGER;
  v_helps INTEGER;
  v_response_time INTEGER;
  v_access_code TEXT;
  v_state TEXT;
  v_session_id UUID;
  v_player_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_mode NOT IN ('solo', 'duo', 'group', 'hotseat') THEN
    RAISE EXCEPTION 'Invalid mode %', p_mode;
  END IF;

  SELECT *
  INTO v_category
  FROM public.quiz_categories c
  WHERE c.slug = p_category_slug
    AND c.is_enabled = true
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Category not found or disabled: %', p_category_slug;
  END IF;

  v_question_count := GREATEST(1, COALESCE(NULLIF(p_settings->>'question_count', '')::INTEGER, 10));
  v_jokers := GREATEST(0, COALESCE(NULLIF(p_settings->>'jokers', '')::INTEGER, 1));
  v_helps := GREATEST(0, COALESCE(NULLIF(p_settings->>'helps', '')::INTEGER, 1));
  v_response_time := GREATEST(5, COALESCE(NULLIF(p_settings->>'response_time', '')::INTEGER, 30));

  v_settings := jsonb_build_object(
    'question_count', v_question_count,
    'jokers', v_jokers,
    'helps', v_helps,
    'response_time', v_response_time
  ) || COALESCE(p_settings, '{}'::jsonb);

  SELECT array_agg(src.id)
  INTO v_question_ids
  FROM (
    SELECT qq.id
    FROM public.quiz_questions qq
    JOIN public.quizzes qz ON qz.id = qq.quiz_id
    WHERE qz.category_id = v_category.id
      AND COALESCE(qq.is_active, true) = true
    ORDER BY random()
    LIMIT v_question_count
  ) src;

  IF COALESCE(array_length(v_question_ids, 1), 0) < v_question_count THEN
    RAISE EXCEPTION 'Not enough active questions for category %', p_category_slug;
  END IF;

  IF v_mode IN ('duo', 'group') THEN
    LOOP
      v_access_code := public.quiz_generate_access_code();
      EXIT WHEN NOT EXISTS (
        SELECT 1
        FROM public.quiz_sessions s
        WHERE s.access_code = v_access_code
      );
    END LOOP;
    v_state := 'lobby';
  ELSE
    v_access_code := NULL;
    v_state := 'in_progress';
  END IF;

  INSERT INTO public.quiz_sessions (
    mode,
    state,
    host_user_id,
    access_code,
    category_id,
    question_ids,
    settings,
    current_question_index,
    question_started_at,
    started_at,
    updated_at
  ) VALUES (
    v_mode,
    v_state,
    v_user_id,
    v_access_code,
    v_category.id,
    v_question_ids,
    v_settings,
    0,
    CASE WHEN v_state = 'in_progress' THEN timezone('utc'::text, now()) ELSE NULL END,
    CASE WHEN v_state = 'in_progress' THEN timezone('utc'::text, now()) ELSE NULL END,
    timezone('utc'::text, now())
  )
  RETURNING id INTO v_session_id;

  INSERT INTO public.quiz_session_players (
    session_id,
    user_id,
    display_name,
    seat_order,
    status,
    score,
    jokers_left,
    helps_left,
    updated_at
  ) VALUES (
    v_session_id,
    v_user_id,
    COALESCE(NULLIF(trim(p_host_display_name), ''), 'Host'),
    1,
    'joined',
    0,
    v_jokers,
    v_helps,
    timezone('utc'::text, now())
  )
  RETURNING id INTO v_player_id;

  RETURN QUERY
  SELECT v_session_id, v_access_code, v_player_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.quiz_create_session(TEXT, TEXT, JSONB, TEXT) TO authenticated;

-- =============================
-- RPC: join session by code
-- =============================

CREATE OR REPLACE FUNCTION public.quiz_join_session(
  p_access_code TEXT,
  p_display_name TEXT
)
RETURNS TABLE(session_id UUID, player_id UUID, mode TEXT, state TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_session public.quiz_sessions%ROWTYPE;
  v_existing_player public.quiz_session_players%ROWTYPE;
  v_current_count INTEGER;
  v_max_players INTEGER;
  v_player_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT *
  INTO v_session
  FROM public.quiz_sessions s
  WHERE s.access_code = upper(trim(p_access_code))
    AND s.state IN ('lobby', 'in_progress')
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  IF v_session.mode NOT IN ('duo', 'group') THEN
    RAISE EXCEPTION 'Session is not joinable';
  END IF;

  SELECT *
  INTO v_existing_player
  FROM public.quiz_session_players p
  WHERE p.session_id = v_session.id
    AND p.user_id = v_user_id
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY
    SELECT v_session.id, v_existing_player.id, v_session.mode, v_session.state;
    RETURN;
  END IF;

  SELECT COUNT(*)
  INTO v_current_count
  FROM public.quiz_session_players p
  WHERE p.session_id = v_session.id
    AND p.status <> 'left';

  v_max_players := CASE WHEN v_session.mode = 'duo' THEN 2 ELSE 8 END;

  IF v_current_count >= v_max_players THEN
    RAISE EXCEPTION 'Session is full';
  END IF;

  INSERT INTO public.quiz_session_players (
    session_id,
    user_id,
    display_name,
    seat_order,
    status,
    score,
    jokers_left,
    helps_left,
    updated_at
  ) VALUES (
    v_session.id,
    v_user_id,
    COALESCE(NULLIF(trim(p_display_name), ''), 'Player'),
    v_current_count + 1,
    'joined',
    0,
    GREATEST(0, COALESCE(NULLIF(v_session.settings->>'jokers', '')::INTEGER, 1)),
    GREATEST(0, COALESCE(NULLIF(v_session.settings->>'helps', '')::INTEGER, 1)),
    timezone('utc'::text, now())
  )
  RETURNING id INTO v_player_id;

  UPDATE public.quiz_sessions
  SET updated_at = timezone('utc'::text, now())
  WHERE id = v_session.id;

  RETURN QUERY
  SELECT v_session.id, v_player_id, v_session.mode, v_session.state;
END;
$$;

GRANT EXECUTE ON FUNCTION public.quiz_join_session(TEXT, TEXT) TO authenticated;

-- =============================
-- RPC: start session
-- =============================

CREATE OR REPLACE FUNCTION public.quiz_start_session(p_session_id UUID)
RETURNS TABLE(session_id UUID, state TEXT, current_question_index INTEGER, question_started_at TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_session public.quiz_sessions%ROWTYPE;
  v_player_count INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT *
  INTO v_session
  FROM public.quiz_sessions s
  WHERE s.id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  IF v_session.host_user_id <> v_user_id THEN
    RAISE EXCEPTION 'Only host can start session';
  END IF;

  IF v_session.state = 'in_progress' THEN
    RETURN QUERY
    SELECT v_session.id, v_session.state, v_session.current_question_index, v_session.question_started_at;
    RETURN;
  END IF;

  IF v_session.state <> 'lobby' THEN
    RAISE EXCEPTION 'Session cannot be started from state %', v_session.state;
  END IF;

  SELECT COUNT(*)
  INTO v_player_count
  FROM public.quiz_session_players p
  WHERE p.session_id = v_session.id
    AND p.status <> 'left';

  IF v_session.mode = 'duo' AND v_player_count < 2 THEN
    RAISE EXCEPTION 'Duo requires exactly 2 players';
  END IF;

  IF v_session.mode = 'group' AND v_player_count < 3 THEN
    RAISE EXCEPTION 'Group requires at least 3 players';
  END IF;

  UPDATE public.quiz_sessions
  SET state = 'in_progress',
      started_at = COALESCE(started_at, timezone('utc'::text, now())),
      question_started_at = timezone('utc'::text, now()),
      updated_at = timezone('utc'::text, now())
  WHERE id = v_session.id;

  RETURN QUERY
  SELECT s.id, s.state, s.current_question_index, s.question_started_at
  FROM public.quiz_sessions s
  WHERE s.id = v_session.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.quiz_start_session(UUID) TO authenticated;

-- =============================
-- RPC: submit answer
-- =============================

CREATE OR REPLACE FUNCTION public.quiz_submit_answer(
  p_session_id UUID,
  p_question_index INTEGER,
  p_selected_answer TEXT,
  p_response_ms INTEGER DEFAULT NULL
)
RETURNS TABLE(player_id UUID, is_correct BOOLEAN, score INTEGER, state TEXT, current_question_index INTEGER, already_answered BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_session public.quiz_sessions%ROWTYPE;
  v_player public.quiz_session_players%ROWTYPE;
  v_question public.quiz_questions%ROWTYPE;
  v_question_id UUID;
  v_is_correct BOOLEAN;
  v_existing public.quiz_session_answers%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT *
  INTO v_session
  FROM public.quiz_sessions s
  WHERE s.id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  IF v_session.state <> 'in_progress' THEN
    RAISE EXCEPTION 'Session is not in progress';
  END IF;

  IF p_question_index <> v_session.current_question_index THEN
    RAISE EXCEPTION 'Invalid question index';
  END IF;

  SELECT *
  INTO v_player
  FROM public.quiz_session_players p
  WHERE p.session_id = v_session.id
    AND p.user_id = v_user_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Player not found in session';
  END IF;

  SELECT *
  INTO v_existing
  FROM public.quiz_session_answers a
  WHERE a.session_id = v_session.id
    AND a.player_id = v_player.id
    AND a.question_index = p_question_index
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY
    SELECT v_player.id, v_existing.is_correct, v_player.score, v_session.state, v_session.current_question_index, true;
    RETURN;
  END IF;

  v_question_id := v_session.question_ids[p_question_index + 1];
  IF v_question_id IS NULL THEN
    RAISE EXCEPTION 'Question not found for current index';
  END IF;

  SELECT *
  INTO v_question
  FROM public.quiz_questions q
  WHERE q.id = v_question_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Question does not exist';
  END IF;

  v_is_correct := (
    p_selected_answer = v_question.correct_answer
    OR (v_question.correct_answer_fr IS NOT NULL AND p_selected_answer = v_question.correct_answer_fr)
  );

  INSERT INTO public.quiz_session_answers (
    session_id,
    player_id,
    question_id,
    question_index,
    selected_answer,
    is_correct,
    response_ms
  ) VALUES (
    v_session.id,
    v_player.id,
    v_question.id,
    p_question_index,
    p_selected_answer,
    v_is_correct,
    p_response_ms
  );

  IF v_is_correct THEN
    UPDATE public.quiz_session_players p
    SET score = p.score + 1,
        updated_at = timezone('utc'::text, now())
    WHERE p.id = v_player.id
    RETURNING * INTO v_player;
  ELSE
    UPDATE public.quiz_session_players p
    SET updated_at = timezone('utc'::text, now())
    WHERE p.id = v_player.id
    RETURNING * INTO v_player;
  END IF;

  UPDATE public.quiz_sessions
  SET updated_at = timezone('utc'::text, now())
  WHERE id = v_session.id;

  RETURN QUERY
  SELECT v_player.id, v_is_correct, v_player.score, v_session.state, v_session.current_question_index, false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.quiz_submit_answer(UUID, INTEGER, TEXT, INTEGER) TO authenticated;

-- =============================
-- RPC: advance question
-- =============================

CREATE OR REPLACE FUNCTION public.quiz_advance_question(p_session_id UUID)
RETURNS TABLE(session_id UUID, state TEXT, current_question_index INTEGER, question_started_at TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_session public.quiz_sessions%ROWTYPE;
  v_total_questions INTEGER;
  v_next_index INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT *
  INTO v_session
  FROM public.quiz_sessions s
  WHERE s.id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  IF v_session.host_user_id <> v_user_id THEN
    RAISE EXCEPTION 'Only host can advance session';
  END IF;

  IF v_session.state <> 'in_progress' THEN
    RETURN QUERY
    SELECT v_session.id, v_session.state, v_session.current_question_index, v_session.question_started_at;
    RETURN;
  END IF;

  v_total_questions := COALESCE(array_length(v_session.question_ids, 1), 0);
  v_next_index := v_session.current_question_index + 1;

  IF v_total_questions = 0 OR v_next_index >= v_total_questions THEN
    UPDATE public.quiz_sessions
    SET state = 'finished',
        finished_at = COALESCE(finished_at, timezone('utc'::text, now())),
        updated_at = timezone('utc'::text, now())
    WHERE id = v_session.id;

    PERFORM public.quiz_upsert_attempts(v_session.id, 'online');

    RETURN QUERY
    SELECT s.id, s.state, s.current_question_index, s.question_started_at
    FROM public.quiz_sessions s
    WHERE s.id = v_session.id;
    RETURN;
  END IF;

  UPDATE public.quiz_sessions
  SET current_question_index = v_next_index,
      question_started_at = timezone('utc'::text, now()),
      updated_at = timezone('utc'::text, now())
  WHERE id = v_session.id;

  RETURN QUERY
  SELECT s.id, s.state, s.current_question_index, s.question_started_at
  FROM public.quiz_sessions s
  WHERE s.id = v_session.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.quiz_advance_question(UUID) TO authenticated;

-- =============================
-- RPC: finish session
-- =============================

CREATE OR REPLACE FUNCTION public.quiz_finish_session(p_session_id UUID)
RETURNS TABLE(session_id UUID, state TEXT, finished_at TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_session public.quiz_sessions%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT *
  INTO v_session
  FROM public.quiz_sessions s
  WHERE s.id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  IF v_session.host_user_id <> v_user_id
     AND NOT EXISTS (
       SELECT 1
       FROM public.quiz_session_players p
       WHERE p.session_id = v_session.id
         AND p.user_id = v_user_id
     ) THEN
    RAISE EXCEPTION 'Not allowed to finish this session';
  END IF;

  IF v_session.state <> 'finished' THEN
    UPDATE public.quiz_sessions
    SET state = 'finished',
        finished_at = COALESCE(finished_at, timezone('utc'::text, now())),
        updated_at = timezone('utc'::text, now())
    WHERE id = v_session.id;
  END IF;

  PERFORM public.quiz_upsert_attempts(v_session.id, 'online');

  RETURN QUERY
  SELECT s.id, s.state, s.finished_at
  FROM public.quiz_sessions s
  WHERE s.id = v_session.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.quiz_finish_session(UUID) TO authenticated;

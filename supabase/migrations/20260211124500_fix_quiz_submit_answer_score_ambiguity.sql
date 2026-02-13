-- Fix ambiguous "score" reference in quiz_submit_answer (PL/pgSQL output arg vs table column)

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

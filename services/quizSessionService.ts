import { supabase } from '@/lib/supabase';
import { quizService, type GameQuizQuestion } from '@/services/quizService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type QuizMode = 'solo' | 'duo' | 'group' | 'hotseat';
export type QuizSessionState = 'lobby' | 'in_progress' | 'finished' | 'cancelled';

export interface QuizSettings {
  question_count: number;
  response_time: number;
  jokers: number;
  helps: number;
}

export interface QuizSession {
  id: string;
  mode: QuizMode;
  state: QuizSessionState;
  host_user_id: string;
  access_code: string | null;
  category_id: string | null;
  quiz_id: string | null;
  question_ids: string[];
  settings: QuizSettings;
  current_question_index: number;
  question_started_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuizPlayer {
  id: string;
  session_id: string;
  user_id: string | null;
  display_name: string;
  seat_order: number;
  status: 'joined' | 'left' | 'ready';
  score: number;
  jokers_left: number;
  helps_left: number;
  joined_at: string;
  updated_at: string;
}

export interface QuizAnswer {
  id: string;
  session_id: string;
  player_id: string;
  question_id: string;
  question_index: number;
  selected_answer: string;
  is_correct: boolean;
  response_ms: number | null;
  answered_at: string;
}

export interface QuizThemeAvailability {
  categoryId: string;
  slug: string;
  label: string;
  availableQuestionCount: number;
  minQuestionCount: number;
  sortOrder: number;
}

export interface QuizSessionSnapshot {
  session: QuizSession;
  players: QuizPlayer[];
  answers: QuizAnswer[];
}

export interface QuizCreateSessionInput {
  mode: Exclude<QuizMode, 'hotseat'>;
  categorySlug: string;
  settings?: Partial<QuizSettings>;
  hostDisplayName?: string;
}

export interface QuizCreateSessionResult {
  sessionId: string;
  accessCode: string | null;
  playerId: string;
  snapshot: QuizSessionSnapshot;
}

export interface QuizJoinSessionResult {
  sessionId: string;
  playerId: string;
  mode: QuizMode;
  state: QuizSessionState;
  snapshot: QuizSessionSnapshot;
}

export interface QuizAnswerSubmitResult {
  player_id: string;
  is_correct: boolean;
  score: number;
  state: QuizSessionState;
  current_question_index: number;
  already_answered: boolean;
}

export type QuizLifelineType = 'joker' | 'help';

export interface QuizConsumeLifelineResult {
  playerId: string;
  jokersLeft: number;
  helpsLeft: number;
}

export interface QuizPresenceUser {
  userId: string;
  displayName?: string;
  onlineAt?: string;
}

export interface QuizSessionSubscriptionHandlers {
  onSessionChange?: (session: QuizSession) => void;
  onPlayersChange?: (players: QuizPlayer[]) => void;
  onAnswersChange?: (answers: QuizAnswer[]) => void;
  onPresenceChange?: (presence: QuizPresenceUser[]) => void;
  onError?: (error: Error) => void;
}

export interface OfflineHotseatPlayer {
  id: string;
  displayName: string;
  seatOrder: number;
  score: number;
}

export interface OfflineHotseatAnswer {
  playerId: string;
  questionIndex: number;
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  responseMs: number;
  answeredAt: string;
}

export interface OfflineHotseatSession {
  id: string;
  mode: 'hotseat';
  state: QuizSessionState;
  categorySlug: string;
  categoryId: string | null;
  settings: QuizSettings;
  questions: GameQuizQuestion[];
  players: OfflineHotseatPlayer[];
  answers: OfflineHotseatAnswer[];
  currentQuestionIndex: number;
  currentSeatOrder: number;
  questionStartedAt: string;
  startedAt: string;
  finishedAt: string | null;
  updatedAt: string;
}

export interface OfflineAttemptQueueItem {
  localSessionId: string;
  mode: QuizMode;
  categoryId: string | null;
  score: number;
  totalQuestions: number;
  accuracy: number;
  durationSec: number;
  completedAt: string;
  source: 'offline_sync';
}

export interface OfflineSyncResult {
  processed: number;
  synced: number;
  remaining: number;
}

type SubmitAnswerFallbackSessionRow = {
  id: string;
  state: QuizSessionState;
  current_question_index: number;
  question_ids: string[] | null;
};

type SubmitAnswerFallbackPlayerRow = {
  id: string;
  score: number;
};

type SubmitAnswerFallbackQuestionRow = {
  id: string;
  correct_answer: string;
  correct_answer_fr?: string | null;
};

function isAmbiguousScoreRpcError(error: any): boolean {
  return (
    error?.code === '42702' &&
    typeof error?.message === 'string' &&
    error.message.toLowerCase().includes('score')
  );
}

const DEFAULT_SETTINGS: QuizSettings = {
  question_count: 5,
  response_time: 30,
  jokers: 1,
  helps: 1,
};

const OFFLINE_SESSIONS_KEY = '@quiz_offline_sessions_v1';
const OFFLINE_SYNC_QUEUE_KEY = '@quiz_offline_sync_queue_v1';

function normalizeSettings(settings?: Partial<QuizSettings>): QuizSettings {
  return {
    question_count: Math.max(1, settings?.question_count ?? DEFAULT_SETTINGS.question_count),
    response_time: Math.max(5, settings?.response_time ?? DEFAULT_SETTINGS.response_time),
    jokers: Math.max(0, settings?.jokers ?? DEFAULT_SETTINGS.jokers),
    helps: Math.max(0, settings?.helps ?? DEFAULT_SETTINGS.helps),
  };
}

function normalizeCategorySlug(input: string): string {
  const raw = (input || '').trim().toLowerCase();
  if (!raw || raw === 'random' || raw === 'aléatoire' || raw === 'aleatoire') return 'quran';
  if (raw.includes('quran') || raw.includes('coran')) return 'quran';
  if (raw.includes('prophe')) return 'prophets';
  if (raw.includes('compan') || raw.includes('sahaba')) return 'sahaba';
  if (raw.includes('fiqh')) return 'fiqh';
  if (raw.includes('sunna') || raw.includes('sunnah') || raw.includes('seerah')) return 'seerah';
  if (raw.includes('ramadan')) return 'fiqh';
  if (raw.includes('pillar') || raw.includes('pili')) return 'fiqh';
  return raw;
}

function parseSettings(value: unknown): QuizSettings {
  if (!value || typeof value !== 'object') {
    return { ...DEFAULT_SETTINGS };
  }

  const raw = value as Partial<Record<keyof QuizSettings, unknown>>;
  const settings: Partial<QuizSettings> = {
    question_count:
      typeof raw.question_count === 'number'
        ? raw.question_count
        : typeof raw.question_count === 'string'
          ? Number(raw.question_count)
          : undefined,
    response_time:
      typeof raw.response_time === 'number'
        ? raw.response_time
        : typeof raw.response_time === 'string'
          ? Number(raw.response_time)
          : undefined,
    jokers:
      typeof raw.jokers === 'number'
        ? raw.jokers
        : typeof raw.jokers === 'string'
          ? Number(raw.jokers)
          : undefined,
    helps:
      typeof raw.helps === 'number'
        ? raw.helps
        : typeof raw.helps === 'string'
          ? Number(raw.helps)
          : undefined,
  };

  return normalizeSettings(settings);
}

function mapSession(row: any): QuizSession {
  return {
    id: row.id,
    mode: row.mode,
    state: row.state,
    host_user_id: row.host_user_id,
    access_code: row.access_code ?? null,
    category_id: row.category_id ?? null,
    quiz_id: row.quiz_id ?? null,
    question_ids: Array.isArray(row.question_ids) ? row.question_ids : [],
    settings: parseSettings(row.settings),
    current_question_index: Number(row.current_question_index || 0),
    question_started_at: row.question_started_at ?? null,
    started_at: row.started_at ?? null,
    finished_at: row.finished_at ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapPlayer(row: any): QuizPlayer {
  return {
    id: row.id,
    session_id: row.session_id,
    user_id: row.user_id ?? null,
    display_name: row.display_name,
    seat_order: Number(row.seat_order || 0),
    status: row.status,
    score: Number(row.score || 0),
    jokers_left: Number(row.jokers_left || 0),
    helps_left: Number(row.helps_left || 0),
    joined_at: row.joined_at,
    updated_at: row.updated_at,
  };
}

function mapAnswer(row: any): QuizAnswer {
  return {
    id: row.id,
    session_id: row.session_id,
    player_id: row.player_id,
    question_id: row.question_id,
    question_index: Number(row.question_index || 0),
    selected_answer: row.selected_answer,
    is_correct: Boolean(row.is_correct),
    response_ms: row.response_ms != null ? Number(row.response_ms) : null,
    answered_at: row.answered_at,
  };
}

async function fetchPlayers(sessionId: string): Promise<QuizPlayer[]> {
  const { data, error } = await supabase
    .from('quiz_session_players')
    .select('*')
    .eq('session_id', sessionId)
    .order('seat_order', { ascending: true });

  if (error) throw error;
  return ((data || []) as any[]).map(mapPlayer);
}

async function fetchAnswers(sessionId: string): Promise<QuizAnswer[]> {
  const { data, error } = await supabase
    .from('quiz_session_answers')
    .select('*')
    .eq('session_id', sessionId)
    .order('question_index', { ascending: true });

  if (error) throw error;
  return ((data || []) as any[]).map(mapAnswer);
}

async function readOfflineSessions(): Promise<Record<string, OfflineHotseatSession>> {
  const raw = await AsyncStorage.getItem(OFFLINE_SESSIONS_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as Record<string, OfflineHotseatSession>;
    return parsed || {};
  } catch {
    return {};
  }
}

async function writeOfflineSessions(
  sessions: Record<string, OfflineHotseatSession>
): Promise<void> {
  await AsyncStorage.setItem(OFFLINE_SESSIONS_KEY, JSON.stringify(sessions));
}

async function readOfflineQueue(): Promise<OfflineAttemptQueueItem[]> {
  const raw = await AsyncStorage.getItem(OFFLINE_SYNC_QUEUE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as OfflineAttemptQueueItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

async function writeOfflineQueue(queue: OfflineAttemptQueueItem[]): Promise<void> {
  await AsyncStorage.setItem(OFFLINE_SYNC_QUEUE_KEY, JSON.stringify(queue));
}

export const quizSessionService = {
  normalizeCategorySlug,
  defaultSettings: DEFAULT_SETTINGS,

  async getSessionSnapshot(sessionId: string): Promise<QuizSessionSnapshot> {
    const { data: sessionRow, error: sessionError } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) throw sessionError;

    const [players, answers] = await Promise.all([
      fetchPlayers(sessionId),
      fetchAnswers(sessionId),
    ]);

    return {
      session: mapSession(sessionRow),
      players,
      answers,
    };
  },

  async createSession(input: QuizCreateSessionInput): Promise<QuizCreateSessionResult> {
    const settings = normalizeSettings(input.settings);
    const categorySlug = normalizeCategorySlug(input.categorySlug);

    const { data, error } = await supabase.rpc('quiz_create_session', {
      p_mode: input.mode,
      p_category_slug: categorySlug,
      p_settings: settings,
      p_host_display_name: input.hostDisplayName ?? null,
    });

    if (error) throw error;

    const row = (data as any[] | null)?.[0];
    if (!row?.session_id || !row?.player_id) {
      throw new Error('Failed to create quiz session');
    }

    const snapshot = await this.getSessionSnapshot(row.session_id);

    return {
      sessionId: row.session_id,
      accessCode: row.access_code ?? null,
      playerId: row.player_id,
      snapshot,
    };
  },

  async joinSessionByCode(accessCode: string, displayName: string): Promise<QuizJoinSessionResult> {
    const { data, error } = await supabase.rpc('quiz_join_session', {
      p_access_code: accessCode,
      p_display_name: displayName,
    });

    if (error) throw error;

    const row = (data as any[] | null)?.[0];
    if (!row?.session_id || !row?.player_id) {
      throw new Error('Failed to join quiz session');
    }

    const snapshot = await this.getSessionSnapshot(row.session_id);

    return {
      sessionId: row.session_id,
      playerId: row.player_id,
      mode: row.mode,
      state: row.state,
      snapshot,
    };
  },

  async startSession(sessionId: string): Promise<QuizSession> {
    const { error } = await supabase.rpc('quiz_start_session', {
      p_session_id: sessionId,
    });

    if (error) throw error;

    const { session } = await this.getSessionSnapshot(sessionId);
    return session;
  },

  async submitAnswer(
    sessionId: string,
    questionIndex: number,
    selectedAnswer: string,
    responseMs: number
  ): Promise<QuizAnswerSubmitResult> {
    const { data, error } = await supabase.rpc('quiz_submit_answer', {
      p_session_id: sessionId,
      p_question_index: questionIndex,
      p_selected_answer: selectedAnswer,
      p_response_ms: responseMs,
    });

    if (error) {
      if (isAmbiguousScoreRpcError(error)) {
        return this.submitAnswerFallback(sessionId, questionIndex, selectedAnswer, responseMs);
      }
      throw error;
    }

    const row = (data as any[] | null)?.[0];
    if (!row) {
      throw new Error('Failed to submit answer');
    }

    return {
      player_id: row.player_id,
      is_correct: Boolean(row.is_correct),
      score: Number(row.score || 0),
      state: row.state,
      current_question_index: Number(row.current_question_index || 0),
      already_answered: Boolean(row.already_answered),
    };
  },

  async submitAnswerFallback(
    sessionId: string,
    questionIndex: number,
    selectedAnswer: string,
    responseMs: number
  ): Promise<QuizAnswerSubmitResult> {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user?.id) throw new Error('Not authenticated');

    const { data: sessionRowRaw, error: sessionError } = await supabase
      .from('quiz_sessions')
      .select('id, state, current_question_index, question_ids')
      .eq('id', sessionId)
      .single();

    if (sessionError) throw sessionError;

    const sessionRow = sessionRowRaw as SubmitAnswerFallbackSessionRow;
    if (sessionRow.state !== 'in_progress') {
      throw new Error('Session is not in progress');
    }

    if (Number(sessionRow.current_question_index || 0) !== questionIndex) {
      throw new Error('Invalid question index');
    }

    const { data: playerRowRaw, error: playerError } = await supabase
      .from('quiz_session_players')
      .select('id, score')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (playerError) throw playerError;

    const playerRow = playerRowRaw as SubmitAnswerFallbackPlayerRow;

    const { data: existingAnswer, error: existingError } = await supabase
      .from('quiz_session_answers')
      .select('is_correct')
      .eq('session_id', sessionId)
      .eq('player_id', playerRow.id)
      .eq('question_index', questionIndex)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existingAnswer) {
      return {
        player_id: playerRow.id,
        is_correct: Boolean((existingAnswer as any).is_correct),
        score: Number(playerRow.score || 0),
        state: sessionRow.state,
        current_question_index: Number(sessionRow.current_question_index || 0),
        already_answered: true,
      };
    }

    const questionIds = Array.isArray(sessionRow.question_ids) ? sessionRow.question_ids : [];
    const questionId = questionIds[questionIndex];

    if (!questionId) {
      throw new Error('Question not found for current index');
    }

    const { data: questionRowRaw, error: questionError } = await supabase
      .from('quiz_questions')
      .select('id, correct_answer, correct_answer_fr')
      .eq('id', questionId)
      .single();

    if (questionError) throw questionError;

    const questionRow = questionRowRaw as SubmitAnswerFallbackQuestionRow;
    const isCorrect =
      selectedAnswer === questionRow.correct_answer ||
      (questionRow.correct_answer_fr != null && selectedAnswer === questionRow.correct_answer_fr);

    const { error: insertError } = await supabase.from('quiz_session_answers').insert({
      session_id: sessionId,
      player_id: playerRow.id,
      question_id: questionRow.id,
      question_index: questionIndex,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
      response_ms: responseMs,
    });

    if (insertError) {
      // Handle race with another identical submit from same player/question.
      if (insertError.code === '23505') {
        const { data: latestPlayerRaw, error: latestPlayerError } = await supabase
          .from('quiz_session_players')
          .select('score')
          .eq('id', playerRow.id)
          .single();

        if (latestPlayerError) throw latestPlayerError;

        return {
          player_id: playerRow.id,
          is_correct: isCorrect,
          score: Number((latestPlayerRaw as any).score || 0),
          state: sessionRow.state,
          current_question_index: Number(sessionRow.current_question_index || 0),
          already_answered: true,
        };
      }

      throw insertError;
    }

    let nextScore = Number(playerRow.score || 0);

    if (isCorrect) {
      const incrementedScore = nextScore + 1;
      const { data: updatedPlayerRaw, error: updateError } = await supabase
        .from('quiz_session_players')
        .update({
          score: incrementedScore,
          updated_at: new Date().toISOString(),
        })
        .eq('id', playerRow.id)
        .select('score')
        .single();

      if (updateError) throw updateError;
      nextScore = Number((updatedPlayerRaw as any).score || incrementedScore);
    } else {
      const { error: updateError } = await supabase
        .from('quiz_session_players')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', playerRow.id);

      if (updateError) throw updateError;
    }

    return {
      player_id: playerRow.id,
      is_correct: isCorrect,
      score: nextScore,
      state: sessionRow.state,
      current_question_index: Number(sessionRow.current_question_index || 0),
      already_answered: false,
    };
  },

  async consumeLifeline(args: {
    sessionId: string;
    playerId: string;
    type: QuizLifelineType;
  }): Promise<QuizConsumeLifelineResult> {
    const { data: playerRow, error: playerError } = await supabase
      .from('quiz_session_players')
      .select('id, jokers_left, helps_left')
      .eq('session_id', args.sessionId)
      .eq('id', args.playerId)
      .single();

    if (playerError) throw playerError;

    const jokersLeft = Math.max(0, Number((playerRow as any).jokers_left || 0));
    const helpsLeft = Math.max(0, Number((playerRow as any).helps_left || 0));

    if (args.type === 'joker' && jokersLeft <= 0) {
      throw new Error('No jokers left');
    }

    if (args.type === 'help' && helpsLeft <= 0) {
      throw new Error('No helps left');
    }

    const nextJokersLeft = args.type === 'joker' ? jokersLeft - 1 : jokersLeft;
    const nextHelpsLeft = args.type === 'help' ? helpsLeft - 1 : helpsLeft;

    const { data: updatedRow, error: updateError } = await supabase
      .from('quiz_session_players')
      .update({
        jokers_left: nextJokersLeft,
        helps_left: nextHelpsLeft,
        updated_at: new Date().toISOString(),
      })
      .eq('session_id', args.sessionId)
      .eq('id', args.playerId)
      .select('id, jokers_left, helps_left')
      .single();

    if (updateError) throw updateError;

    return {
      playerId: (updatedRow as any).id,
      jokersLeft: Math.max(0, Number((updatedRow as any).jokers_left || 0)),
      helpsLeft: Math.max(0, Number((updatedRow as any).helps_left || 0)),
    };
  },

  async advanceQuestion(sessionId: string): Promise<QuizSession> {
    const { error } = await supabase.rpc('quiz_advance_question', {
      p_session_id: sessionId,
    });

    if (error) throw error;

    const { session } = await this.getSessionSnapshot(sessionId);
    return session;
  },

  async finishSession(sessionId: string): Promise<QuizSession> {
    const { error } = await supabase.rpc('quiz_finish_session', {
      p_session_id: sessionId,
    });

    if (error) throw error;

    const { session } = await this.getSessionSnapshot(sessionId);
    return session;
  },

  subscribeSession(
    sessionId: string,
    handlers: QuizSessionSubscriptionHandlers
  ): () => Promise<void> {
    const channel = supabase.channel(`quiz:session:${sessionId}`);

    const refreshPlayers = async () => {
      try {
        const players = await fetchPlayers(sessionId);
        handlers.onPlayersChange?.(players);
      } catch (error) {
        handlers.onError?.(error as Error);
      }
    };

    const refreshAnswers = async () => {
      try {
        const answers = await fetchAnswers(sessionId);
        handlers.onAnswersChange?.(answers);
      } catch (error) {
        handlers.onError?.(error as Error);
      }
    };

    // Debug: Listen to ALL events on public schema to verify connection
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public' },
      (payload) => {
        console.log('[Realtime] GLOBAL DEBUG:', payload.table, payload.eventType);
      }
    );

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quiz_sessions', filter: `id=eq.${sessionId}` },
        (payload) => {
          console.log('[Realtime] Session diff received:', payload);
          if (payload.new) {
            handlers.onSessionChange?.(mapSession(payload.new));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quiz_session_players',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('[Realtime] Player update received:', payload.eventType);
          void refreshPlayers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quiz_session_answers',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('[Realtime] Answer update received:', payload.eventType);
          void refreshAnswers();
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        console.log('[Realtime] Presence sync:', Object.keys(state).length, 'users');
        const participants = Object.values(state)
          .flat()
          .map((entry: any) => ({
            userId: entry.userId,
            displayName: entry.displayName,
            onlineAt: entry.onlineAt,
          }))
          .filter((entry) => typeof entry.userId === 'string');

        handlers.onPresenceChange?.(participants);
      });

    void channel.subscribe(async (status) => {
      console.log(`[Realtime] Channel status for ${sessionId}:`, status);
      if (status === 'SUBSCRIBED') {
        try {
          const { data } = await supabase.auth.getUser();
          const user = data.user;
          if (user?.id) {
            await channel.track({
              userId: user.id,
              displayName: user.user_metadata?.full_name || 'Player',
              onlineAt: new Date().toISOString(),
            });
          }

          await Promise.all([refreshPlayers(), refreshAnswers()]);
        } catch (error) {
          handlers.onError?.(error as Error);
        }
      }
    });

    return async () => {
      await supabase.removeChannel(channel);
    };
  },

  async getThemeAvailability(args?: {
    questionCount?: number;
    language?: string;
  }): Promise<QuizThemeAvailability[]> {
    const requiredQuestionCount = Math.max(
      1,
      args?.questionCount ?? DEFAULT_SETTINGS.question_count
    );
    const language = args?.language ?? 'en';

    const { data: categories, error: categoryError } = await supabase
      .from('quiz_categories')
      .select('id, name, name_fr, slug, is_enabled, min_question_count, sort_order')
      .eq('is_enabled', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (categoryError) throw categoryError;

    const categoryRows = (categories || []) as any[];
    if (categoryRows.length === 0) return [];

    const categoryIds = categoryRows.map((row) => row.id);

    const { data: quizzes, error: quizzesError } = await supabase
      .from('quizzes')
      .select('id, category_id')
      .in('category_id', categoryIds);

    if (quizzesError) throw quizzesError;

    const quizRows = (quizzes || []) as any[];
    if (quizRows.length === 0) return [];

    const quizIds = quizRows.map((row) => row.id);

    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('quiz_id, is_active')
      .in('quiz_id', quizIds)
      .eq('is_active', true);

    if (questionsError) throw questionsError;

    const quizToCategory = new Map<string, string>();
    for (const row of quizRows) {
      if (row.id && row.category_id) {
        quizToCategory.set(row.id, row.category_id);
      }
    }

    const counts = new Map<string, number>();
    for (const row of (questions || []) as any[]) {
      const categoryId = quizToCategory.get(row.quiz_id);
      if (!categoryId) continue;
      counts.set(categoryId, (counts.get(categoryId) || 0) + 1);
    }

    return categoryRows
      .map((category) => {
        const available = counts.get(category.id) || 0;
        const minCount = Math.max(
          1,
          Number(category.min_question_count || DEFAULT_SETTINGS.question_count)
        );
        const required = requiredQuestionCount;
        const slug = normalizeCategorySlug(category.slug || category.name);

        return {
          categoryId: category.id,
          slug,
          label: language === 'fr' && category.name_fr ? category.name_fr : category.name,
          availableQuestionCount: available,
          minQuestionCount: minCount,
          sortOrder: Number(category.sort_order || 0),
          required,
        };
      })
      .filter((category) => category.availableQuestionCount >= category.required)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))
      .map(({ required, ...rest }) => rest);
  },

  async createOfflineHotseatSession(input: {
    categorySlug: string;
    categoryId: string | null;
    settings?: Partial<QuizSettings>;
    playerNames: string[];
    language: string;
  }): Promise<OfflineHotseatSession> {
    const settings = normalizeSettings(input.settings);
    const categorySlug = normalizeCategorySlug(input.categorySlug);

    const questions = await quizService.getGameQuestions({
      theme: categorySlug,
      limit: settings.question_count,
      language: input.language,
    });

    if (questions.length < settings.question_count) {
      throw new Error('Not enough questions for selected theme');
    }

    const now = new Date().toISOString();
    const sessionId = `local-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

    const players = input.playerNames.slice(0, 8).map((name, index) => ({
      id: `${sessionId}-seat-${index + 1}`,
      displayName: name.trim() || `Player ${index + 1}`,
      seatOrder: index + 1,
      score: 0,
    }));

    if (players.length < 2) {
      throw new Error('Offline hot-seat requires at least 2 players');
    }

    const session: OfflineHotseatSession = {
      id: sessionId,
      mode: 'hotseat',
      state: 'in_progress',
      categorySlug,
      categoryId: input.categoryId,
      settings,
      questions,
      players,
      answers: [],
      currentQuestionIndex: 0,
      currentSeatOrder: 1,
      questionStartedAt: now,
      startedAt: now,
      finishedAt: null,
      updatedAt: now,
    };

    await this.saveOfflineSession(session);
    return session;
  },

  async saveOfflineSession(session: OfflineHotseatSession): Promise<void> {
    const sessions = await readOfflineSessions();
    sessions[session.id] = {
      ...session,
      updatedAt: new Date().toISOString(),
    };
    await writeOfflineSessions(sessions);
  },

  async loadOfflineSession(sessionId: string): Promise<OfflineHotseatSession | null> {
    const sessions = await readOfflineSessions();
    return sessions[sessionId] || null;
  },

  async removeOfflineSession(sessionId: string): Promise<void> {
    const sessions = await readOfflineSessions();
    if (sessions[sessionId]) {
      delete sessions[sessionId];
      await writeOfflineSessions(sessions);
    }
  },

  async enqueueOfflineAttempt(item: OfflineAttemptQueueItem): Promise<void> {
    const queue = await readOfflineQueue();
    queue.push(item);
    await writeOfflineQueue(queue);
  },

  async getOfflineQueueSize(): Promise<number> {
    const queue = await readOfflineQueue();
    return queue.length;
  },

  async syncOfflineQueue(): Promise<OfflineSyncResult> {
    const queue = await readOfflineQueue();

    if (queue.length === 0) {
      return { processed: 0, synced: 0, remaining: 0 };
    }

    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user?.id) {
      return {
        processed: 0,
        synced: 0,
        remaining: queue.length,
      };
    }

    let synced = 0;
    const remaining: OfflineAttemptQueueItem[] = [];

    for (const item of queue) {
      const { error } = await supabase.from('user_quiz_attempts').upsert(
        {
          user_id: user.id,
          local_session_id: item.localSessionId,
          mode: item.mode,
          category_id: item.categoryId,
          score: item.score,
          total_questions: item.totalQuestions,
          accuracy: item.accuracy,
          duration_sec: item.durationSec,
          completed_at: item.completedAt,
          source: item.source,
        },
        { onConflict: 'local_session_id,user_id' }
      );

      if (error) {
        remaining.push(item);
      } else {
        synced += 1;
      }
    }

    await writeOfflineQueue(remaining);

    return {
      processed: queue.length,
      synced,
      remaining: remaining.length,
    };
  },
};

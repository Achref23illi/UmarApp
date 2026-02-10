import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { challengeService, ChallengeCategory } from '@/services/challengeService';

export type ChallengeLevelStatus = 'active' | 'locked' | 'completed';

export interface ChallengeLevel {
  id: string;
  categoryId: string;
  levelNumber: number;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  durationDays: number;
}

export interface ChallengeLevelWithUserState extends ChallengeLevel {
  status: ChallengeLevelStatus;
  progress: number; // 0..1
}

export interface ChallengeDashboardDay {
  day: string; // e.g. Lun/Mar
  value: number; // 0..2
  full: boolean;
  dateISO: string; // YYYY-MM-DD
}

export interface ChallengeLevelDashboard {
  streak: number;
  daysLeft: number;
  progress: number; // 0..1
  totalRead: number;
  completionRate: number; // 0..100
  weeklyActivity: ChallengeDashboardDay[];
  doneToday: boolean;
}

export interface ToggleCompletionResult {
  doneToday: boolean;
  currentLevelCompleted: boolean;
  autoAdvancedToNextLevel: boolean;
  nextLevelId?: string;
  nextLevelTitle?: string;
  challengeCompleted: boolean;
}

export interface QuranDailyReadProgress {
  readSurahs: number[];
  completedToday: boolean;
}

export interface MarkQuranSurahReadResult extends QuranDailyReadProgress {
  newlyMarkedSurah: boolean;
  newlyCompletedDay: boolean;
}

export interface UserChallengeSettings {
  daysCount: number;
  exercisesCount: number;
  durationMinutes: number;
  selectedDays: string[];
  notifications: boolean;
  reminders: boolean;
  arabic: boolean;
}

type ChallengeLevelRow = {
  id: string;
  category_id: string;
  level_number: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  duration_days: number;
};

type UserLevelProgressRow = {
  level_id: string;
  status: ChallengeLevelStatus;
  started_at?: string | null;
  completed_at?: string | null;
};

type CompletionRow = {
  level_id: string;
  completed_date: string; // date
  value: number;
};

type SettingsRow = {
  days_count: number;
  exercises_count: number;
  duration_minutes: number;
  selected_days: string[];
  notifications_enabled: boolean;
  reminders_enabled: boolean;
  arabic_enabled: boolean;
};

type SurahReadRow = {
  surah_number: number;
};

const DEFAULT_SETTINGS: UserChallengeSettings = {
  daysCount: 9,
  exercisesCount: 2,
  durationMinutes: 5,
  selectedDays: [],
  notifications: true,
  reminders: true,
  arabic: true,
};
const SUPPORTED_CATEGORY_SLUGS = new Set(['quran', 'salat_obligatoire', 'sadaqa']);
const LOCAL_SURAH_READS_KEY = '@challenge_quran_daily_surah_reads_v1';
let isSurahReadsTableAvailable: boolean | null = null;

function formatISODate(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function weekdayLabel(date: Date, language: string): string {
  const day = date.getUTCDay(); // 0 Sun..6 Sat
  const fr = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const en = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const ar = ['أحد', 'اثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

  if (language === 'fr') return fr[day];
  if (language === 'ar') return ar[day];
  return en[day];
}

function mapLevelRow(row: ChallengeLevelRow): ChallengeLevel {
  return {
    id: row.id,
    categoryId: row.category_id,
    levelNumber: row.level_number,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    durationDays: row.duration_days,
  };
}

function buildCompletedCountByLevel(rows: CompletionRow[] | null): Map<string, number> {
  const result = new Map<string, number>();
  (rows ?? []).forEach((row) => {
    result.set(row.level_id, (result.get(row.level_id) ?? 0) + 1);
  });
  return result;
}

function computeLevelStates(
  levels: ChallengeLevel[],
  completedCountByLevel: Map<string, number>
): ChallengeLevelWithUserState[] {
  const ordered = [...levels].sort((a, b) => a.levelNumber - b.levelNumber);
  let hasActive = false;

  return ordered.map((level) => {
    const completedDays = completedCountByLevel.get(level.id) ?? 0;
    const progress = level.durationDays > 0 ? Math.min(1, completedDays / level.durationDays) : 0;

    let status: ChallengeLevelStatus = 'locked';
    if (progress >= 1) {
      status = 'completed';
    } else if (!hasActive) {
      status = 'active';
      hasActive = true;
    }

    return { ...level, progress, status };
  });
}

async function fetchLevelsByCategoryId(categoryId: string): Promise<ChallengeLevel[]> {
  const { data, error } = await supabase
    .from('challenge_levels')
    .select('id, category_id, level_number, title, subtitle, description, duration_days')
    .eq('category_id', categoryId)
    .order('level_number', { ascending: true });

  if (error) throw error;
  return ((data as ChallengeLevelRow[]) ?? []).map(mapLevelRow);
}

async function fetchCompletionsForLevels(
  userId: string,
  levelIds: string[]
): Promise<CompletionRow[]> {
  if (!levelIds.length) return [];

  const { data, error } = await supabase
    .from('user_challenge_daily_completions')
    .select('level_id, completed_date, value')
    .eq('user_id', userId)
    .in('level_id', levelIds);

  if (error) throw error;
  return (data as CompletionRow[]) ?? [];
}

async function syncCategoryProgressState(params: {
  userId: string;
  categoryId: string;
  levels?: ChallengeLevel[];
  completionRows?: CompletionRow[];
}): Promise<void> {
  const levels = params.levels ?? (await fetchLevelsByCategoryId(params.categoryId));
  if (!levels.length) return;

  const levelIds = levels.map((l) => l.id);
  const completionRows =
    params.completionRows ?? (await fetchCompletionsForLevels(params.userId, levelIds));
  const completedCountByLevel = buildCompletedCountByLevel(completionRows);
  const computedStates = computeLevelStates(levels, completedCountByLevel);

  const { data: existingRows, error: existingError } = await supabase
    .from('user_challenge_level_progress')
    .select('level_id, status, started_at, completed_at')
    .eq('user_id', params.userId)
    .in('level_id', levelIds);
  if (existingError) throw existingError;

  const existingByLevel = new Map(
    ((existingRows as UserLevelProgressRow[] | null) ?? []).map((row) => [row.level_id, row])
  );

  const nowISO = new Date().toISOString();
  const upserts = computedStates
    .map((state) => {
      const existing = existingByLevel.get(state.id);

      const nextStartedAt = state.status === 'locked' ? null : (existing?.started_at ?? nowISO);
      const nextCompletedAt =
        state.status === 'completed' ? (existing?.completed_at ?? nowISO) : null;

      const changed =
        !existing ||
        existing.status !== state.status ||
        (existing.started_at ?? null) !== nextStartedAt ||
        (existing.completed_at ?? null) !== nextCompletedAt;

      if (!changed) return null;

      return {
        user_id: params.userId,
        level_id: state.id,
        status: state.status,
        started_at: nextStartedAt,
        completed_at: nextCompletedAt,
        updated_at: nowISO,
      };
    })
    .filter((row): row is NonNullable<typeof row> => !!row);

  if (!upserts.length) return;

  const { error: upsertError } = await supabase
    .from('user_challenge_level_progress')
    .upsert(upserts, { onConflict: 'user_id,level_id' });
  if (upsertError) throw upsertError;
}

function normalizeSurahNumbers(values: number[]): number[] {
  return [...new Set(values.filter((v) => Number.isInteger(v) && v >= 1 && v <= 114))].sort(
    (a, b) => a - b
  );
}

function buildSurahReadsLocalKey(userId: string, levelId: string, dateISO: string): string {
  return `${userId}:${levelId}:${dateISO}`;
}

function isMissingSurahReadsTableError(error: unknown): boolean {
  const msg = String((error as { message?: string })?.message || '').toLowerCase();
  if (!msg) return false;
  return (
    msg.includes('user_challenge_daily_surah_reads') &&
    (msg.includes('does not exist') ||
      msg.includes('not found') ||
      msg.includes('relation') ||
      msg.includes('schema cache'))
  );
}

async function readLocalSurahReads(
  userId: string,
  levelId: string,
  dateISO: string
): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_SURAH_READS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, number[]>;
    const values = parsed?.[buildSurahReadsLocalKey(userId, levelId, dateISO)] ?? [];
    return normalizeSurahNumbers(Array.isArray(values) ? values : []);
  } catch {
    return [];
  }
}

async function writeLocalSurahReads(
  userId: string,
  levelId: string,
  dateISO: string,
  surahs: number[]
): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_SURAH_READS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, number[]>) : {};
    parsed[buildSurahReadsLocalKey(userId, levelId, dateISO)] = normalizeSurahNumbers(surahs);
    await AsyncStorage.setItem(LOCAL_SURAH_READS_KEY, JSON.stringify(parsed));
  } catch {
    // local persistence failure is non-fatal
  }
}

async function readSurahReadsFromStorage(params: {
  userId: string;
  levelId: string;
  dateISO: string;
}): Promise<number[]> {
  if (isSurahReadsTableAvailable !== false) {
    const { data, error } = await supabase
      .from('user_challenge_daily_surah_reads')
      .select('surah_number')
      .eq('user_id', params.userId)
      .eq('level_id', params.levelId)
      .eq('completed_date', params.dateISO);

    if (!error) {
      isSurahReadsTableAvailable = true;
      return normalizeSurahNumbers(((data as SurahReadRow[] | null) ?? []).map((r) => r.surah_number));
    }

    if (!isMissingSurahReadsTableError(error)) throw error;
    isSurahReadsTableAvailable = false;
  }

  return readLocalSurahReads(params.userId, params.levelId, params.dateISO);
}

async function markSurahReadInStorage(params: {
  userId: string;
  levelId: string;
  dateISO: string;
  surahNumber: number;
}): Promise<{ readSurahs: number[]; newlyMarkedSurah: boolean }> {
  if (isSurahReadsTableAvailable !== false) {
    const { data: existing, error: existingError } = await supabase
      .from('user_challenge_daily_surah_reads')
      .select('id')
      .eq('user_id', params.userId)
      .eq('level_id', params.levelId)
      .eq('completed_date', params.dateISO)
      .eq('surah_number', params.surahNumber)
      .maybeSingle();

    if (!existingError) {
      isSurahReadsTableAvailable = true;
      let newlyMarkedSurah = false;

      if (!existing?.id) {
        const { error: insertError } = await supabase.from('user_challenge_daily_surah_reads').insert({
          user_id: params.userId,
          level_id: params.levelId,
          completed_date: params.dateISO,
          surah_number: params.surahNumber,
        });
        if (insertError) {
          if (!isMissingSurahReadsTableError(insertError)) throw insertError;
          isSurahReadsTableAvailable = false;
        } else {
          newlyMarkedSurah = true;
        }
      }

      if (isSurahReadsTableAvailable !== false) {
        const rows = await readSurahReadsFromStorage(params);
        return { readSurahs: rows, newlyMarkedSurah };
      }
    } else if (!isMissingSurahReadsTableError(existingError)) {
      throw existingError;
    } else {
      isSurahReadsTableAvailable = false;
    }
  }

  const current = await readLocalSurahReads(params.userId, params.levelId, params.dateISO);
  const hasAlready = current.includes(params.surahNumber);
  const next = hasAlready ? current : normalizeSurahNumbers([...current, params.surahNumber]);
  if (!hasAlready) {
    await writeLocalSurahReads(params.userId, params.levelId, params.dateISO, next);
  }
  return { readSurahs: next, newlyMarkedSurah: !hasAlready };
}

export const challengeDetailsService = {
  getChallengeCategoryWithLevels: async (
    slug: string,
    _language: string
  ): Promise<{ category: ChallengeCategory; levels: ChallengeLevelWithUserState[] } | null> => {
    const category = await challengeService.getCategoryBySlug(slug);
    if (!category) return null;

    const levels = await fetchLevelsByCategoryId(category.id);

    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user?.id;

    if (!userId) {
      return {
        category,
        levels: computeLevelStates(levels, new Map()),
      };
    }

    const levelIds = levels.map((l) => l.id);
    const completionRows = await fetchCompletionsForLevels(userId, levelIds);
    const completedCountByLevel = buildCompletedCountByLevel(completionRows);
    const computed = computeLevelStates(levels, completedCountByLevel);

    return { category, levels: computed };
  },

  getMyChallenges: async (): Promise<{
    active: { level: ChallengeLevel; category: ChallengeCategory; progress: number }[];
    completed: { level: ChallengeLevel; category: ChallengeCategory; completedAt?: string }[];
  }> => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user?.id;
    if (!userId) return { active: [], completed: [] };

    const { data: existingProgressRows, error: existingProgressError } = await supabase
      .from('user_challenge_level_progress')
      .select('level_id')
      .eq('user_id', userId);

    if (existingProgressError || !existingProgressRows?.length) {
      return { active: [], completed: [] };
    }

    const existingLevelIds = existingProgressRows.map((row: { level_id: string }) => row.level_id);
    const { data: allLevelRows, error: allLevelRowsError } = await supabase
      .from('challenge_levels')
      .select('id, category_id, level_number, title, subtitle, description, duration_days')
      .in('id', existingLevelIds);

    if (allLevelRowsError || !allLevelRows?.length) {
      return { active: [], completed: [] };
    }

    const categoryIdsToSync = [
      ...new Set((allLevelRows as ChallengeLevelRow[]).map((row) => row.category_id)),
    ];
    await Promise.all(
      categoryIdsToSync.map((categoryId) => syncCategoryProgressState({ userId, categoryId }))
    );

    const { data: progressRows, error: progErr } = await supabase
      .from('user_challenge_level_progress')
      .select('level_id, status, completed_at')
      .eq('user_id', userId)
      .in('status', ['active', 'completed']);

    if (progErr || !progressRows?.length) return { active: [], completed: [] };

    const levelIds = progressRows.map((r: { level_id: string }) => r.level_id);
    const levelRows = (allLevelRows as ChallengeLevelRow[]).filter((row) =>
      levelIds.includes(row.id)
    );
    if (!levelRows.length) return { active: [], completed: [] };

    const categoryIds = [...new Set((levelRows as ChallengeLevelRow[]).map((r) => r.category_id))];
    const { data: catRows, error: catErr } = await supabase
      .from('challenge_categories')
      .select(
        'id, slug, title, subtitle, description, duration, levels, prerequisite, icon_name, image_url, is_locked, color, sort_order'
      )
      .in('id', categoryIds);

    if (catErr || !catRows?.length) return { active: [], completed: [] };

    type CatRow = {
      id: string;
      slug: string;
      title: string;
      subtitle: string | null;
      description: string | null;
      duration: string;
      levels: string;
      prerequisite: string;
      icon_name: string;
      image_url: string | null;
      is_locked: boolean;
      color: string;
      sort_order: number;
    };
    function mapCategoryRowFromRaw(r: CatRow): ChallengeCategory {
      return {
        id: r.id,
        slug: r.slug,
        title: r.title,
        subtitle: r.subtitle,
        description: r.description,
        duration: r.duration,
        levels: r.levels,
        prerequisite: r.prerequisite,
        iconName: r.icon_name,
        imageUrl: r.image_url,
        isLocked: !!r.is_locked,
        color: r.color,
        sortOrder: r.sort_order,
      };
    }

    const categoryMap = new Map(
      (catRows as CatRow[])
        .filter((row) => SUPPORTED_CATEGORY_SLUGS.has(row.slug))
        .map((row) => [row.id, mapCategoryRowFromRaw(row)])
    );

    const progressByLevel = new Map(
      progressRows.map((r: { level_id: string; status: string; completed_at?: string }) => [
        r.level_id,
        r,
      ])
    );

    const { data: completionRows } = await supabase
      .from('user_challenge_daily_completions')
      .select('level_id, completed_date')
      .eq('user_id', userId)
      .in('level_id', levelIds);

    const completedDaysByLevel = new Map<string, number>();
    (completionRows as { level_id: string }[] | null)?.forEach((r) => {
      completedDaysByLevel.set(r.level_id, (completedDaysByLevel.get(r.level_id) ?? 0) + 1);
    });

    const active: { level: ChallengeLevel; category: ChallengeCategory; progress: number }[] = [];
    const completed: {
      level: ChallengeLevel;
      category: ChallengeCategory;
      completedAt?: string;
    }[] = [];

    for (const lr of levelRows as ChallengeLevelRow[]) {
      const level = mapLevelRow(lr);
      const cat = categoryMap.get(lr.category_id);
      const prog = progressByLevel.get(lr.id);
      if (!cat || !prog) continue;

      const completedDays = completedDaysByLevel.get(lr.id) ?? 0;
      const progress = lr.duration_days > 0 ? Math.min(1, completedDays / lr.duration_days) : 0;

      if (prog.status === 'active') {
        active.push({ level, category: cat, progress });
      } else if (prog.status === 'completed') {
        completed.push({ level, category: cat, completedAt: prog.completed_at });
      }
    }

    return { active, completed };
  },

  getLevelById: async (levelId: string): Promise<ChallengeLevel | null> => {
    const { data, error } = await supabase
      .from('challenge_levels')
      .select('id, category_id, level_number, title, subtitle, description, duration_days')
      .eq('id', levelId)
      .single();

    if (error) return null;
    return mapLevelRow(data as ChallengeLevelRow);
  },

  getLevelDashboard: async (
    levelId: string,
    language: string
  ): Promise<ChallengeLevelDashboard> => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user?.id;

    const level = await challengeDetailsService.getLevelById(levelId);
    const durationDays = level?.durationDays ?? 0;

    if (!userId) {
      return {
        streak: 0,
        daysLeft: durationDays,
        progress: 0,
        totalRead: 0,
        completionRate: 0,
        weeklyActivity: [],
        doneToday: false,
      };
    }

    // Fetch all completions for this level (small dataset)
    const { data: rows, error } = await supabase
      .from('user_challenge_daily_completions')
      .select('level_id, completed_date, value')
      .eq('user_id', userId)
      .eq('level_id', levelId);

    if (error) throw error;

    const completions = (rows as CompletionRow[]) ?? [];

    const today = new Date();
    const todayISO = formatISODate(today);

    const doneToday = completions.some((c) => c.completed_date === todayISO);

    const completedDays = completions.length;
    const totalRead = completions.reduce((sum, c) => sum + (c.value ?? 0), 0);

    const progress = durationDays > 0 ? Math.min(1, completedDays / durationDays) : 0;
    const completionRate = Math.round(progress * 100);
    const daysLeft = Math.max(0, durationDays - completedDays);

    // Weekly activity (last 7 days)
    const last7: ChallengeDashboardDay[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      d.setUTCDate(d.getUTCDate() - i);
      const iso = formatISODate(d);
      const value = completions.find((c) => c.completed_date === iso)?.value ?? 0;
      last7.push({
        day: weekdayLabel(d, language),
        value,
        full: value >= 2,
        dateISO: iso,
      });
    }

    // Streak: count consecutive days up to today with completion
    const completionSet = new Set(completions.map((c) => c.completed_date));
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      d.setUTCDate(d.getUTCDate() - i);
      const iso = formatISODate(d);
      if (!completionSet.has(iso)) break;
      streak++;
    }

    return {
      streak,
      daysLeft,
      progress,
      totalRead,
      completionRate,
      weeklyActivity: last7,
      doneToday,
    };
  },

  getTodayQuranReadProgress: async ({
    levelId,
    requiredSurahs,
  }: {
    levelId: string;
    requiredSurahs: number[];
  }): Promise<QuranDailyReadProgress> => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user?.id;
    if (!userId) return { readSurahs: [], completedToday: false };

    const todayISO = formatISODate(new Date());
    const normalizedRequired = normalizeSurahNumbers(requiredSurahs);
    const readSurahs = await readSurahReadsFromStorage({ userId, levelId, dateISO: todayISO });

    if (normalizedRequired.length > 0) {
      return {
        readSurahs,
        completedToday: normalizedRequired.every((surah) => readSurahs.includes(surah)),
      };
    }

    const { data: existingCompletion } = await supabase
      .from('user_challenge_daily_completions')
      .select('id')
      .eq('user_id', userId)
      .eq('level_id', levelId)
      .eq('completed_date', todayISO)
      .maybeSingle();

    return { readSurahs, completedToday: !!existingCompletion?.id };
  },

  markTodayQuranSurahRead: async ({
    levelId,
    surahNumber,
    requiredSurahs,
  }: {
    levelId: string;
    surahNumber: number;
    requiredSurahs: number[];
  }): Promise<MarkQuranSurahReadResult> => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const level = await challengeDetailsService.getLevelById(levelId);
    if (!level) throw new Error('Level not found');

    const todayISO = formatISODate(new Date());
    const normalizedRequired = normalizeSurahNumbers(requiredSurahs);
    const targetSurahs = normalizedRequired.length ? normalizedRequired : [surahNumber];

    const { readSurahs, newlyMarkedSurah } = await markSurahReadInStorage({
      userId,
      levelId,
      dateISO: todayISO,
      surahNumber,
    });

    const completedToday = targetSurahs.every((surah) => readSurahs.includes(surah));

    const { data: existingCompletion } = await supabase
      .from('user_challenge_daily_completions')
      .select('id')
      .eq('user_id', userId)
      .eq('level_id', levelId)
      .eq('completed_date', todayISO)
      .maybeSingle();

    let newlyCompletedDay = false;

    if (completedToday && !existingCompletion?.id) {
      const { error: insertError } = await supabase.from('user_challenge_daily_completions').insert({
        user_id: userId,
        level_id: levelId,
        completed_date: todayISO,
        value: 2,
      });
      if (insertError) throw insertError;
      newlyCompletedDay = true;

      await syncCategoryProgressState({ userId, categoryId: level.categoryId });
    } else if (!completedToday && existingCompletion?.id) {
      const { error: deleteError } = await supabase
        .from('user_challenge_daily_completions')
        .delete()
        .eq('id', existingCompletion.id);
      if (deleteError) throw deleteError;

      await syncCategoryProgressState({ userId, categoryId: level.categoryId });
    }

    return {
      readSurahs,
      completedToday,
      newlyMarkedSurah,
      newlyCompletedDay,
    };
  },

  toggleTodayCompletion: async (levelId: string): Promise<ToggleCompletionResult> => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const level = await challengeDetailsService.getLevelById(levelId);
    if (!level) throw new Error('Level not found');

    const allLevelsInCategory = await fetchLevelsByCategoryId(level.categoryId);
    const existingCompletions = await fetchCompletionsForLevels(
      userId,
      allLevelsInCategory.map((item) => item.id)
    );
    const statesBefore = computeLevelStates(
      allLevelsInCategory,
      buildCompletedCountByLevel(existingCompletions)
    );
    const levelState = statesBefore.find((item) => item.id === levelId);
    const activeBefore = statesBefore.find((item) => item.status === 'active') ?? null;

    if (!levelState || levelState.status === 'locked') {
      throw new Error('Level is locked');
    }

    const todayISO = formatISODate(new Date());

    const { data: existing } = await supabase
      .from('user_challenge_daily_completions')
      .select('id')
      .eq('user_id', userId)
      .eq('level_id', levelId)
      .eq('completed_date', todayISO)
      .maybeSingle();

    if (existing?.id) {
      const { error: delError } = await supabase
        .from('user_challenge_daily_completions')
        .delete()
        .eq('id', existing.id);
      if (delError) throw delError;

      const completionsAfter = existingCompletions.filter(
        (row) => !(row.level_id === levelId && row.completed_date === todayISO)
      );
      const statesAfter = computeLevelStates(
        allLevelsInCategory,
        buildCompletedCountByLevel(completionsAfter)
      );
      const activeAfter = statesAfter.find((item) => item.status === 'active') ?? null;
      const currentAfter = statesAfter.find((item) => item.id === levelId);

      await syncCategoryProgressState({
        userId,
        categoryId: level.categoryId,
        levels: allLevelsInCategory,
        completionRows: completionsAfter,
      });

      return {
        doneToday: false,
        currentLevelCompleted: currentAfter?.status === 'completed',
        autoAdvancedToNextLevel: !!(
          activeBefore?.id === levelId &&
          activeAfter &&
          activeAfter.id !== levelId
        ),
        nextLevelId:
          activeBefore?.id === levelId && activeAfter && activeAfter.id !== levelId
            ? activeAfter.id
            : undefined,
        nextLevelTitle:
          activeBefore?.id === levelId && activeAfter && activeAfter.id !== levelId
            ? activeAfter.title
            : undefined,
        challengeCompleted: !activeAfter && statesAfter.every((item) => item.status === 'completed'),
      };
    }

    const { error: insError } = await supabase.from('user_challenge_daily_completions').insert({
      user_id: userId,
      level_id: levelId,
      completed_date: todayISO,
      value: 2, // keep UI scale 0..2
    });
    if (insError) throw insError;

    const completionsAfter = [
      ...existingCompletions,
      {
        level_id: levelId,
        completed_date: todayISO,
        value: 2,
      } as CompletionRow,
    ];
    const statesAfter = computeLevelStates(
      allLevelsInCategory,
      buildCompletedCountByLevel(completionsAfter)
    );
    const activeAfter = statesAfter.find((item) => item.status === 'active') ?? null;
    const currentAfter = statesAfter.find((item) => item.id === levelId);
    const autoAdvanced = !!(
      activeBefore?.id === levelId &&
      activeAfter &&
      activeAfter.id !== levelId
    );

    await syncCategoryProgressState({
      userId,
      categoryId: level.categoryId,
      levels: allLevelsInCategory,
      completionRows: completionsAfter,
    });

    return {
      doneToday: true,
      currentLevelCompleted: currentAfter?.status === 'completed',
      autoAdvancedToNextLevel: autoAdvanced,
      nextLevelId: autoAdvanced ? activeAfter?.id : undefined,
      nextLevelTitle: autoAdvanced ? activeAfter?.title : undefined,
      challengeCompleted: !activeAfter && statesAfter.every((item) => item.status === 'completed'),
    };
  },

  getSettingsForLevel: async (levelId: string): Promise<UserChallengeSettings> => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user?.id;
    if (!userId) return DEFAULT_SETTINGS;

    const { data, error } = await supabase
      .from('user_challenge_settings')
      .select(
        'days_count, exercises_count, duration_minutes, selected_days, notifications_enabled, reminders_enabled, arabic_enabled'
      )
      .eq('user_id', userId)
      .eq('level_id', levelId)
      .maybeSingle();

    if (error) throw error;

    if (!data) return DEFAULT_SETTINGS;

    const row = data as SettingsRow;
    return {
      daysCount: row.days_count,
      exercisesCount: row.exercises_count,
      durationMinutes: row.duration_minutes,
      selectedDays: row.selected_days ?? [],
      notifications: row.notifications_enabled,
      reminders: row.reminders_enabled,
      arabic: row.arabic_enabled,
    };
  },

  saveSettingsForLevel: async ({
    levelId,
    categoryId,
    settings,
  }: {
    levelId: string;
    categoryId: string;
    settings: UserChallengeSettings;
  }): Promise<void> => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const levels = await fetchLevelsByCategoryId(categoryId);
    const targetLevel = levels.find((level) => level.id === levelId);
    if (!targetLevel) throw new Error('Level not found');

    const completionRows = await fetchCompletionsForLevels(
      userId,
      levels.map((level) => level.id)
    );
    const computedStates = computeLevelStates(levels, buildCompletedCountByLevel(completionRows));
    const targetState = computedStates.find((level) => level.id === levelId);

    if (!targetState || targetState.status === 'locked') {
      throw new Error('Level is locked');
    }

    const { error } = await supabase.from('user_challenge_settings').upsert(
      {
        user_id: userId,
        level_id: levelId,
        category_id: categoryId,
        days_count: settings.daysCount,
        exercises_count: settings.exercisesCount,
        duration_minutes: settings.durationMinutes,
        selected_days: settings.selectedDays,
        notifications_enabled: settings.notifications,
        reminders_enabled: settings.reminders,
        arabic_enabled: settings.arabic,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,level_id' }
    );

    if (error) throw error;

    await syncCategoryProgressState({
      userId,
      categoryId,
      levels,
      completionRows,
    });
  },
};

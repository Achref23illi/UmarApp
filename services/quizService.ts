import { supabase } from '@/lib/supabase';

export interface GameQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string | null;
}

type QuizCategoryRow = {
  id: string;
  name: string;
  name_fr?: string | null;
  slug?: string | null;
};

type QuizRow = {
  id: string;
  category_id: string;
};

type QuizQuestionRow = {
  id: string;
  quiz_id: string;
  question: string;
  options: unknown;
  correct_answer: string;
  question_fr?: string | null;
  options_fr?: unknown;
  correct_answer_fr?: string | null;
  explanation?: string | null;
  is_active?: boolean | null;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

export function inferThemeKey(theme: string): string {
  const normalized = (theme || '').trim().toLowerCase();
  if (!normalized) return 'random';

  if (
    normalized.includes('aléatoire') ||
    normalized.includes('aleatoire') ||
    normalized.includes('random')
  )
    return 'random';
  if (normalized.includes('coran') || normalized.includes('quran')) return 'quran';
  if (normalized.includes('proph')) return 'prophets';
  if (
    normalized.includes('compagn') ||
    normalized.includes('compan') ||
    normalized.includes('sahaba') ||
    normalized.includes('musul')
  )
    return 'sahaba';
  if (normalized.includes('fiqh') || normalized.includes('juris')) return 'fiqh';
  if (
    normalized.includes('sunna') ||
    normalized.includes('sunnah') ||
    normalized.includes('seerah')
  )
    return 'seerah';
  if (normalized.includes('pili') || normalized.includes('pillar')) return 'fiqh';
  if (normalized.includes('foi') || normalized.includes('faith')) return 'fiqh';
  if (normalized.includes('ramadan')) return 'fiqh';

  return normalized;
}

export function normalizeThemeToCategorySlug(theme: string): string | null {
  const key = inferThemeKey(theme);
  if (key === 'random') return null;

  if (key === 'quran' || key === 'coran') return 'quran';
  if (key === 'prophet' || key === 'prophethood' || key === 'prophets' || key === 'prophete')
    return 'prophets';
  if (key === 'companions' || key === 'sahaba' || key === 'musulmans') return 'sahaba';
  if (key === 'fiqh') return 'fiqh';
  if (key === 'sunnah' || key === 'sunna' || key === 'seerah') return 'seerah';
  if (key === 'pillars' || key === 'piliers' || key === 'faith') return 'fiqh';

  return key || null;
}

function categoryNameToSlug(name: string): string {
  const n = name.trim().toLowerCase();
  if (n === 'quran') return 'quran';
  if (n === 'prophets') return 'prophets';
  if (n === 'sahaba') return 'sahaba';
  if (n === 'fiqh') return 'fiqh';
  if (n === 'seerah') return 'seerah';
  return n.replace(/[^a-z0-9]+/g, '_');
}

function mapQuestionRow(row: QuizQuestionRow, language: string): GameQuizQuestion {
  const useFr = language === 'fr';

  const question = useFr && row.question_fr ? row.question_fr : row.question;
  const optionsRaw = useFr && row.options_fr ? row.options_fr : row.options;
  const correctAnswer = useFr && row.correct_answer_fr ? row.correct_answer_fr : row.correct_answer;

  return {
    id: row.id,
    question,
    options: asStringArray(optionsRaw),
    correctAnswer,
    explanation: row.explanation ?? null,
  };
}

function isUsableQuestion(question: GameQuizQuestion): boolean {
  return question.options.length >= 2 && question.correctAnswer.trim().length > 0;
}

async function getAllCategories(): Promise<QuizCategoryRow[]> {
  const { data, error } = await supabase.from('quiz_categories').select('*');
  if (error) throw error;
  return (data || []) as QuizCategoryRow[];
}

async function getCategoryBySlug(slug: string): Promise<QuizCategoryRow | null> {
  const categories = await getAllCategories();
  const normalized = slug.trim().toLowerCase();

  const bySlug = categories.find((category) => {
    const categorySlug = (category.slug || categoryNameToSlug(category.name)).toLowerCase();
    return categorySlug === normalized;
  });

  return bySlug || null;
}

async function getQuestionsForCategory(categoryId: string): Promise<QuizQuestionRow[]> {
  const { data: quizzes, error: quizzesError } = await supabase
    .from('quizzes')
    .select('id, category_id')
    .eq('category_id', categoryId);

  if (quizzesError) throw quizzesError;

  const quizRows = (quizzes || []) as QuizRow[];
  if (quizRows.length === 0) return [];

  const quizIds = quizRows.map((quiz) => quiz.id);

  const { data: questionRows, error: questionsError } = await supabase
    .from('quiz_questions')
    .select('*')
    .in('quiz_id', quizIds);

  if (questionsError) throw questionsError;

  return (questionRows || []) as QuizQuestionRow[];
}

async function getQuestionsByIdsInternal(questionIds: string[]): Promise<QuizQuestionRow[]> {
  if (questionIds.length === 0) return [];

  const { data, error } = await supabase.from('quiz_questions').select('*').in('id', questionIds);

  if (error) throw error;

  return (data || []) as QuizQuestionRow[];
}

export const quizService = {
  async getQuestionsByIds({
    questionIds,
    language,
  }: {
    questionIds: string[];
    language: string;
  }): Promise<GameQuizQuestion[]> {
    const deduped = [...new Set(questionIds.filter(Boolean))];
    if (deduped.length === 0) return [];

    const rows = await getQuestionsByIdsInternal(deduped);
    const byId = new Map(rows.map((row) => [row.id, row]));

    return deduped
      .map((id) => byId.get(id))
      .filter((row): row is QuizQuestionRow => Boolean(row))
      .filter((row) => row.is_active !== false)
      .map((row) => mapQuestionRow(row, language))
      .filter(isUsableQuestion);
  },

  async getGameQuestions({
    theme,
    limit,
    language,
    questionIds,
  }: {
    theme: string;
    limit: number;
    language: string;
    questionIds?: string[];
  }): Promise<GameQuizQuestion[]> {
    if (questionIds && questionIds.length > 0) {
      return this.getQuestionsByIds({ questionIds, language });
    }

    const categorySlug = normalizeThemeToCategorySlug(theme);
    const safeLimit = Math.max(1, limit);

    if (categorySlug) {
      const category = await getCategoryBySlug(categorySlug);
      if (category) {
        const questionRows = await getQuestionsForCategory(category.id);
        const mapped = questionRows
          .filter((row) => row.is_active !== false)
          .map((row) => mapQuestionRow(row, language))
          .filter(isUsableQuestion);

        return shuffle(mapped).slice(0, safeLimit);
      }
    }

    const { data: randomRows, error: randomError } = await supabase
      .from('quiz_questions')
      .select('*')
      .limit(300);

    if (randomError) throw randomError;

    const mapped = ((randomRows || []) as QuizQuestionRow[])
      .filter((row) => row.is_active !== false)
      .map((row) => mapQuestionRow(row, language))
      .filter(isUsableQuestion);

    return shuffle(mapped).slice(0, safeLimit);
  },
};

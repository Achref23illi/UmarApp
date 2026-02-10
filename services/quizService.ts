import { supabase } from '@/lib/supabase';

export interface GameQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

type QuizCategoryRow = {
  id: string;
  name: string;
};

type QuizRow = {
  id: string;
};

type QuizQuestionRow = {
  id: string;
  question: string;
  options: unknown;
  correct_answer: string;
  question_fr: string | null;
  options_fr: unknown;
  correct_answer_fr: string | null;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function inferThemeKey(theme: string): string {
  const normalized = (theme || '').trim().toLowerCase();
  if (!normalized) return 'random';

  if (normalized.includes('aléatoire') || normalized.includes('aleatoire') || normalized.includes('random')) return 'random';
  if (normalized.includes('coran') || normalized.includes('quran')) return 'quran';
  if (normalized.includes('proph')) return 'prophet';
  if (normalized.includes('compagn') || normalized.includes('compan') || normalized.includes('sahaba') || normalized.includes('musul')) return 'companions';
  if (normalized.includes('fiqh') || normalized.includes('juris')) return 'fiqh';
  if (normalized.includes('sunna') || normalized.includes('sunnah') || normalized.includes('seerah')) return 'sunnah';
  if (normalized.includes('pili') || normalized.includes('pillar')) return 'pillars';
  if (normalized.includes('foi') || normalized.includes('faith')) return 'faith';
  if (normalized.includes('ramadan')) return 'ramadan';

  return normalized;
}

function themeKeyToCategoryName(themeKey: string): string | null {
  const key = inferThemeKey(themeKey);

  if (key === 'random') return null;
  if (key === 'quran' || key === 'coran') return 'Quran';
  if (key === 'prophet' || key === 'prophethood' || key === 'prophete') return 'Prophets';
  if (key === 'companions' || key === 'sahaba' || key === 'musulmans') return 'Sahaba';
  if (key === 'fiqh') return 'Fiqh';
  // Sunnah isn't a seeded category; closest is Seerah for now
  if (key === 'sunnah' || key === 'sunna' || key === 'seerah') return 'Seerah';
  // Pillars / Faith aren't seeded; default to Fiqh for now
  if (key === 'pillars' || key === 'piliers' || key === 'faith') return 'Fiqh';

  // Unknown key: fallback to random
  return null;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string');
  }
  return [];
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
  };
}

export const quizService = {
  getGameQuestions: async ({
    theme,
    limit,
    language,
  }: {
    theme: string;
    limit: number;
    language: string;
  }): Promise<GameQuizQuestion[]> => {
    const categoryName = themeKeyToCategoryName(theme);

    // If we can map theme -> category, pull from that category; otherwise pick random questions.
    if (categoryName) {
      const { data: category, error: categoryError } = await supabase
        .from('quiz_categories')
        .select('id, name')
        .eq('name', categoryName)
        .single();

      if (categoryError) throw categoryError;

      const categoryId = (category as QuizCategoryRow).id;
      const { data: quizzes, error: quizzesError } = await supabase
        .from('quizzes')
        .select('id')
        .eq('category_id', categoryId);

      if (quizzesError) throw quizzesError;

      const quizIds = ((quizzes ?? []) as QuizRow[]).map((q) => q.id);
      const quizId = quizIds.length > 0 ? quizIds[Math.floor(Math.random() * quizIds.length)] : null;

      if (quizId) {
        const { data: rows, error: questionsError } = await supabase
          .from('quiz_questions')
          .select('id, question, options, correct_answer, question_fr, options_fr, correct_answer_fr')
          .eq('quiz_id', quizId);

        if (questionsError) throw questionsError;

        const mapped = (rows ?? []).map((r) => mapQuestionRow(r as QuizQuestionRow, language));
        const usable = mapped.filter((q) => q.options.length >= 2 && q.correctAnswer.length > 0);
        return shuffle(usable).slice(0, Math.max(1, limit));
      }
    }

    // Random fallback: get up to 200 questions across quizzes
    const { data: randomRows, error: randomError } = await supabase
      .from('quiz_questions')
      .select('id, question, options, correct_answer, question_fr, options_fr, correct_answer_fr')
      .limit(200);

    if (randomError) throw randomError;

    const mapped = (randomRows ?? []).map((r) => mapQuestionRow(r as QuizQuestionRow, language));
    const usable = mapped.filter((q) => q.options.length >= 2 && q.correctAnswer.length > 0);
    return shuffle(usable).slice(0, Math.max(1, limit));
  },
};


import { supabase } from '@/lib/supabase';

export interface AdminQuizCategory {
  id: string;
  name: string;
  name_fr?: string | null;
  slug?: string | null;
}

export interface AdminQuiz {
  id: string;
  category_id: string;
  title: string;
  title_fr?: string | null;
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

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function normalizeQuestionRow(row: any): AdminQuizQuestion {
  return {
    id: row.id,
    quiz_id: row.quiz_id,
    question: row.question,
    question_fr: row.question_fr ?? null,
    options: asStringArray(row.options),
    options_fr: row.options_fr ? asStringArray(row.options_fr) : null,
    correct_answer: row.correct_answer,
    correct_answer_fr: row.correct_answer_fr ?? null,
    explanation: row.explanation ?? null,
    is_active: row.is_active !== false,
    created_at: row.created_at,
  };
}

function validateQuestionPayload(payload: {
  question: string;
  options: string[];
  correctAnswer: string;
}): void {
  if (!payload.question.trim()) {
    throw new Error('Question text is required');
  }

  if (payload.options.length < 4) {
    throw new Error('At least 4 options are required');
  }

  if (payload.options.some((option) => !option.trim())) {
    throw new Error('All options must be filled');
  }

  if (!payload.correctAnswer.trim()) {
    throw new Error('Correct answer is required');
  }

  if (!payload.options.includes(payload.correctAnswer)) {
    throw new Error('Correct answer must match one option');
  }
}

export const quizAdminService = {
  async getCategories(): Promise<AdminQuizCategory[]> {
    const { data, error } = await supabase
      .from('quiz_categories')
      .select('id, name, name_fr, slug')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []) as AdminQuizCategory[];
  },

  async getQuizzes(categoryId: string): Promise<AdminQuiz[]> {
    const { data, error } = await supabase
      .from('quizzes')
      .select('id, category_id, title, title_fr')
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as AdminQuiz[];
  },

  async getQuestions(quizId: string): Promise<AdminQuizQuestion[]> {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return ((data || []) as any[]).map(normalizeQuestionRow);
  },

  async createQuestion(input: {
    quizId: string;
    question: string;
    questionFr?: string;
    options: string[];
    optionsFr?: string[];
    correctAnswer: string;
    correctAnswerFr?: string;
    explanation?: string;
    isActive?: boolean;
  }): Promise<boolean> {
    validateQuestionPayload({
      question: input.question,
      options: input.options,
      correctAnswer: input.correctAnswer,
    });

    const { error } = await supabase.from('quiz_questions').insert({
      quiz_id: input.quizId,
      question: input.question.trim(),
      question_fr: input.questionFr?.trim() || null,
      options: input.options.map((option) => option.trim()),
      options_fr: input.optionsFr?.length ? input.optionsFr.map((option) => option.trim()) : null,
      correct_answer: input.correctAnswer.trim(),
      correct_answer_fr: input.correctAnswerFr?.trim() || null,
      explanation: input.explanation?.trim() || null,
      is_active: input.isActive ?? true,
    });

    if (error) throw error;
    return true;
  },

  async updateQuestion(
    questionId: string,
    input: {
      question: string;
      questionFr?: string;
      options: string[];
      optionsFr?: string[];
      correctAnswer: string;
      correctAnswerFr?: string;
      explanation?: string;
      isActive?: boolean;
    }
  ): Promise<boolean> {
    validateQuestionPayload({
      question: input.question,
      options: input.options,
      correctAnswer: input.correctAnswer,
    });

    const { error } = await supabase
      .from('quiz_questions')
      .update({
        question: input.question.trim(),
        question_fr: input.questionFr?.trim() || null,
        options: input.options.map((option) => option.trim()),
        options_fr: input.optionsFr?.length ? input.optionsFr.map((option) => option.trim()) : null,
        correct_answer: input.correctAnswer.trim(),
        correct_answer_fr: input.correctAnswerFr?.trim() || null,
        explanation: input.explanation?.trim() || null,
        is_active: input.isActive ?? true,
      })
      .eq('id', questionId);

    if (error) throw error;
    return true;
  },

  async deleteQuestion(questionId: string): Promise<boolean> {
    const { error } = await supabase.from('quiz_questions').delete().eq('id', questionId);
    if (error) throw error;
    return true;
  },
};

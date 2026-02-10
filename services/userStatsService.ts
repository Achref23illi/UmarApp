import { supabase } from '@/lib/supabase';

export interface UserStats {
  points: number;
  badges: string[]; // achievement titles
}

type UserQuizProgressRow = {
  score: number | null;
};

type UserAchievementRow = {
  achievements?: {
    title?: string | null;
  } | null;
};

export const userStatsService = {
  getUserStats: async (): Promise<UserStats> => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      return { points: 0, badges: [] };
    }

    const userId = session.session.user.id;

    const [{ data: progressRows, error: progressError }, { data: achievementRows, error: achievementsError }] =
      await Promise.all([
        supabase.from('user_quiz_progress').select('score').eq('user_id', userId),
        supabase
          .from('user_achievements')
          .select('achievements(title)')
          .eq('user_id', userId),
      ]);

    if (progressError) throw progressError;
    if (achievementsError) throw achievementsError;

    const points = ((progressRows ?? []) as UserQuizProgressRow[]).reduce((sum, row) => sum + (row.score ?? 0), 0);

    const badges = ((achievementRows ?? []) as UserAchievementRow[])
      .map((row) => row.achievements?.title)
      .filter((t): t is string => typeof t === 'string' && t.length > 0);

    return { points, badges };
  },
};


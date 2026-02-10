-- Track per-surah daily reads for Quran challenge verification.

CREATE TABLE IF NOT EXISTS public.user_challenge_daily_surah_reads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  level_id UUID REFERENCES public.challenge_levels(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL DEFAULT (now() at time zone 'utc')::date,
  surah_number INTEGER NOT NULL CHECK (surah_number BETWEEN 1 AND 114),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, level_id, completed_date, surah_number)
);

CREATE INDEX IF NOT EXISTS idx_user_challenge_daily_surah_reads_lookup
  ON public.user_challenge_daily_surah_reads (user_id, level_id, completed_date);

ALTER TABLE public.user_challenge_daily_surah_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily surah reads" ON public.user_challenge_daily_surah_reads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily surah reads" ON public.user_challenge_daily_surah_reads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily surah reads" ON public.user_challenge_daily_surah_reads
  FOR DELETE USING (auth.uid() = user_id);

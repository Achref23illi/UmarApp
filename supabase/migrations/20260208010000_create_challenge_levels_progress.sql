-- Challenge levels + user progress/settings tables

-- 1) Levels definition (shared for all users)
CREATE TABLE IF NOT EXISTS public.challenge_levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.challenge_categories(id) ON DELETE CASCADE,
  level_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  duration_days INTEGER NOT NULL DEFAULT 7,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(category_id, level_number)
);

ALTER TABLE public.challenge_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.challenge_levels FOR SELECT USING (true);

-- Seed 3 levels per category (generic for now)
DO $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN SELECT id FROM public.challenge_categories LOOP
    INSERT INTO public.challenge_levels (category_id, level_number, title, subtitle, description, duration_days) VALUES
      (c.id, 1, 'Niveau 1', 'Initiation', 'Apprendre les bases et commencer une pratique régulière.', 7),
      (c.id, 2, 'Niveau 2', 'Intermédiaire', 'Augmenter le volume et renforcer la constance.', 14),
      (c.id, 3, 'Niveau 3', 'Avancé', 'Maîtrise, profondeur, et consolidation des habitudes.', 21)
    ON CONFLICT (category_id, level_number) DO NOTHING;
  END LOOP;
END $$;

-- 2) Per-user settings for a level (stored from config screen)
CREATE TABLE IF NOT EXISTS public.user_challenge_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.challenge_categories(id) ON DELETE CASCADE,
  level_id UUID REFERENCES public.challenge_levels(id) ON DELETE CASCADE,
  days_count INTEGER NOT NULL DEFAULT 9,
  exercises_count INTEGER NOT NULL DEFAULT 2,
  duration_minutes INTEGER NOT NULL DEFAULT 5,
  selected_days TEXT[] NOT NULL DEFAULT '{}'::text[],
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  reminders_enabled BOOLEAN NOT NULL DEFAULT true,
  arabic_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, level_id)
);

ALTER TABLE public.user_challenge_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own challenge settings" ON public.user_challenge_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own challenge settings" ON public.user_challenge_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own challenge settings" ON public.user_challenge_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- 3) Per-user daily completions for a level (used for streak/progress)
CREATE TABLE IF NOT EXISTS public.user_challenge_daily_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  level_id UUID REFERENCES public.challenge_levels(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL DEFAULT (now() at time zone 'utc')::date,
  value INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, level_id, completed_date)
);

ALTER TABLE public.user_challenge_daily_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own challenge completions" ON public.user_challenge_daily_completions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own challenge completions" ON public.user_challenge_daily_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own challenge completions" ON public.user_challenge_daily_completions
  FOR DELETE USING (auth.uid() = user_id);

-- 4) Per-user level progress/status (active/locked/completed)
CREATE TABLE IF NOT EXISTS public.user_challenge_level_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  level_id UUID REFERENCES public.challenge_levels(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, level_id),
  CONSTRAINT user_challenge_level_progress_status_check CHECK (status IN ('active','locked','completed'))
);

ALTER TABLE public.user_challenge_level_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own level progress" ON public.user_challenge_level_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own level progress" ON public.user_challenge_level_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own level progress" ON public.user_challenge_level_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- 5) Challenge articles (for ContentTab)
CREATE TABLE IF NOT EXISTS public.challenge_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.challenge_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(category_id, title)
);

ALTER TABLE public.challenge_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.challenge_articles FOR SELECT USING (true);

-- Seed Quran articles (previously hardcoded in ContentTab)
DO $articles$
DECLARE
  quran_category_id UUID;
BEGIN
  SELECT id INTO quran_category_id FROM public.challenge_categories WHERE slug = 'quran' LIMIT 1;
  IF quran_category_id IS NOT NULL THEN
    INSERT INTO public.challenge_articles (category_id, title, content, sort_order) VALUES
      (quran_category_id, $$Qu'est-ce que le Coran ?$$, $$Le Coran est le livre sacré de l'islam, considéré par les musulmans comme la parole de Dieu (Allah) révélée au prophète Mahomet (Muhammad) par l'archange Gabriel (Jibril). Il est le texte central de la foi islamique et guide la vie des croyants.$$, 1),
      (quran_category_id, $$Comment le Coran a t-il était révélé ?$$, $$Le Coran a été révélé progressivement sur une période de 23 ans, commençant en 610 après J.C. lorsque le Prophète avait 40 ans. La révélation s'est faite par l'intermédiaire de l'archange Gabriel, parfois en réponse à des événements spécifiques ou des questions posées.$$, 2),
      (quran_category_id, $$Les adeptes du Coran.$$ , $$Les adeptes du Coran sont les musulmans qui suivent ses enseignements. Ils s'efforcent de comprendre, réciter et appliquer ses préceptes dans leur vie quotidienne, considérant le livre comme une source de guidée spirituelle, morale et juridique.$$ , 3),
      (quran_category_id, $$La méditation du Coran$$, $$La méditation du Coran (Tadabbur) est fortement encouragée. Elle consiste à réfléchir profondément sur le sens des versets, leurs implications et leurs leçons, plutôt que de simplement les lire sans compréhension. C'est un moyen de renforcer sa foi et sa connexion avec Dieu.$$ , 4),
      (quran_category_id, $$La mise en pratique de la science.$$ , $$En islam, la connaissance (Ilm) doit être suivie par l'action (Amal). Apprendre le Coran implique non seulement la mémorisation mais aussi l'application de ses enseignements. La science sans pratique est considérée comme stérile.$$ , 5),
      (quran_category_id, $$L'effort dans la récitation du Coran.$$ , $$L'effort pour bien réciter le Coran est récompensé. Le Prophète a dit que celui qui récite le Coran avec difficulté a une double récompense : une pour la lecture et une pour l'effort. La récitation embellie (Tajwid) est également une pratique importante.$$ , 6),
      (quran_category_id, $$La patience dans la recherche de la science.$$ , $$Acquérir la connaissance religieuse demande du temps et de la patience. Les érudits musulmans ont toujours valorisé la persévérance (Sabr) dans l'étude, car la compréhension profonde ne vient pas instantanément mais par l'étude continue et la réflexion.$$ , 7)
    ON CONFLICT (category_id, title) DO NOTHING;
  END IF;
END $articles$;


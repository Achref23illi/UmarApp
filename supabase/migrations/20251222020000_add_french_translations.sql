-- Add French columns to Quiz Categories
ALTER TABLE public.quiz_categories 
ADD COLUMN IF NOT EXISTS name_fr TEXT,
ADD COLUMN IF NOT EXISTS description_fr TEXT;

-- Add French columns to Quiz Titles
ALTER TABLE public.quizzes
ADD COLUMN IF NOT EXISTS title_fr TEXT;

-- Add French columns to Questions
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS question_fr TEXT,
ADD COLUMN IF NOT EXISTS options_fr JSONB,
ADD COLUMN IF NOT EXISTS correct_answer_fr TEXT;

-- Update existing Categories with French (manual update for seed data)
UPDATE public.quiz_categories SET name_fr = 'Coran', description_fr = 'Connaissance générale du Coran' WHERE name = 'Quran';
UPDATE public.quiz_categories SET name_fr = 'Prophètes', description_fr = 'Histoires des Prophètes' WHERE name = 'Prophets';
UPDATE public.quiz_categories SET name_fr = 'Compagnons', description_fr = 'Vies des Sahaba' WHERE name = 'Sahaba';
UPDATE public.quiz_categories SET name_fr = 'Fiqh', description_fr = 'Jurisprudence islamique' WHERE name = 'Fiqh';
UPDATE public.quiz_categories SET name_fr = 'Seerah', description_fr = 'Vie du Prophète (SAW)' WHERE name = 'Seerah';

-- Add use_quran_api column to challenge_categories
ALTER TABLE public.challenge_categories
ADD COLUMN IF NOT EXISTS use_quran_api BOOLEAN DEFAULT false;

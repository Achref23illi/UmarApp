-- Add is_approved column to posts table for moderation
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;

-- Update existing posts to be approved by default
UPDATE public.posts SET is_approved = true WHERE is_approved IS NULL;

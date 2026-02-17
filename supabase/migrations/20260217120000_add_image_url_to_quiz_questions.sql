-- Add image_url to quiz_questions
ALTER TABLE public.quiz_questions 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Comment on column
COMMENT ON COLUMN public.quiz_questions.image_url IS 'URL of the image associated with the question';

-- Create quiz-images storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('quiz-images', 'quiz-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for quiz-images
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'quiz-images' );

-- Allow authenticated users to upload images (for admin dashboard)
CREATE POLICY "Authenticated Upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'quiz-images' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated Update" 
ON storage.objects FOR UPDATE
USING ( bucket_id = 'quiz-images' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated Delete" 
ON storage.objects FOR DELETE
USING ( bucket_id = 'quiz-images' AND auth.role() = 'authenticated' );

-- Create quiz_categories table
CREATE TABLE IF NOT EXISTS public.quiz_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    icon TEXT, -- Ionicons name or image URL
    description TEXT,
    color TEXT, -- Gradient start/end or hex
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES public.quiz_categories(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    difficulty TEXT DEFAULT 'medium', -- 'easy', 'medium', 'hard'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create quiz_questions table
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of strings
    correct_answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.quiz_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- Create policies (Start with public read for now)
CREATE POLICY "Enable read access for all users" ON public.quiz_categories FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.quizzes FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.quiz_questions FOR SELECT USING (true);

-- Seed Categories
INSERT INTO public.quiz_categories (name, icon, description, color) VALUES
('Quran', 'book', 'Test your knowledge of the Holy Quran', '#8B5CF6'), -- Violet
('Prophets', 'people', 'Stories of the Prophets', '#6366F1'), -- Indigo
('Sahaba', 'school', 'Lives of the Companions', '#EC4899'), -- Pink
('Fiqh', 'library', 'Islamic Jurisprudence', '#10B981'), -- Emerald
('Seerah', 'time', 'Life of the Prophet (SAW)', '#F59E0B') -- Amber
ON CONFLICT (name) DO NOTHING;

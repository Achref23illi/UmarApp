-- Migration for Social Media Features

-- 1. Update Profiles Table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS gender TEXT, -- 'male' or 'female'
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- 2. Create Posts Table
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    content TEXT,
    image_url TEXT,
    type TEXT DEFAULT 'standard', -- 'standard' or 'janaza'
    metadata JSONB DEFAULT '{}'::jsonb, -- Stores janaza details like deceased_name, mosque_name
    created_at TIMESTAMPTZ DEFAULT NOW(),
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0
);

-- 3. Create Likes Table
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- 4. Create Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable RLS and Policies
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Allow public read access to posts
CREATE POLICY "Public read posts" ON public.posts FOR SELECT USING (true);
-- Allow authenticated users to create posts
CREATE POLICY "Auth create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Public read likes" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Auth create likes" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth delete likes" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Public read comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Auth create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);

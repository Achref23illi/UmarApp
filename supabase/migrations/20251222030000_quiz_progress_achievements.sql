-- Create User Quiz Progress Table (for resuming)
CREATE TABLE public.user_quiz_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    current_question_index INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, quiz_id)
);

-- Enable RLS for Progress
ALTER TABLE public.user_quiz_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress" ON public.user_quiz_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.user_quiz_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress update" ON public.user_quiz_progress
    FOR UPDATE USING (auth.uid() = user_id);


-- Create Achievements Table
CREATE TABLE public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    badge_icon TEXT NOT NULL, -- Ionicons name or URL
    criteria JSONB, -- e.g. {"type": "quiz_count", "target": 5}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for Achievements
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read achievements" ON public.achievements FOR SELECT USING (true);


-- Create User Achievements Table
CREATE TABLE public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, achievement_id)
);

-- Enable RLS for User Achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements" ON public.user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert user achievements" ON public.user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL); -- Allow service role if needed

-- Seed Initial Achievements
INSERT INTO public.achievements (title, description, badge_icon, criteria) VALUES
('First Steps', 'Complete your first quiz', 'footsteps', '{"type": "quiz_count", "target": 1}'),
('Knowledge Seeker', 'Complete 5 quizzes', 'book', '{"type": "quiz_count", "target": 5}'),
('Scholar', 'Score 100% on a quiz', 'school', '{"type": "perfect_score", "target": 1}'),
('Consistent Learner', 'Log in for 7 days', 'flame', '{"type": "streak", "target": 7}');

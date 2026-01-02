-- Insert Quizzes for Categories
-- We need to look up IDs, but since we can't easily do that in a simple script without variables in SQL editor (sometimes), 
-- we will use a DO block or just crude insertion if we assume names are unique.

DO $$
DECLARE
    quran_id UUID;
    prophets_id UUID;
    sahaba_id UUID;
    quiz_id UUID;
BEGIN
    SELECT id INTO quran_id FROM public.quiz_categories WHERE name = 'Quran' LIMIT 1;
    SELECT id INTO prophets_id FROM public.quiz_categories WHERE name = 'Prophets' LIMIT 1;
    SELECT id INTO sahaba_id FROM public.quiz_categories WHERE name = 'Sahaba' LIMIT 1;

    -- Quran Quiz
    IF quran_id IS NOT NULL THEN
        INSERT INTO public.quizzes (category_id, title) VALUES (quran_id, 'General Quran Knowledge') RETURNING id INTO quiz_id;
        
        INSERT INTO public.quiz_questions (quiz_id, question, options, correct_answer) VALUES
        (quiz_id, 'How many Surahs are in the Quran?', '["110", "112", "114", "115"]'::jsonb, '114'),
        (quiz_id, 'Which Surah is known as the Heart of the Quran?', '["Surah Yasin", "Surah Rahman", "Surah Mulk", "Surah Fatiha"]'::jsonb, 'Surah Yasin'),
        (quiz_id, 'What is the longest Surah in the Quran?', '["Surah Al-Imran", "Surah Al-Baqarah", "Surah An-Nisa", "Surah Al-Maidah"]'::jsonb, 'Surah Al-Baqarah'),
        (quiz_id, 'Which Surah does not start with Bismillah?', '["Surah At-Tawbah", "Surah Al-Anfal", "Surah Yunus", "Surah Hud"]'::jsonb, 'Surah At-Tawbah'),
        (quiz_id, 'What is the shortest Surah in the Quran?', '["Surah Al-Ikhlas", "Surah Al-Kawthar", "Surah Al-Nasr", "Surah Al-Asr"]'::jsonb, 'Surah Al-Kawthar');
    END IF;

    -- Prophets Quiz
    IF prophets_id IS NOT NULL THEN
        INSERT INTO public.quizzes (category_id, title) VALUES (prophets_id, 'Stories of Prophets') RETURNING id INTO quiz_id;
        
        INSERT INTO public.quiz_questions (quiz_id, question, options, correct_answer) VALUES
        (quiz_id, 'Who was the first Prophet?', '["Prophet Nuh (AS)", "Prophet Ibrahim (AS)", "Prophet Adam (AS)", "Prophet Musa (AS)"]'::jsonb, 'Prophet Adam (AS)'),
        (quiz_id, 'Which Prophet built the Kaaba with his son?', '["Prophet Musa (AS)", "Prophet Isa (AS)", "Prophet Ibrahim (AS)", "Prophet Nuh (AS)"]'::jsonb, 'Prophet Ibrahim (AS)'),
        (quiz_id, 'Which Prophet was swallowed by a whale?', '["Prophet Yunus (AS)", "Prophet Yusuf (AS)", "Prophet Musa (AS)", "Prophet Yahya (AS)"]'::jsonb, 'Prophet Yunus (AS)'),
        (quiz_id, 'Which Prophet spoke as an infant?', '["Prophet Isa (AS)", "Prophet Musa (AS)", "Prophet Yahya (AS)", "Prophet Yusuf (AS)"]'::jsonb, 'Prophet Isa (AS)'),
        (quiz_id, 'Known as Khalilullah (Friend of Allah)?', '["Prophet Muhammad (SAW)", "Prophet Ibrahim (AS)", "Prophet Musa (AS)", "Prophet Isa (AS)"]'::jsonb, 'Prophet Ibrahim (AS)');
    END IF;

    -- Sahaba Quiz
    IF sahaba_id IS NOT NULL THEN
        INSERT INTO public.quizzes (category_id, title) VALUES (sahaba_id, 'Lives of the Sahaba') RETURNING id INTO quiz_id;
        
        INSERT INTO public.quiz_questions (quiz_id, question, options, correct_answer) VALUES
        (quiz_id, 'Who was the first Caliph of Islam?', '["Umar ibn Al-Khattab (RA)", "Ali ibn Abi Talib (RA)", "Abu Bakr As-Siddiq (RA)", "Uthman ibn Affan (RA)"]'::jsonb, 'Abu Bakr As-Siddiq (RA)'),
        (quiz_id, 'Who was known as the Sword of Allah?', '["Khalid ibn Al-Walid (RA)", "Ali ibn Abi Talib (RA)", "Hamza ibn Abdul-Muttalib (RA)", "Umar ibn Al-Khattab (RA)"]'::jsonb, 'Khalid ibn Al-Walid (RA)'),
        (quiz_id, 'Which Sahabi compiled the Quran into a book?', '["Abu Bakr As-Siddiq (RA)", "Umar ibn Al-Khattab (RA)", "Uthman ibn Affan (RA)", "Ali ibn Abi Talib (RA)"]'::jsonb, 'Abu Bakr As-Siddiq (RA)'),
        (quiz_id, 'Who was the first Muezzin of Islam?', '["Bilal ibn Rabah (RA)", "Abdullah ibn Umm Maktum (RA)", "Abu Hurairah (RA)", "Salman Al-Farsi (RA)"]'::jsonb, 'Bilal ibn Rabah (RA)');
    END IF;

END $$;

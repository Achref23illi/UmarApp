-- Update Quizzes with French Titles
UPDATE public.quizzes SET title_fr = 'Connaissance Générale du Coran' WHERE title = 'General Quran Knowledge';
UPDATE public.quizzes SET title_fr = 'Histoires des Prophètes' WHERE title = 'Stories of Prophets';
UPDATE public.quizzes SET title_fr = 'Vies des Sahaba' WHERE title = 'Lives of the Sahaba';

-- Update Questions with French Content using exact string matching from English seed
-- Quran Questions
UPDATE public.quiz_questions 
SET question_fr = 'Combien de Sourates y a-t-il dans le Coran ?',
    options_fr = '["110", "112", "114", "115"]'::jsonb,
    correct_answer_fr = '114'
WHERE question = 'How many Surahs are in the Quran?';

UPDATE public.quiz_questions 
SET question_fr = 'Quelle Sourate est connue comme le Cœur du Coran ?',
    options_fr = '["Sourate Yasin", "Sourate Rahman", "Sourate Mulk", "Sourate Fatiha"]'::jsonb,
    correct_answer_fr = 'Sourate Yasin'
WHERE question = 'Which Surah is known as the Heart of the Quran?';

UPDATE public.quiz_questions 
SET question_fr = 'Quelle est la plus longue Sourate du Coran ?',
    options_fr = '["Sourate Al-Imran", "Sourate Al-Baqarah", "Sourate An-Nisa", "Sourate Al-Maidah"]'::jsonb,
    correct_answer_fr = 'Sourate Al-Baqarah'
WHERE question = 'What is the longest Surah in the Quran?';

UPDATE public.quiz_questions 
SET question_fr = 'Quelle Sourate ne commence pas par Bismillah ?',
    options_fr = '["Sourate At-Tawbah", "Sourate Al-Anfal", "Sourate Yunus", "Sourate Hud"]'::jsonb,
    correct_answer_fr = 'Sourate At-Tawbah'
WHERE question = 'Which Surah does not start with Bismillah?';

UPDATE public.quiz_questions 
SET question_fr = 'Quelle est la plus courte Sourate du Coran ?',
    options_fr = '["Sourate Al-Ikhlas", "Sourate Al-Kawthar", "Sourate Al-Nasr", "Sourate Al-Asr"]'::jsonb,
    correct_answer_fr = 'Sourate Al-Kawthar'
WHERE question = 'What is the shortest Surah in the Quran?';


-- Prophets Questions
UPDATE public.quiz_questions 
SET question_fr = 'Qui fut le premier Prophète ?',
    options_fr = '["Prophète Nuh (AS)", "Prophète Ibrahim (AS)", "Prophète Adam (AS)", "Prophète Musa (AS)"]'::jsonb,
    correct_answer_fr = 'Prophète Adam (AS)'
WHERE question = 'Who was the first Prophet?';

UPDATE public.quiz_questions 
SET question_fr = 'Quel Prophète a construit la Kaaba avec son fils ?',
    options_fr = '["Prophète Musa (AS)", "Prophète Isa (AS)", "Prophète Ibrahim (AS)", "Prophète Nuh (AS)"]'::jsonb,
    correct_answer_fr = 'Prophète Ibrahim (AS)'
WHERE question = 'Which Prophet built the Kaaba with his son?';

UPDATE public.quiz_questions 
SET question_fr = 'Quel Prophète a été avalé par une baleine ?',
    options_fr = '["Prophète Yunus (AS)", "Prophète Yusuf (AS)", "Prophète Musa (AS)", "Prophète Yahya (AS)"]'::jsonb,
    correct_answer_fr = 'Prophète Yunus (AS)'
WHERE question = 'Which Prophet was swallowed by a whale?';

UPDATE public.quiz_questions 
SET question_fr = 'Quel Prophète a parlé étant nourrisson ?',
    options_fr = '["Prophète Isa (AS)", "Prophète Musa (AS)", "Prophète Yahya (AS)", "Prophète Yusuf (AS)"]'::jsonb,
    correct_answer_fr = 'Prophète Isa (AS)'
WHERE question = 'Which Prophet spoke as an infant?';

UPDATE public.quiz_questions 
SET question_fr = 'Connu sous le nom de Khalilullah (Ami d''Allah) ?',
    options_fr = '["Prophète Muhammad (SAW)", "Prophète Ibrahim (AS)", "Prophète Musa (AS)", "Prophète Isa (AS)"]'::jsonb,
    correct_answer_fr = 'Prophète Ibrahim (AS)'
WHERE question = 'Known as Khalilullah (Friend of Allah)?';


-- Sahaba Questions
UPDATE public.quiz_questions 
SET question_fr = 'Qui fut le premier Calife de l''Islam ?',
    options_fr = '["Umar ibn Al-Khattab (RA)", "Ali ibn Abi Talib (RA)", "Abu Bakr As-Siddiq (RA)", "Uthman ibn Affan (RA)"]'::jsonb,
    correct_answer_fr = 'Abu Bakr As-Siddiq (RA)'
WHERE question = 'Who was the first Caliph of Islam?';

UPDATE public.quiz_questions 
SET question_fr = 'Qui était connu comme l''Épée d''Allah ?',
    options_fr = '["Khalid ibn Al-Walid (RA)", "Ali ibn Abi Talib (RA)", "Hamza ibn Abdul-Muttalib (RA)", "Umar ibn Al-Khattab (RA)"]'::jsonb,
    correct_answer_fr = 'Khalid ibn Al-Walid (RA)'
WHERE question = 'Who was known as the Sword of Allah?';

UPDATE public.quiz_questions 
SET question_fr = 'Quel Sahabi a compilé le Coran dans un livre ?',
    options_fr = '["Abu Bakr As-Siddiq (RA)", "Umar ibn Al-Khattab (RA)", "Uthman ibn Affan (RA)", "Ali ibn Abi Talib (RA)"]'::jsonb,
    correct_answer_fr = 'Abu Bakr As-Siddiq (RA)'
WHERE question = 'Which Sahabi compiled the Quran into a book?';

UPDATE public.quiz_questions 
SET question_fr = 'Qui fut le premier Muezzin de l''Islam ?',
    options_fr = '["Bilal ibn Rabah (RA)", "Abdullah ibn Umm Maktum (RA)", "Abu Hurairah (RA)", "Salman Al-Farsi (RA)"]'::jsonb,
    correct_answer_fr = 'Bilal ibn Rabah (RA)'
WHERE question = 'Who was the first Muezzin of Islam?';

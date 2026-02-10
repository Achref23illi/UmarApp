-- Create challenge_categories table
CREATE TABLE IF NOT EXISTS public.challenge_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    duration TEXT NOT NULL,
    levels TEXT NOT NULL,
    prerequisite TEXT NOT NULL,
    icon_name TEXT NOT NULL,
    image_url TEXT,
    is_locked BOOLEAN DEFAULT false NOT NULL,
    color TEXT DEFAULT '#000000' NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.challenge_categories ENABLE ROW LEVEL SECURITY;

-- Public read access (categories are visible to everyone)
CREATE POLICY "Enable read access for all users" ON public.challenge_categories FOR SELECT USING (true);

-- Seed categories (mirrors the previous CHALLENGES_DATA)
INSERT INTO public.challenge_categories (
  slug,
  title,
  subtitle,
  description,
  duration,
  levels,
  prerequisite,
  icon_name,
  image_url,
  is_locked,
  color,
  sort_order
) VALUES
(
  'quran',
  'Coran',
  NULL,
  NULL,
  '3 semaines',
  '3 niveaux',
  'Aucun',
  'book-outline',
  'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=400&q=80',
  false,
  '#000',
  1
),
(
  'salat_obligatoire',
  'Salat',
  'Obligatoire',
  'La salât constitue certainement la plus importante et bénéfique des adorations.
«Et accomplissez la Prière, et acquittez la Zakat, et inclinez-vous avec ceux qui s’inclinent.» (Sourate 2, Verset 43)',
  '3 semaines',
  '3 niveaux',
  'Aucun',
  'person-outline',
  'https://images.unsplash.com/photo-1564121211835-e88c852648ab?w=400&q=80',
  false,
  '#000',
  2
),
(
  'salat_surerogatoire',
  'Salat',
  'Surérogatoire',
  'La salât constitue certainement la plus importante et bénéfique des adorations.
«Et accomplissez la Prière, et acquittez la Zakat, et inclinez-vous avec ceux qui s’inclinent.» (Sourate 2, Verset 43)',
  '3 semaines',
  '3 niveaux',
  'Salat obligatoire',
  'person-outline',
  'https://images.unsplash.com/photo-1564121211835-e88c852648ab?w=400&q=80',
  true,
  '#000',
  3
),
(
  'jeune',
  'Jeûne',
  NULL,
  '« Ô les croyants! On vous a prescrit as-Siyâm comme on l’a prescrit à ceux d’avant vous, ainsi atteindrez-vous la piété, pendant un nombre déterminé de jours »
(Sourate 2, Verset 183)',
  '3 semaines',
  '3 niveaux',
  'Aucun',
  'restaurant-outline',
  'https://images.unsplash.com/photo-1585675373807-6f0227926e85?w=400&q=80',
  false,
  '#000',
  4
),
(
  'sadaqa',
  'Sadaqa',
  NULL,
  NULL,
  '3 semaines',
  '3 niveaux',
  'Aucun',
  'heart-outline',
  'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400&q=80',
  false,
  '#000',
  5
),
(
  'perso',
  '!? Perso',
  NULL,
  NULL,
  '3 semaines',
  '3 niveaux',
  'Aucun',
  'help-outline',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&q=80',
  false,
  '#000',
  6
),
(
  'adab',
  'Adab',
  NULL,
  NULL,
  '3 semaines',
  '3 niveaux',
  'Aucun',
  'people-outline',
  'https://images.unsplash.com/photo-1519818804723-5e921d6d8412?w=400&q=80',
  false,
  '#000',
  7
),
(
  'education',
  'Education',
  NULL,
  NULL,
  '3 semaines',
  '3 niveaux',
  'Aucun',
  'school-outline',
  'https://images.unsplash.com/photo-1588614560706-921d4c22cc7b?w=400&q=80',
  false,
  '#000',
  8
)
ON CONFLICT (slug) DO NOTHING;


-- Seed real challenges: Coran, Salat, Sadaqa
-- - Keep only 3 categories (delete others)
-- - Upgrade challenge levels with real titles/descriptions
-- - Seed rich educational + level-specific articles
-- - Add optional level_id on challenge_articles to support per-level content

-- 1) Schema tweak: allow articles to be linked to a level
ALTER TABLE public.challenge_articles
  ADD COLUMN IF NOT EXISTS level_id UUID REFERENCES public.challenge_levels(id) ON DELETE CASCADE;

-- Replace the old uniqueness (category_id, title) with uniqueness that supports:
-- - Category-wide articles (level_id IS NULL): unique per category
-- - Level-specific articles (level_id IS NOT NULL): unique per level
ALTER TABLE public.challenge_articles
  DROP CONSTRAINT IF EXISTS challenge_articles_category_id_title_key;

CREATE UNIQUE INDEX IF NOT EXISTS challenge_articles_unique_category_title_when_no_level
  ON public.challenge_articles (category_id, title)
  WHERE level_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS challenge_articles_unique_level_title_when_level_present
  ON public.challenge_articles (level_id, title)
  WHERE level_id IS NOT NULL;

-- 2) Keep only 3 categories
DELETE FROM public.challenge_categories
WHERE slug IN ('salat_surerogatoire', 'jeune', 'perso', 'adab', 'education');

-- 3) Update the remaining categories (display data)
UPDATE public.challenge_categories
SET
  title = 'Coran',
  subtitle = NULL,
  description = $$Reviens au Livre d’Allah et construis une habitude de lecture quotidienne.

« أَفَلَا يَتَدَبَّرُونَ الْقُرْآنَ » — “Ne méditent-ils donc pas le Coran ?” (Sourate 4, Verset 82).$$,
  duration = '3 semaines',
  levels = '3 niveaux',
  prerequisite = 'Aucun',
  icon_name = 'book-outline',
  image_url = 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=800&q=80',
  is_locked = false,
  color = '#670FA4',
  sort_order = 1
WHERE slug = 'quran';

UPDATE public.challenge_categories
SET
  title = 'Salat',
  subtitle = NULL,
  description = $$La salat est le pilier de la religion. Construis ta constance, étape par étape.

« إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا » (Sourate 4, Verset 103).$$,
  duration = '3 semaines',
  levels = '3 niveaux',
  prerequisite = 'Aucun',
  icon_name = 'time-outline',
  image_url = 'https://images.unsplash.com/photo-1564121211835-e88c852648ab?w=800&q=80',
  is_locked = false,
  color = '#F5C661',
  sort_order = 2
WHERE slug = 'salat_obligatoire';

UPDATE public.challenge_categories
SET
  title = 'Sadaqa',
  subtitle = NULL,
  description = $$La sadaqa (الصدقة) purifie les biens et le cœur. Chaque jour, un geste simple.

Le Prophète ﷺ a dit : “La sadaqa éteint les péchés comme l’eau éteint le feu.”$$,
  duration = '3 semaines',
  levels = '3 niveaux',
  prerequisite = 'Aucun',
  icon_name = 'heart-outline',
  image_url = 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&q=80',
  is_locked = false,
  color = '#4CAF50',
  sort_order = 3
WHERE slug = 'sadaqa';

-- 4) Seed real level titles/descriptions + rich content
DO $seed$
DECLARE
  quran_category_id UUID;
  salat_category_id UUID;
  sadaqa_category_id UUID;

  q_l1 UUID;
  q_l2 UUID;
  q_l3 UUID;

  s_l1 UUID;
  s_l2 UUID;
  s_l3 UUID;

  d_l1 UUID;
  d_l2 UUID;
  d_l3 UUID;
BEGIN
  SELECT id INTO quran_category_id FROM public.challenge_categories WHERE slug = 'quran' LIMIT 1;
  SELECT id INTO salat_category_id FROM public.challenge_categories WHERE slug = 'salat_obligatoire' LIMIT 1;
  SELECT id INTO sadaqa_category_id FROM public.challenge_categories WHERE slug = 'sadaqa' LIMIT 1;

  -- Quran levels
  IF quran_category_id IS NOT NULL THEN
    INSERT INTO public.challenge_levels (category_id, level_number, title, subtitle, description, duration_days)
    VALUES
      (
        quran_category_id,
        1,
        'Niveau 1',
        'Les Sourates Courtes',
        $$Objectif : renouer avec la lecture quotidienne à travers les sourates courtes (جزء عمّ).
Lis et médite en français, et ajoute un peu d’arabe si tu peux.$$,
        7
      ),
      (
        quran_category_id,
        2,
        'Niveau 2',
        'Les Sourates Essentielles',
        $$Objectif : lire des sourates majeures (Al-Mulk, Al-Kahf, Ya-Sin…) et renforcer la constance.
On cherche la régularité, pas la perfection.$$,
        14
      ),
      (
        quran_category_id,
        3,
        'Niveau 3',
        'Lecture Quotidienne',
        $$Objectif : installer une routine stable (10–15 min/jour) et avancer dans les sourates longues.
Tu construis une habitude durable.$$,
        21
      )
    ON CONFLICT (category_id, level_number)
    DO UPDATE SET
      title = EXCLUDED.title,
      subtitle = EXCLUDED.subtitle,
      description = EXCLUDED.description,
      duration_days = EXCLUDED.duration_days;

    SELECT id INTO q_l1 FROM public.challenge_levels WHERE category_id = quran_category_id AND level_number = 1 LIMIT 1;
    SELECT id INTO q_l2 FROM public.challenge_levels WHERE category_id = quran_category_id AND level_number = 2 LIMIT 1;
    SELECT id INTO q_l3 FROM public.challenge_levels WHERE category_id = quran_category_id AND level_number = 3 LIMIT 1;
  END IF;

  -- Salat levels
  IF salat_category_id IS NOT NULL THEN
    INSERT INTO public.challenge_levels (category_id, level_number, title, subtitle, description, duration_days)
    VALUES
      (
        salat_category_id,
        1,
        'Niveau 1',
        'Les 5 Prières',
        $$Objectif : préserver les 5 prières à l’heure (même imparfaitement).
Petit pas, grande baraka.$$,
        7
      ),
      (
        salat_category_id,
        2,
        'Niveau 2',
        'Les Sunan Rawatib',
        $$Objectif : ajouter progressivement les prières surérogatoires régulières (السنن الرواتب).
Stabilise d’abord les obligations.$$,
        14
      ),
      (
        salat_category_id,
        3,
        'Niveau 3',
        'Les Prières Surérogatoires',
        $$Objectif : renforcer ton lien avec Allah par des prières volontaires (witr, duha, tahajjud).
Une vie plus lumineuse, une foi plus forte.$$,
        21
      )
    ON CONFLICT (category_id, level_number)
    DO UPDATE SET
      title = EXCLUDED.title,
      subtitle = EXCLUDED.subtitle,
      description = EXCLUDED.description,
      duration_days = EXCLUDED.duration_days;

    SELECT id INTO s_l1 FROM public.challenge_levels WHERE category_id = salat_category_id AND level_number = 1 LIMIT 1;
    SELECT id INTO s_l2 FROM public.challenge_levels WHERE category_id = salat_category_id AND level_number = 2 LIMIT 1;
    SELECT id INTO s_l3 FROM public.challenge_levels WHERE category_id = salat_category_id AND level_number = 3 LIMIT 1;
  END IF;

  -- Sadaqa levels
  IF sadaqa_category_id IS NOT NULL THEN
    INSERT INTO public.challenge_levels (category_id, level_number, title, subtitle, description, duration_days)
    VALUES
      (
        sadaqa_category_id,
        1,
        'Niveau 1',
        'La Bonté Quotidienne',
        $$Objectif : multiplier les petites sadaqat du quotidien (un sourire, une aide, un bon mot).
La constance avant la quantité.$$,
        7
      ),
      (
        sadaqa_category_id,
        2,
        'Niveau 2',
        'Le Don Régulier',
        $$Objectif : instaurer un don régulier (même minime) et un service aux autres.
“Le meilleur acte est celui qui dure.”$$,
        14
      ),
      (
        sadaqa_category_id,
        3,
        'Niveau 3',
        'La Sadaqa Jariya',
        $$Objectif : construire une sadaqa continue (الصدقة الجارية) : apprendre, enseigner, financer un bien durable.
L’impact qui reste après toi.$$,
        21
      )
    ON CONFLICT (category_id, level_number)
    DO UPDATE SET
      title = EXCLUDED.title,
      subtitle = EXCLUDED.subtitle,
      description = EXCLUDED.description,
      duration_days = EXCLUDED.duration_days;

    SELECT id INTO d_l1 FROM public.challenge_levels WHERE category_id = sadaqa_category_id AND level_number = 1 LIMIT 1;
    SELECT id INTO d_l2 FROM public.challenge_levels WHERE category_id = sadaqa_category_id AND level_number = 2 LIMIT 1;
    SELECT id INTO d_l3 FROM public.challenge_levels WHERE category_id = sadaqa_category_id AND level_number = 3 LIMIT 1;
  END IF;

  -- Seed articles (delete then insert to keep this migration deterministic)

  -- Quran articles
  IF quran_category_id IS NOT NULL THEN
    DELETE FROM public.challenge_articles WHERE category_id = quran_category_id;

    INSERT INTO public.challenge_articles (category_id, level_id, title, content, sort_order) VALUES
      (quran_category_id, NULL, $$Qu'est-ce que le Coran ?$$, $$Le Coran est la parole d’Allah révélée au Prophète Muhammad ﷺ par Jibril (عليه السلام). C’est une guidée : on le récite, on le comprend, puis on l’applique.

Conseil : même 5 minutes par jour valent mieux qu’une grande lecture rare.$$, 1),
      (quran_category_id, NULL, $$Comment le Coran a-t-il été révélé ?$$, $$La révélation a été progressive sur 23 ans. Parfois en réponse à une situation, parfois pour éduquer et purifier les cœurs.

Cette progressivité nous apprend la patience et la constance : avance pas à pas.$$, 2),
      (quran_category_id, NULL, $$Les mérites de la lecture du Coran$$, $$Chaque lettre lue est une récompense. Et celui qui lit avec difficulté est doublement récompensé : pour la lecture et pour l’effort.

Fais de la lecture un rendez-vous quotidien : après Fajr, après ‘Isha, ou à un moment fixe.$$, 3),
      (quran_category_id, NULL, $$Le Tajwid : embellir sa récitation$$, $$Le tajwid (التجويد) aide à réciter correctement et avec beauté. Commence simple : écoute un bon lecteur, répète, puis apprends une règle à la fois.

But : respecter le texte et améliorer progressivement.$$, 4),
      (quran_category_id, NULL, $$La méditation du Coran (التدبر)$$, $$La lecture n’est pas seulement une récitation. Le tadabbur (التدبر) consiste à réfléchir au sens : “Que m’enseigne ce verset aujourd’hui ?”

Astuce : choisis un verset, lis sa traduction, puis écris une action concrète.$$, 5),
      (quran_category_id, NULL, $$Les sourates protectrices (المعوذات)$$, $$Al-Ikhlâs, Al-Falaq et An-Nâs sont appelées “les protectrices”. On les récite matin/soir, et avant de dormir.

Objectif : les lire en arabe et en comprendre le sens en français.$$, 6),
      (quran_category_id, NULL, $$Sourate Al-Fatiha : la mère du Coran$$, $$Al-Fatiha est au cœur de la prière. Comprendre ses sens transforme ta salat : louange, demande de guidée, engagement sur la voie droite.

Prends le temps de la relire lentement et d’en méditer chaque phrase.$$, 7),

      -- Level-specific Quran content
      (quran_category_id, q_l1, $$Niveau 1 — Méthode simple (7 jours)$$, $$Lis chaque jour des sourates courtes. Priorité : régularité.

1) Lis en français
2) Récite 1 fois en arabe si possible
3) Note une leçon (1 phrase)

Dua : « اللهم اجعل القرآن ربيع قلبي » — “Ô Allah, fais du Coran le printemps de mon cœur.”$$, 101),
      (quran_category_id, q_l2, $$Niveau 2 — Sourates clés$$, $$Certaines sourates reviennent souvent dans la tradition :

- Al-Mulk (67)
- Al-Kahf (18) (le vendredi)
- Ya-Sin (36)

But : les lire avec présence, et retenir 2–3 messages par sourate.$$, 102),
      (quran_category_id, q_l3, $$Niveau 3 — Routine durable$$, $$Choisis un créneau fixe (10–15 minutes). Si tu rates un jour, reprends sans culpabilité.

Règle d’or : ne brise pas la chaîne deux jours d’affilée.$$, 103);
  END IF;

  -- Salat articles
  IF salat_category_id IS NOT NULL THEN
    DELETE FROM public.challenge_articles WHERE category_id = salat_category_id;

    INSERT INTO public.challenge_articles (category_id, level_id, title, content, sort_order) VALUES
      (salat_category_id, NULL, $$L'importance de la Salat en Islam$$, $$La salat est le premier acte sur lequel le serviteur sera jugé. Elle structure la journée et relie le cœur à Allah.

Astuce : protège d’abord une prière (Fajr), puis consolide les autres.$$, 1),
      (salat_category_id, NULL, $$Les conditions de la prière (شروط الصلاة)$$, $$Parmi les conditions : être en état de purification, couvrir la ‘awra, faire face à la qibla, prier à l’heure, et avoir l’intention (النية).

Commence par maîtriser ce socle : le reste devient plus facile.$$, 2),
      (salat_category_id, NULL, $$Les piliers de la prière (أركان الصلاة)$$, $$Les piliers sont ce sans quoi la prière n’est pas valide : takbir d’ouverture, récitation, inclinaison, prosternations, assise finale, etc.

Approche : apprends 1 pilier par jour, puis révise régulièrement.$$, 3),
      (salat_category_id, NULL, $$Le Wudu : purification avant la prière$$, $$Le wudu est une lumière. Apprends les étapes, puis rends-le “conscient” : prends 30 secondes pour être présent.

Objectif : wudu calme, prière calme.$$, 4),
      (salat_category_id, NULL, $$Les horaires des 5 prières$$, $$Comprendre les horaires aide à s’organiser : bloque des rappels, évite les réunions sur ces créneaux, prépare-toi 5 minutes avant.

Petite habitude : dès l’adhan, fais une mini-transition (pause, wudu, intention).$$, 5),
      (salat_category_id, NULL, $$Le Khushu : la concentration dans la prière$$, $$Le khushu (الخشوع) est un combat noble. Il vient avec : la compréhension, la lenteur, et l’éloignement des distractions.

Commence par une seule chose : ralentir Al-Fatiha.$$, 6),
      (salat_category_id, NULL, $$Les sunan rawatib (السنن الرواتب)$$, $$Ce sont des prières régulières autour des obligations. Elles complètent et protègent les fard.

Stratégie : commence par 2 rak‘at avant Fajr, puis ajoute progressivement.$$, 7),

      -- Level-specific Salat content
      (salat_category_id, s_l1, $$Niveau 1 — Checklist quotidienne$$, $$Objectif : 5 prières.

1) Adhan = stop
2) Wudu (même rapide)
3) 2 minutes de concentration

Si tu rates : fais le rattrapage (قضاء) et reprends le lendemain.$$, 101),
      (salat_category_id, s_l2, $$Niveau 2 — Progression douce$$, $$Ajoute les rawatib progressivement.

Semaine 1 : 2 rak‘at avant Fajr
Semaine 2 : + 2 rak‘at après Dhuhr

But : stabilité.$$, 102),
      (salat_category_id, s_l3, $$Niveau 3 — Volontaires$$, $$Witr : à préserver chaque nuit.
Duha : quand tu peux.
Tahajjud : même 2 rak‘at.

Un petit geste constant vaut mieux qu’un grand geste rare.$$, 103);
  END IF;

  -- Sadaqa articles
  IF sadaqa_category_id IS NOT NULL THEN
    DELETE FROM public.challenge_articles WHERE category_id = sadaqa_category_id;

    INSERT INTO public.challenge_articles (category_id, level_id, title, content, sort_order) VALUES
      (sadaqa_category_id, NULL, $$La Sadaqa en Islam (الصدقة)$$, $$La sadaqa est tout bien fait pour Allah : un don, une aide, un conseil, un sourire.

Commence par “petit mais tous les jours”.$$, 1),
      (sadaqa_category_id, NULL, $$Les formes de Sadaqa$$, $$Exemples : aider quelqu’un, enlever un obstacle du chemin, enseigner une connaissance, donner à manger, soutenir une cause.

Choisis une forme compatible avec ta vie : elle deviendra naturelle.$$, 2),
      (sadaqa_category_id, NULL, $$Le sourire est une Sadaqa (التبسم صدقة)$$, $$Le Prophète ﷺ a enseigné que même un sourire est une sadaqa. Cela rappelle que la charité n’est pas réservée aux riches.

Aujourd’hui : souris, salue, fais un du‘a pour quelqu’un.$$, 3),
      (sadaqa_category_id, NULL, $$La Sadaqa Jariya (الصدقة الجارية)$$, $$C’est une charité dont la récompense continue : un puits, un mushaf offert, une science transmise, une œuvre durable.

Pense “impact long terme”.$$, 4),
      (sadaqa_category_id, NULL, $$Les mérites de la charité$$, $$Allah multiplie la récompense de la charité. Elle purifie l’âme, protège de l’avarice, et apporte la baraka.

Astuce : mets une petite somme de côté chaque semaine.$$, 5),
      (sadaqa_category_id, NULL, $$Donner en secret$$, $$Donner discrètement protège le cœur de l’ostentation (الرياء). Même un don minime en secret peut peser lourd.

Choisis une action secrète cette semaine.$$, 6),
      (sadaqa_category_id, NULL, $$La Zakat vs la Sadaqa$$, $$La zakat est obligatoire avec des règles. La sadaqa est volontaire et ouverte : elle peut être financière, morale, ou matérielle.

Les deux purifient : l’une par obligation, l’autre par amour.$$, 7),

      -- Level-specific Sadaqa content
      (sadaqa_category_id, d_l1, $$Niveau 1 — Petits gestes$$, $$Chaque jour : 1 acte simple.
- Un bon mot
- Une aide
- Un partage
- Un du‘a pour quelqu’un

Objectif : rendre la sadaqa “facile”.$$, 101),
      (sadaqa_category_id, d_l2, $$Niveau 2 — Don régulier$$, $$Fixe un montant (même 1€) ou un temps (10 minutes) chaque semaine.

Règle : automatiser pour rester constant.$$, 102),
      (sadaqa_category_id, d_l3, $$Niveau 3 — Projet durable$$, $$Choisis une action à impact durable :
- financer un mushaf
- participer à une collecte
- enseigner une sourate
- soutenir une œuvre utile

But : laisser une trace de bien.$$, 103);
  END IF;
END
$seed$;


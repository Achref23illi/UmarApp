/**
 * Challenge Content (Real)
 * ========================
 * Source of truth for “real” challenges content displayed in the app.
 *
 * Notes:
 * - French first, with Arabic terms/quotes where relevant (per product direction).
 * - This config powers the daily “focus” and Quran reading suggestions per level.
 */

export type ChallengeSlug = 'quran' | 'salat_obligatoire' | 'sadaqa';
export type ChallengeLevelNumber = 1 | 2 | 3;

export type QuranDayPlan = {
  day: number; // 1-based
  title: string;
  surahs: number[]; // surah numbers
  note?: string;
};

export type DailyFocusPlan = {
  day: number; // 1-based
  title: string;
  items: string[];
  note?: string;
};

export const QURAN_PLANS: Record<ChallengeLevelNumber, QuranDayPlan[]> = {
  1: [
    { day: 1, title: 'Sourates 93–95', surahs: [93, 94, 95], note: 'Lis en français, puis récite en arabe si possible.' },
    { day: 2, title: 'Sourates 96–98', surahs: [96, 97, 98] },
    { day: 3, title: 'Sourates 99–102', surahs: [99, 100, 101, 102] },
    { day: 4, title: 'Sourates 103–106', surahs: [103, 104, 105, 106] },
    { day: 5, title: 'Sourates 107–109', surahs: [107, 108, 109] },
    { day: 6, title: 'Sourates 110–112', surahs: [110, 111, 112] },
    { day: 7, title: 'Les protectrices (المعوذات)', surahs: [113, 114], note: 'Refais aussi Al-Ikhlas (112) si tu peux.' },
  ],
  2: [
    { day: 1, title: 'Al-Mulk', surahs: [67], note: 'Lis calmement. Si c’est long, coupe en 2.' },
    { day: 2, title: 'Ya-Sin', surahs: [36] },
    { day: 3, title: 'Ar-Rahman', surahs: [55] },
    { day: 4, title: 'Al-Waqi‘ah', surahs: [56] },
    { day: 5, title: 'Al-Kahf', surahs: [18], note: 'Tradition du vendredi : vise la constance.' },
    { day: 6, title: 'Al-Hashr', surahs: [59] },
    { day: 7, title: 'Al-Hujurat', surahs: [49] },
    { day: 8, title: 'Al-Mulk (relecture)', surahs: [67], note: 'Relis et note 3 leçons.' },
    { day: 9, title: 'Ya-Sin (relecture)', surahs: [36] },
    { day: 10, title: 'Ar-Rahman (relecture)', surahs: [55] },
    { day: 11, title: 'Al-Waqi‘ah (relecture)', surahs: [56] },
    { day: 12, title: 'Al-Kahf (relecture)', surahs: [18] },
    { day: 13, title: 'Al-Insan', surahs: [76] },
    { day: 14, title: 'Révision', surahs: [112, 113, 114], note: 'Clôture : Al-Ikhlas + Al-Falaq + An-Nas.' },
  ],
  3: [
    { day: 1, title: 'Al-Fatiha', surahs: [1], note: 'Lis et médite : change ta salat.' },
    { day: 2, title: 'Al-Baqara (début)', surahs: [2], note: 'Lis ce que tu peux, sans pression. Objectif : habitude.' },
    { day: 3, title: 'Al ‘Imran', surahs: [3] },
    { day: 4, title: 'An-Nisa', surahs: [4] },
    { day: 5, title: 'Al-Ma’ida', surahs: [5] },
    { day: 6, title: 'Al-An‘am', surahs: [6] },
    { day: 7, title: 'Al-A‘raf', surahs: [7] },
    { day: 8, title: 'Al-Anfal', surahs: [8] },
    { day: 9, title: 'At-Tawbah', surahs: [9] },
    { day: 10, title: 'Yunus', surahs: [10] },
    { day: 11, title: 'Hud', surahs: [11] },
    { day: 12, title: 'Yusuf', surahs: [12] },
    { day: 13, title: 'Ar-Ra‘d', surahs: [13] },
    { day: 14, title: 'Ibrahim', surahs: [14] },
    { day: 15, title: 'Al-Hijr', surahs: [15] },
    { day: 16, title: 'An-Nahl', surahs: [16] },
    { day: 17, title: 'Al-Isra', surahs: [17] },
    { day: 18, title: 'Al-Kahf', surahs: [18] },
    { day: 19, title: 'Révision courte', surahs: [112, 113, 114], note: 'Garde les protectrices dans ton quotidien.' },
    { day: 20, title: 'Sourate au choix', surahs: [55], note: 'Choisis une sourate que tu aimes et relis-la.' },
    { day: 21, title: 'Clôture', surahs: [1], note: 'Relis Al-Fatiha et écris 3 intentions pour la suite.' },
  ],
};

export const SALAT_PLANS: Record<ChallengeLevelNumber, DailyFocusPlan[]> = {
  1: [
    { day: 1, title: 'Focus Fajr', items: ['Prier Fajr à l’heure', 'Lire Al-Fatiha lentement', 'Faire 1 du‘a après la prière'] },
    { day: 2, title: 'Focus Dhuhr', items: ['Prier Dhuhr à l’heure', 'Éviter de repousser', 'Préparer le wudu 5 min avant'] },
    { day: 3, title: 'Focus ‘Asr', items: ['Prier ‘Asr à l’heure', 'Couper les distractions (téléphone)', '2 minutes de dhikr après'] },
    { day: 4, title: 'Focus Maghrib', items: ['Prier Maghrib rapidement après l’adhan', 'Rester simple : constance', 'Lire une courte sourate'] },
    { day: 5, title: 'Focus ‘Isha', items: ['Prier ‘Isha à l’heure', 'Préparer la prière avant de te poser', 'Du‘a : طلب الثبات (demander la constance)'] },
    { day: 6, title: 'Les 5 prières', items: ['Coche les 5 prières aujourd’hui', 'Wudu conscient', 'Une chose à améliorer : la lenteur'] },
    { day: 7, title: 'Bilan', items: ['Repère ce qui te bloque', 'Ajuste tes rappels', 'Reprends demain, sans culpabilité'] },
  ],
  2: [
    { day: 1, title: 'Rawatib : avant Fajr', items: ['2 rak‘at avant Fajr (السنة)', 'Intention simple', 'Même si c’est court : fais-le'] },
    { day: 2, title: 'Stabilité', items: ['Garde la sunnah de Fajr', 'Protège les fard', 'Réduis les distractions avant la prière'] },
    { day: 3, title: 'Après Dhuhr', items: ['Ajoute 2 rak‘at après Dhuhr (si possible)', 'Reste constant', 'Ne cherche pas la perfection'] },
    { day: 4, title: 'Rawatib : Dhuhr', items: ['Si tu peux : 4 avant + 2 après Dhuhr', 'Sinon : 2 après seulement'] },
    { day: 5, title: 'Avant ‘Asr (optionnel)', items: ['Si tu peux : 2 rak‘at avant ‘Asr', 'Sinon : garde le focus sur les obligations'] },
    { day: 6, title: 'Avant Maghrib (optionnel)', items: ['2 rak‘at légères avant Maghrib (si possible)', 'Ne complique pas'] },
    { day: 7, title: 'Bilan Rawatib', items: ['Choisis 1 rawatib à sécuriser', 'Planifie tes rappels', 'Prépare ton wudu tôt'] },
    { day: 8, title: 'Semaine 2', items: ['Garde Fajr sunnah', 'Ajoute 1 rawatib facile', 'Constance > quantité'] },
    { day: 9, title: 'Khushu', items: ['Ralentis Al-Fatiha', 'Comprends ce que tu dis', 'Respire avant de commencer'] },
    { day: 10, title: 'Witr (préparation)', items: ['Prépare-toi à ajouter Witr bientôt', 'Choisis un horaire après ‘Isha'] },
    { day: 11, title: 'Sunnah légère', items: ['Ajoute 2 rak‘at quand c’est facile', 'Ne te surcharge pas'] },
    { day: 12, title: 'Consolidation', items: ['Ne rate pas deux jours d’affilée', 'Reprends immédiatement'] },
    { day: 13, title: 'Révision', items: ['Révise tes rawatib', 'Garde ce qui marche', 'Allège ce qui casse ta constance'] },
    { day: 14, title: 'Clôture', items: ['Plan pour le mois', '1 amélioration durable', 'Du‘a de stabilité'] },
  ],
  3: [
    { day: 1, title: 'Witr', items: ['Prier Witr après ‘Isha', 'Même 1 rak‘a', 'Faire du‘a'] },
    { day: 2, title: 'Duha', items: ['Prier Duha (2 rak‘at) si possible', 'Choisir un moment fixe'] },
    { day: 3, title: 'Tahajjud (léger)', items: ['2 rak‘at avant Fajr si possible', 'Intention : proximité'] },
    { day: 4, title: 'Khushu', items: ['Ralentir la prière', 'Comprendre 1 phrase', 'Être présent'] },
    { day: 5, title: 'Soutien', items: ['Couper une distraction avant la salat', 'Préparer l’espace de prière'] },
    { day: 6, title: 'Witr + Rawatib', items: ['Garde Witr', 'Garde 1 rawatib', 'Constance'] },
    { day: 7, title: 'Bilan', items: ['Réaliste : qu’est-ce que tu gardes ?', 'Fixe 1 routine'] },
    // Repeat pattern for 21 days (rotation)
    ...Array.from({ length: 14 }, (_, i) => {
      const day = i + 8;
      const base = ['Witr', 'Duha', 'Tahajjud', 'Khushu', 'Soutien', 'Witr + Rawatib', 'Bilan'] as const;
      const label = base[(day - 1) % base.length];
      const title = `Rotation : ${label}`;
      const map: Record<(typeof base)[number], string[]> = {
        Witr: ['Prier Witr', 'Même court', 'Constance'],
        Duha: ['2 rak‘at Duha', 'Moment fixe', 'Simplicité'],
        Tahajjud: ['2 rak‘at', 'Avant Fajr', 'Sans pression'],
        Khushu: ['Ralentir Al-Fatiha', 'Comprendre', 'Être présent'],
        Soutien: ['Préparer le wudu tôt', 'Couper distractions', 'Intention'],
        'Witr + Rawatib': ['Garde Witr', 'Garde 1 rawatib', 'Stabilité'],
        Bilan: ['Ajuster', 'Alléger si besoin', 'Continuer'],
      };
      return { day, title, items: map[label] } as DailyFocusPlan;
    }),
  ],
};

export const SADAQA_PLANS: Record<ChallengeLevelNumber, DailyFocusPlan[]> = {
  1: [
    { day: 1, title: 'Sourire (التبسم)', items: ['Sourire à 3 personnes', 'Dire un salam sincère', 'Du‘a pour quelqu’un'] },
    { day: 2, title: 'Aide rapide', items: ['Aider une personne (petit service)', 'Porter un sac, ouvrir une porte', 'Être attentif'] },
    { day: 3, title: 'Bon mot', items: ['Dire un bon mot', 'Encourager quelqu’un', 'Éviter une parole blessante'] },
    { day: 4, title: 'Obstacle du chemin', items: ['Enlever un obstacle', 'Rendre un lieu propre', 'Intention pour Allah'] },
    { day: 5, title: 'Partage', items: ['Partager un repas/boisson', 'Offrir un petit cadeau', 'Discrétion'] },
    { day: 6, title: 'Soutien', items: ['Envoyer un message bienveillant', 'Prendre des nouvelles', 'Du‘a'] },
    { day: 7, title: 'Bilan', items: ['Choisir 1 geste à garder', 'Le rendre facile', 'Continuer demain'] },
  ],
  2: Array.from({ length: 14 }, (_, i) => {
    const day = i + 1;
    const ideas = [
      { title: 'Don régulier', items: ['Mettre de côté une petite somme', 'Même symbolique', 'Automatiser si possible'] },
      { title: 'Temps', items: ['10 minutes pour aider quelqu’un', 'Un appel, un service', 'Intention'] },
      { title: 'Nourrir', items: ['Offrir un repas', 'Partager', 'Faire discrètement'] },
      { title: 'Soutenir une cause', items: ['Choisir une cause fiable', 'Donner peu mais souvent', 'Faire du‘a'] },
      { title: 'Service', items: ['Rendre un service à un proche', 'Sans attendre de retour'] },
      { title: 'Sadaqa de science', items: ['Partager une courte leçon', 'Un verset + traduction', 'Une bonne pratique'] },
      { title: 'Bilan', items: ['Qu’est-ce qui est durable ?', 'Ajuster', 'Continuer'] },
    ];
    const idea = ideas[(day - 1) % ideas.length];
    return { day, title: `Jour ${day} — ${idea.title}`, items: idea.items } as DailyFocusPlan;
  }),
  3: Array.from({ length: 21 }, (_, i) => {
    const day = i + 1;
    const projects = [
      { title: 'Sadaqa jariya', items: ['Choisir un projet durable', 'Mettre un plan simple', 'Commencer petit'] },
      { title: 'Transmettre', items: ['Enseigner 1 sourate courte', 'Partager une habitude', 'Encourager'] },
      { title: 'Contribution', items: ['Participer à une collecte', 'Donner du temps ou de l’argent', 'Discrétion'] },
      { title: 'Équipement', items: ['Offrir un mushaf', 'Offrir un livre utile', 'Avec une bonne intention'] },
      { title: 'Compétence', items: ['Aider avec une compétence', 'Design, dev, admin, etc.', 'Au service d’un bien'] },
      { title: 'Bilan', items: ['Évaluer', 'Simplifier', 'Continuer'] },
    ];
    const p = projects[(day - 1) % projects.length];
    return { day, title: `Jour ${day} — ${p.title}`, items: p.items } as DailyFocusPlan;
  }),
};

export function clampDay(dayNumber: number, totalDays: number): number {
  if (!Number.isFinite(dayNumber)) return 1;
  return Math.min(Math.max(1, Math.floor(dayNumber)), totalDays);
}

export function getPlanForDay<T extends { day: number }>(plans: T[], dayNumber: number): T | null {
  const normalizedDay = Math.max(1, Math.floor(dayNumber));
  return plans.find((p) => p.day === normalizedDay) ?? null;
}


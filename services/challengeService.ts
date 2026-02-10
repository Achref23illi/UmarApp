import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const SUPPORTED_CHALLENGE_SLUGS = new Set(['quran', 'salat_obligatoire', 'sadaqa']);
const API_TIMEOUT_MS = Number(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000');
const BACKEND_FETCH_TIMEOUT_MS = Math.max(600, Math.min(API_TIMEOUT_MS, 1200));
const SUPABASE_FETCH_TIMEOUT_MS = 5000;
const CHALLENGE_CATEGORIES_CACHE_KEY = '@challenge_categories_cache_v1';

export interface ChallengeCategory {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  duration: string;
  levels: string;
  prerequisite: string;
  iconName: string;
  imageUrl?: string | null;
  isLocked: boolean;
  color: string;
  sortOrder: number;
}

type ChallengeCategoryRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  duration: string;
  levels: string;
  prerequisite: string;
  icon_name: string;
  image_url: string | null;
  is_locked: boolean;
  color: string;
  sort_order: number;
};

function mapCategoryRow(row: ChallengeCategoryRow): ChallengeCategory {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    duration: row.duration,
    levels: row.levels,
    prerequisite: row.prerequisite,
    iconName: row.icon_name,
    imageUrl: row.image_url,
    isLocked: !!row.is_locked,
    color: row.color,
    sortOrder: row.sort_order,
  };
}

const LOCAL_FALLBACK_CATEGORIES: ChallengeCategory[] = [
  {
    id: 'fallback-quran',
    slug: 'quran',
    title: 'Coran',
    subtitle: null,
    description: 'Lecture quotidienne du Coran avec progression par niveaux.',
    duration: '3 semaines',
    levels: '3 niveaux',
    prerequisite: 'Aucun',
    iconName: 'book-outline',
    imageUrl: null,
    isLocked: false,
    color: '#670FA4',
    sortOrder: 1,
  },
  {
    id: 'fallback-salat',
    slug: 'salat_obligatoire',
    title: 'Salat',
    subtitle: 'Obligatoire',
    description: 'Consolider les 5 prières et la constance quotidienne.',
    duration: '3 semaines',
    levels: '3 niveaux',
    prerequisite: 'Aucun',
    iconName: 'time-outline',
    imageUrl: null,
    isLocked: false,
    color: '#F5C661',
    sortOrder: 2,
  },
  {
    id: 'fallback-sadaqa',
    slug: 'sadaqa',
    title: 'Sadaqa',
    subtitle: null,
    description: 'Développer une routine de sadaqa et d’actions bienfaisantes.',
    duration: '3 semaines',
    levels: '3 niveaux',
    prerequisite: 'Aucun',
    iconName: 'heart-outline',
    imageUrl: null,
    isLocked: false,
    color: '#4CAF50',
    sortOrder: 3,
  },
];

let memoryCategoriesCache: ChallengeCategory[] | null = null;
let inFlightCategoriesPromise: Promise<ChallengeCategory[]> | null = null;

function isFallbackCategory(item: ChallengeCategory): boolean {
  return item.id.startsWith('fallback-');
}

async function fetchCategoriesFromSupabase(): Promise<ChallengeCategoryRow[]> {
  const { data, error } = await supabase
    .from('challenge_categories')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) return [];
  return (data as ChallengeCategoryRow[]) ?? [];
}

async function fetchCategoriesFromBackendWithTimeout(): Promise<ChallengeCategoryRow[]> {
  if (!API_URL) return [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BACKEND_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}/challenge-categories`, { signal: controller.signal });
    const data = await res.json();
    if (!res.ok || !Array.isArray(data)) return [];
    return data as ChallengeCategoryRow[];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function getFreshFallbackCategories(): ChallengeCategory[] {
  return LOCAL_FALLBACK_CATEGORIES.map((item) => ({ ...item }));
}

async function readCachedCategories(): Promise<ChallengeCategory[] | null> {
  if (memoryCategoriesCache?.length) return memoryCategoriesCache;

  try {
    const raw = await AsyncStorage.getItem(CHALLENGE_CATEGORIES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ChallengeCategory[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    const sanitized = parsed.filter(
      (item): item is ChallengeCategory =>
        !!item && typeof item === 'object' && typeof item.id === 'string' && !isFallbackCategory(item)
    );
    if (!sanitized.length) {
      await AsyncStorage.removeItem(CHALLENGE_CATEGORIES_CACHE_KEY);
      return null;
    }
    memoryCategoriesCache = sanitized;
    return sanitized;
  } catch {
    return null;
  }
}

async function writeCachedCategories(categories: ChallengeCategory[]): Promise<void> {
  memoryCategoriesCache = categories;
  try {
    await AsyncStorage.setItem(CHALLENGE_CATEGORIES_CACHE_KEY, JSON.stringify(categories));
  } catch {
    // Cache write failure is non-fatal.
  }
}

export const challengeService = {
  getFallbackCategories: (): ChallengeCategory[] => getFreshFallbackCategories(),

  getCategories: async (): Promise<ChallengeCategory[]> => {
    const normalize = (rows: ChallengeCategoryRow[]) =>
      rows
        .filter((row) => SUPPORTED_CHALLENGE_SLUGS.has(row.slug))
        .map((row) => mapCategoryRow(row))
        .sort((a, b) => a.sortOrder - b.sortOrder);

    const cached = await readCachedCategories();
    if (cached?.length) {
      // Return cached data immediately and refresh silently in background.
      void (async () => {
        try {
          const fresh = await challengeService.refreshCategories();
          if (fresh.some((item) => !isFallbackCategory(item))) {
            await writeCachedCategories(fresh);
          }
        } catch {
          // Background refresh failure is non-fatal.
        }
      })();
      return cached;
    }

    if (inFlightCategoriesPromise) return inFlightCategoriesPromise;

    inFlightCategoriesPromise = challengeService
      .refreshCategories()
      .then(async (fresh) => {
        if (fresh.some((item) => !isFallbackCategory(item))) {
          await writeCachedCategories(fresh);
        }
        return fresh;
      })
      .finally(() => {
        inFlightCategoriesPromise = null;
      });

    return inFlightCategoriesPromise;
  },

  refreshCategories: async (): Promise<ChallengeCategory[]> => {
    const normalize = (rows: ChallengeCategoryRow[]) =>
      rows
        .filter((row) => SUPPORTED_CHALLENGE_SLUGS.has(row.slug))
        .map((row) => mapCategoryRow(row))
        .sort((a, b) => a.sortOrder - b.sortOrder);

    const backendTask = fetchCategoriesFromBackendWithTimeout();

    const supabaseRows = await withTimeout(
      fetchCategoriesFromSupabase(),
      SUPABASE_FETCH_TIMEOUT_MS,
      [] as ChallengeCategoryRow[]
    );
    const normalizedFromSupabase = normalize(supabaseRows);
    if (normalizedFromSupabase.length > 0) {
      return normalizedFromSupabase;
    }

    const backendRows = await backendTask;
    const normalizedFromBackend = normalize(backendRows);
    if (normalizedFromBackend.length > 0) {
      return normalizedFromBackend;
    }

    return getFreshFallbackCategories();
  },

  getCategoryById: async (id: string): Promise<ChallengeCategory | null> => {
    const cached = await readCachedCategories();
    if (cached?.length) {
      const fromCache = cached.find((item) => item.id === id && !isFallbackCategory(item));
      if (fromCache) return fromCache;
    }

    const { data, error } = await supabase
      .from('challenge_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    if (!SUPPORTED_CHALLENGE_SLUGS.has((data as ChallengeCategoryRow).slug)) return null;
    return mapCategoryRow(data as ChallengeCategoryRow);
  },

  getCategoryBySlug: async (slug: string): Promise<ChallengeCategory | null> => {
    if (!SUPPORTED_CHALLENGE_SLUGS.has(slug)) return null;

    const cached = await readCachedCategories();
    if (cached?.length) {
      const fromCache = cached.find((item) => item.slug === slug && !isFallbackCategory(item));
      if (fromCache) return fromCache;
    }

    const { data, error } = await supabase
      .from('challenge_categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) return null;

    const mapped = mapCategoryRow(data as ChallengeCategoryRow);
    if (memoryCategoriesCache?.length) {
      const idx = memoryCategoriesCache.findIndex((item) => item.slug === mapped.slug);
      if (idx >= 0) {
        memoryCategoriesCache[idx] = mapped;
      } else {
        memoryCategoriesCache.push(mapped);
      }
    }
    return mapped;
  },
};

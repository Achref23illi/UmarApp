/**
 * French Quran Translation Service
 * =================================
 * Fetches French translation from Quran.Foundation API (v4).
 */

import { QURAN_API_CONFIG, QURAN_FRENCH_TRANSLATION_RESOURCE_ID } from '@/config/quranApi';
import { SURAHS } from '@/services/quranData';

export interface FrenchVerse {
  id: number;
  surah: number;
  ayah: number;
  text: string;
  arabicText?: string;
}

export interface FrenchSurah {
  number: number;
  name: string;
  verses: FrenchVerse[];
}

type QuranTokenPayload = {
  access_token: string;
  expires_in: number;
};

type QuranVersePayload = {
  id: number;
  verse_number: number;
  text_uthmani?: string;
  translations?: { text?: string | null }[];
};

type QuranVerseResponse = {
  verses?: QuranVersePayload[];
  pagination?: {
    next_page?: number | null;
  };
};

type CachedToken = {
  token: string;
  expiresAtMs: number;
};

const SURAH_CACHE = new Map<number, FrenchSurah>();
let FULL_QURAN_CACHE: FrenchSurah[] | null = null;
let tokenCache: CachedToken | null = null;

function encodeBase64(input: string): string {
  if (typeof globalThis.btoa === 'function') {
    return globalThis.btoa(input);
  }

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let i = 0;
  while (i < input.length) {
    const chr1 = input.charCodeAt(i++);
    const chr2 = input.charCodeAt(i++);
    const chr3 = input.charCodeAt(i++);

    const enc1 = chr1 >> 2;
    const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    let enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
    let enc4 = chr3 & 63;

    if (Number.isNaN(chr2)) {
      enc3 = 64;
      enc4 = 64;
    } else if (Number.isNaN(chr3)) {
      enc4 = 64;
    }

    output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
  }

  return output;
}

function sanitizeTranslationText(raw: string | undefined | null): string {
  if (!raw) return '';
  return raw
    .replace(/<sup[^>]*>.*?<\/sup>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function getQuranAccessToken(forceRefresh = false): Promise<string> {
  const now = Date.now();
  if (!forceRefresh && tokenCache && now < tokenCache.expiresAtMs - 60_000) {
    return tokenCache.token;
  }

  const basic = encodeBase64(`${QURAN_API_CONFIG.clientId}:${QURAN_API_CONFIG.clientSecret}`);
  const response = await fetch(QURAN_API_CONFIG.authUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=content',
  });

  if (!response.ok) {
    throw new Error(`Quran auth failed with status ${response.status}`);
  }

  const payload = (await response.json()) as QuranTokenPayload;
  if (!payload.access_token) {
    throw new Error('Quran auth response missing access token');
  }

  tokenCache = {
    token: payload.access_token,
    expiresAtMs: now + (payload.expires_in || 3600) * 1000,
  };

  return payload.access_token;
}

async function quranApiFetch<T>(pathWithQuery: string, allowRetry = true): Promise<T> {
  const token = await getQuranAccessToken();
  const response = await fetch(`${QURAN_API_CONFIG.apiBaseUrl}${pathWithQuery}`, {
    headers: {
      'x-auth-token': token,
      'x-client-id': QURAN_API_CONFIG.clientId,
    },
  });

  if (response.status === 401 && allowRetry) {
    tokenCache = null;
    return quranApiFetch<T>(pathWithQuery, false);
  }

  if (!response.ok) {
    throw new Error(`Quran API failed (${response.status}) on ${pathWithQuery}`);
  }

  return (await response.json()) as T;
}

async function fetchFrenchSurahFromApi(surahNumber: number): Promise<FrenchSurah> {
  const verses: FrenchVerse[] = [];
  let page = 1;

  while (true) {
    const query = new URLSearchParams({
      translations: String(QURAN_FRENCH_TRANSLATION_RESOURCE_ID),
      fields: 'text_uthmani',
      page: String(page),
      per_page: '50',
    });

    const payload = await quranApiFetch<QuranVerseResponse>(
      `/verses/by_chapter/${surahNumber}?${query.toString()}`
    );

    const pageVerses = payload.verses ?? [];
    pageVerses.forEach((verse) => {
      const translated = sanitizeTranslationText(verse.translations?.[0]?.text);
      verses.push({
        id: verse.id,
        surah: surahNumber,
        ayah: verse.verse_number,
        text: translated || sanitizeTranslationText(verse.text_uthmani) || '',
        arabicText: verse.text_uthmani?.trim() || undefined,
      });
    });

    const nextPage = payload.pagination?.next_page;
    if (!nextPage || nextPage <= page) break;
    page = nextPage;
  }

  const surahMeta = SURAHS.find((surah) => surah.number === surahNumber);
  return {
    number: surahNumber,
    name: surahMeta?.name ?? `Sourate ${surahNumber}`,
    verses,
  };
}

/**
 * Fetch the complete French Quran.
 * Loaded lazily from surah endpoints and memoized.
 */
export async function getFrenchQuran(): Promise<FrenchSurah[]> {
  if (FULL_QURAN_CACHE) return FULL_QURAN_CACHE;

  const all: FrenchSurah[] = [];
  for (const surah of SURAHS) {
    const loaded = await getFrenchSurah(surah.number);
    if (loaded) all.push(loaded);
  }
  FULL_QURAN_CACHE = all;
  return all;
}

/**
 * Get a specific surah in French.
 */
export async function getFrenchSurah(surahNumber: number): Promise<FrenchSurah | null> {
  if (!Number.isFinite(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    return null;
  }

  const cached = SURAH_CACHE.get(surahNumber);
  if (cached) return cached;

  try {
    const surah = await fetchFrenchSurahFromApi(surahNumber);
    SURAH_CACHE.set(surahNumber, surah);
    return surah;
  } catch (error) {
    console.error('Error fetching French surah from Quran API:', error);
    return null;
  }
}

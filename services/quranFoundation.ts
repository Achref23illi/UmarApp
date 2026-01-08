/**
 * Quran.Foundation API Service
 * ============================
 * Handles authentication and data fetching from the Quran.Foundation API.
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';
import { QURAN_API_CONFIG } from '@/config/quranApi';

const TOKEN_STORAGE_KEY = '@quran_api_token';
const TOKEN_EXPIRY_KEY = '@quran_api_token_expiry';

// Types for API Responses
interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface VerseWord {
  id: number;
  position: number;
  audio_url: string | null;
  char_type_name: string;
  code_v1: string;
  page_number: number;
  line_number: number;
  text: string;
  translation: {
    text: string;
    language_name: string;
  } | null;
  transliteration: {
    text: string;
    language_name: string;
  } | null;
  location?: string; // x,y,width,height coordinates if requested
}

export interface Verse {
  id: number;
  verse_key: string;
  text_uthmani: string;
  words: VerseWord[];
}

export interface PageResponse {
  verses: Verse[];
  pagination: {
    per_page: number;
    current_page: number;
    next_page: number | null;
    total_pages: number;
    total_records: number;
  };
}

/**
 * Get a valid access token.
 * Checks cache first, otherwise requests a new one.
 */
async function getAccessToken(): Promise<string | null> {
  try {
    // 1. Check local storage
    const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    const expiryStr = await AsyncStorage.getItem(TOKEN_EXPIRY_KEY);

    if (token && expiryStr) {
      const expiry = parseInt(expiryStr, 10);
      // Add a buffer of 5 minutes to ensure token is valid
      if (Date.now() < expiry - 5 * 60 * 1000) {
        return token;
      }
    }

    // 2. Request new token
    return await requestNewToken();
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

/**
 * Request a new access token from the API
 */
async function requestNewToken(): Promise<string | null> {
  const { clientId, clientSecret, authUrl } = QURAN_API_CONFIG;
  
  // Basic Auth Header
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const response = await axios.post<AuthResponse>(
      authUrl,
      'grant_type=client_credentials&scope=content',
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, expires_in } = response.data;
    
    // Save to storage
    const expiryTime = Date.now() + expires_in * 1000;
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, access_token);
    await AsyncStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());

    return access_token;
  } catch (error) {
    console.error('Failed to request new token:', error);
    return null;
  }
}

/**
 * Fetch verses for a specific page with word details (coordinates)
 */
export async function getPageDetails(pageNumber: number): Promise<PageResponse | null> {
  const { apiBaseUrl, clientId } = QURAN_API_CONFIG;
  const token = await getAccessToken();

  if (!token) {
    console.error('No access token available');
    return null;
  }

  try {
    // We want words with location to overlay on the image
    const response = await axios.get<PageResponse>(
      `${apiBaseUrl}/verses/by_page/${pageNumber}`,
      {
        params: {
          words: true,
          word_fields: 'location,text_uthmani,code_v1', // Request location data
          per_page: 'all', // Get all verses on the page
        },
        headers: {
          'x-auth-token': token,
          'x-client-id': clientId,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(`Error fetching page ${pageNumber}:`, error);
    // If 401, we could retry once with a refreshed token, but keeping it simple for now
    return null;
  }
}

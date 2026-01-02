import { supabase } from '@/lib/supabase';

/**
 * Checks which providers are registered for a given email.
 * Returns an array of providers (e.g. ['email', 'google']).
 */
export const checkUserProviders = async (email: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase.rpc('get_providers_by_email', {
      email_input: email,
    });

    if (error) {
      console.error('Error checking providers:', error);
      return [];
    }

    return data || [];
  } catch (e) {
    console.error('Exception checking providers:', e);
    return [];
  }
};

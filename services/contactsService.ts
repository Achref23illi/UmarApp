import { supabase } from '@/lib/supabase';

export interface InviteContact {
  id: string;
  name: string;
  avatarUrl?: string | null;
  lastConnection: string;
}

type ProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string | null;
};

function formatLastConnection(updatedAt: string | null, language: string): string {
  if (!updatedAt) return '';
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return '';

  const locale =
    language === 'fr' ? 'fr-FR' : language === 'ar' ? 'ar' : language === 'en' ? 'en-US' : undefined;

  try {
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return date.toDateString();
  }
}

export const contactsService = {
  getInviteContacts: async ({
    language,
    limit = 50,
    recentCount = 6,
  }: {
    language: string;
    limit?: number;
    recentCount?: number;
  }): Promise<{ recent: InviteContact[]; all: InviteContact[] }> => {
    const { data: session } = await supabase.auth.getSession();
    const myId = session.session?.user?.id;

    const { data, error } = await supabase
      .from('public_profiles')
      .select('id, full_name, avatar_url, updated_at')
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const contacts = (data as ProfileRow[])
      .filter((p) => (myId ? p.id !== myId : true))
      .map<InviteContact>((p) => ({
        id: p.id,
        name: p.full_name || 'User',
        avatarUrl: p.avatar_url,
        lastConnection: formatLastConnection(p.updated_at, language),
      }));

    const recent = contacts.slice(0, recentCount);
    const all = contacts.slice(recentCount);

    return { recent, all };
  },
};


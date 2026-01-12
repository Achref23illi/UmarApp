import { supabase } from '@/lib/supabase';
import { Share } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return session ? { 'Authorization': `Bearer ${session.access_token}` } : {};
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  isVerified?: boolean;
  gender?: 'male' | 'female';
}

export interface Mosque {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  distance?: number;
  hasWomenSection: boolean;
  hasQuranSession?: boolean; // Added
  parkingAvailable: boolean;
  wheelchairAccess?: boolean; // Added
  kidsArea?: boolean; // Added
  wuduArea?: boolean; // Added
  capacity?: number;
  jummahTime?: string;
  adminPinned: boolean; // True if set by admin
  images?: string[];
}

// ... existing code ...



export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'janaza_alert' | 'challenge_request' | 'post_like' | 'admin_msg';
  title: string;
  body: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

export interface Comment {
  id: string;
  user: User;
  content: string;
  created_at: string;
  is_approved: boolean;
}

export interface JanazaData {
  deceasedName: string;
  deceasedGender: 'male' | 'female';
  prayerTime: string; // e.g. "14h00" or "After Dhuhr"
  prayerDate?: string; // ISO date string
  mosqueName: string;
  mosqueAddress?: string; // Full address with postal code
  mosqueLocation: { lat: number; lng: number };
  cemeteryName?: string;
  cemeteryAddress?: string; // Postal code or full address
  cemeteryLocation?: { lat: number; lng: number };
  isRepatriation?: boolean; // If true, show "Rapatriment" instead of cemetery name
}

export interface SickVisitData {
  patientName?: string;
  hospitalName: string;
  hospitalLocation: { lat: number; lng: number };
  visitingHours?: string;
  ward?: string;
  roomNumber?: string;
}

export interface QuizCategory {
  id: string;
  name: string;
  name_fr?: string;
  icon: string;
  description: string;
  description_fr?: string;
  color: string;
}

export interface Quiz {
  id: string;
  category_id: string;
  title: string;
  title_fr?: string;
  difficulty: string; // 'easy', 'medium', 'hard'
  created_at: string;
}

// ... existing code ...
export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  question_fr?: string;
  options: string[]; // JSONB array of strings
  options_fr?: string[];
  correct_answer: string;
  correct_answer_fr?: string;
}

export interface Dua {
  id: string;
  category: string;
  title: string;
  title_fr: string;
  content: string; // Arabic
  transliteration?: string;
  translation: string; // English
  translation_fr: string; // French
  created_at?: string;
}
// ... existing code ...

// Deprecated: Old Question interface
export interface Question {
  id: string;
  question: string;
  answers: string[];
  correct_answer: string;
}

export interface Post {
  id: string;
  type: 'standard' | 'janaza' | 'sick_visit' | 'general' | 'event';
  user: User;
  content: string;
  image?: string;
  timestamp: string; // ISO string
  likes: number;
  comments: number;
  shares: number;
  isLiked?: boolean;
  tags?: string[];
  inAgenda?: boolean;
  pinned?: boolean;
  
  // Type-specific data
  janazaData?: JanazaData;
  sickVisitData?: SickVisitData;
  
  // Location for radius filtering
  location?: { lat: number; lng: number };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  badge_icon: string;
  earned_at?: string; // If user has earned it
}

export interface QuizProgress {
  quiz_id: string;
  current_question_index: number;
  score: number;
  status: 'in_progress' | 'completed';
}


export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Umar Admin', avatar: 'https://i.pravatar.cc/150?u=u1', isVerified: true, gender: 'male' },
  { id: 'u2', name: 'Ahmed Ali', avatar: 'https://i.pravatar.cc/150?u=u2', gender: 'male' },
  { id: 'u3', name: 'Sarah Khan', avatar: 'https://i.pravatar.cc/150?u=u3', gender: 'female' },
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    type: 'janaza',
    user: MOCK_USERS[0],
    content: 'Annonce Janaza: Frère Ibrahim est décédé aujourd\'hui. La prière aura lieu à la Grande Mosquée de Paris après Asr.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    likes: 124,
    comments: 45,
    shares: 12,
    janazaData: {
      deceasedName: 'Ibrahim Al-Fulan',
      deceasedGender: 'male',
      prayerTime: 'Après Asr (16h45)',
      mosqueName: 'Grande Mosquée de Paris',
      mosqueLocation: { lat: 48.8419, lng: 2.3551 },
      cemeteryName: 'Cimetière de Thiais',
      cemeteryAddress: '261 Route de Fontainebleau, 94320 Thiais',
    },
    location: { lat: 48.8419, lng: 2.3551 },
  },
  {
    id: 'p2',
    type: 'sick_visit',
    user: MOCK_USERS[1],
    content: 'Frère Yunus se rétablit à l\'Hôpital de la Pitié-Salpêtrière. Merci de lui rendre visite pendant les heures de visite.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    likes: 45,
    comments: 12,
    shares: 5,
    sickVisitData: {
      patientName: 'Yunus',
      hospitalName: 'Hôpital Pitié-Salpêtrière',
      hospitalLocation: { lat: 48.8398, lng: 2.3653 },
      visitingHours: '15h - 17h',
      ward: 'Pavillon 3, Chambre 501',
    },
    location: { lat: 48.8398, lng: 2.3653 },
  },
  {
    id: 'p3',
    type: 'general',
    user: MOCK_USERS[0],
    content: 'Opération nettoyage du quartier ce dimanche ! Venez nombreux.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    likes: 89,
    comments: 23,
    shares: 2,
    location: { lat: 48.8566, lng: 2.3522 },
  },
  {
    id: 'p4',
    type: 'janaza',
    user: MOCK_USERS[0],
    content: 'Alerte Janaza: Sœur Amina. Prière demain après Dhuhr.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    likes: 245,
    comments: 89,
    shares: 56,
    janazaData: {
      deceasedName: 'Amina Bint Fulana',
      deceasedGender: 'female',
      prayerTime: 'Après Dhuhr (13h30)',
      mosqueName: 'Mosquée de Vitry-sur-Seine',
      mosqueLocation: { lat: 48.7876, lng: 2.3925 },
      cemeteryName: 'Cimetière de Thiais',
      cemeteryAddress: '261 Route de Fontainebleau, 94320 Thiais',
    },
    location: { lat: 48.7876, lng: 2.3925 },
  },
];

const ITEM_LIMIT = 5;

// Mock Admin-Pinned Mosques
export const MOCK_MOSQUES: Mosque[] = [
  {
    id: 'm1',
    name: 'Grande Mosquée de Paris',
    latitude: 48.8419,
    longitude: 2.3551,
    address: '2bis Place du Puits de l\'Ermite, 75005 Paris',
    hasWomenSection: true,
    parkingAvailable: false,
    capacity: 2000,
    jummahTime: '13:30',
    adminPinned: true,
  },
  {
    id: 'm2',
    name: 'Mosquée de la Défense',
    latitude: 48.8924,
    longitude: 2.2361,
    address: 'Place Carpeaux, 92800 Puteaux',
    hasWomenSection: false,
    parkingAvailable: true,
    capacity: 500,
    jummahTime: '13:15',
    adminPinned: true,
  },
  {
    id: 'm3',
    name: 'Mosquée de Vitry-sur-Seine',
    latitude: 48.7876,
    longitude: 2.3925,
    address: '113 Rue Julian Grimau, 94400 Vitry-sur-Seine',
    hasWomenSection: true,
    parkingAvailable: true,
    capacity: 800,
    jummahTime: '13:00',
    adminPinned: false, // Community added
  }
];

export const socialService = {
  getPosts: async (page: number = 1, userId?: string, userLocation?: { lat: number; lng: number }): Promise<Post[]> => {
    try {
      const from = (page - 1) * ITEM_LIMIT;
      const to = from + ITEM_LIMIT - 1;

      const { data: session } = await supabase.auth.getSession();
      const currentUserId = session.session?.user?.id;

      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const postIds = (data || []).map((p: any) => p.id);

      // Fetch agenda info for current user
      let agendaMap = new Map<string, { pinned: boolean }>();
      if (currentUserId && postIds.length > 0) {
        const { data: agendaData } = await supabase
          .from('agenda_entries')
          .select('post_id, pinned')
          .eq('user_id', currentUserId)
          .in('post_id', postIds);
        agendaData?.forEach((row) => {
          agendaMap.set(row.post_id, { pinned: !!row.pinned });
        });
      }

      let posts = (data || []).map((p: any) => ({
        id: p.id,
        type: (p.type as Post['type']) || 'standard',
        user: {
          id: p.user_id || 'unknown',
          name: p.metadata?.author || 'Umar',
          avatar: p.metadata?.avatar || 'https://i.pravatar.cc/150',
          isVerified: true,
        },
        content: p.content || '',
        image: p.image_url || undefined,
        timestamp: p.created_at,
        likes: p.likes_count || 0,
        comments: p.comments_count || 0,
        shares: 0,
        isLiked: false,
        tags: Array.isArray(p.metadata?.tags) ? p.metadata.tags : [],
        janazaData: p.type === 'janaza' ? p.metadata : undefined,
        sickVisitData: p.type === 'sick_visit' ? p.metadata : undefined,
        location: p.lat && p.lng ? { lat: p.lat, lng: p.lng } : undefined,
        inAgenda: agendaMap.has(p.id),
        pinned: agendaMap.get(p.id)?.pinned || false,
      }));

      // Move pinned posts to top for this user
      if (currentUserId) {
        const pinned = posts.filter((p) => p.pinned);
        const others = posts.filter((p) => !p.pinned);
        posts = [...pinned, ...others];
      }

      // Optional radius filter for janaza/sick visits
      if (userLocation) {
        posts = posts.filter((p: Post) => {
          if (!p.location) return true;
          if (p.type !== 'janaza' && p.type !== 'sick_visit') return true;
          const R = 6371;
          const dLat = (p.location.lat - userLocation.lat) * Math.PI / 180;
          const dLon = (p.location.lng - userLocation.lng) * Math.PI / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(userLocation.lat * Math.PI / 180) *
              Math.cos(p.location.lat * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const d = R * c;
          return d <= 30;
        });
      }

      return posts;
    } catch (error) {
      console.error('getPosts error:', error);
      return [];
    }
  },

  getAgendaPosts: async (): Promise<Post[]> => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return [];
      const userId = session.session.user.id;

      const { data: agendaRows, error } = await supabase
        .from('agenda_entries')
        .select('post_id, pinned, created_at')
        .eq('user_id', userId)
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!agendaRows || agendaRows.length === 0) return [];

      const postIds = agendaRows.map((r) => r.post_id);
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .in('id', postIds);
      if (postError) throw postError;

      const agendaMap = new Map<string, { pinned: boolean; created_at: string }>();
      agendaRows.forEach((r) => agendaMap.set(r.post_id, { pinned: r.pinned, created_at: r.created_at }));

      let posts = (postData || []).map((p: any) => ({
        id: p.id,
        type: (p.type as Post['type']) || 'standard',
        user: {
          id: p.user_id || 'unknown',
          name: p.metadata?.author || 'Umar',
          avatar: p.metadata?.avatar || 'https://i.pravatar.cc/150',
          isVerified: true,
        },
        content: p.content || '',
        image: p.image_url || undefined,
        timestamp: p.created_at,
        likes: p.likes_count || 0,
        comments: p.comments_count || 0,
        shares: 0,
        isLiked: false,
        tags: Array.isArray(p.metadata?.tags) ? p.metadata.tags : [],
        janazaData: p.type === 'janaza' ? p.metadata : undefined,
        sickVisitData: p.type === 'sick_visit' ? p.metadata : undefined,
        location: p.lat && p.lng ? { lat: p.lat, lng: p.lng } : undefined,
        inAgenda: true,
        pinned: agendaMap.get(p.id)?.pinned || false,
      }));

      // Sort pinned first, then by created_at descending from agenda
      posts = posts.sort((a, b) => {
        const aPin = a.pinned ? 1 : 0;
        const bPin = b.pinned ? 1 : 0;
        if (aPin !== bPin) return bPin - aPin;
        const aCreated = agendaMap.get(a.id)?.created_at || '';
        const bCreated = agendaMap.get(b.id)?.created_at || '';
        return bCreated.localeCompare(aCreated);
      });

      return posts;
    } catch (error) {
      console.error('getAgendaPosts error:', error);
      return [];
    }
  },

  saveToAgenda: async (postId: string, pinned: boolean = false) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('Not authenticated');
      const userId = session.session.user.id;

      const { error } = await supabase
        .from('agenda_entries')
        .upsert(
          { user_id: userId, post_id: postId, pinned },
          { onConflict: 'user_id,post_id' }
        );
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('saveToAgenda error:', error);
      return false;
    }
  },

  removeFromAgenda: async (postId: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('Not authenticated');
      const userId = session.session.user.id;
      const { error } = await supabase
        .from('agenda_entries')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('removeFromAgenda error:', error);
      return false;
    }
  },

  setPinned: async (postId: string, pinned: boolean) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('Not authenticated');
      const userId = session.session.user.id;

      // If pinning, first unpin all other posts (only one pinned at a time)
      if (pinned) {
        const { error: unpinError } = await supabase
          .from('agenda_entries')
          .update({ pinned: false })
          .eq('user_id', userId)
          .neq('post_id', postId);
        if (unpinError) throw unpinError;
      }

      // Ensure post is in agenda before pinning
      const { data: existing } = await supabase
        .from('agenda_entries')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .single();

      if (existing) {
        // Update existing entry
        const { error } = await supabase
          .from('agenda_entries')
          .update({ pinned })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Create new entry
        const { error } = await supabase
          .from('agenda_entries')
          .insert({ user_id: userId, post_id: postId, pinned });
        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('setPinned error:', error);
      return false;
    }
  },

  likePost: async (postId: string) => {
    try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return false;

        // Check if already liked
        const { data: existing } = await supabase
            .from('likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', session.session.user.id)
            .single();

        if (existing) {
            // Unlike
            await supabase.from('likes').delete().eq('id', existing.id);
            // Decrement in posts (optional trigger usually handles this)
             await supabase.rpc('decrement_likes', { row_id: postId });
        } else {
            // Like
            await supabase.from('likes').insert({ post_id: postId, user_id: session.session.user.id });
             await supabase.rpc('increment_likes', { row_id: postId });
        }
        return true;
    } catch (error) {
        console.error('likePost error:', error);
        return false;
    }
  },

  createPost: async (content: string, type: 'standard' | 'janaza' | 'sick_visit' | 'general' | 'event' = 'standard', metadata: any = {}, imageUrl?: string, location?: { lat: number; lng: number }) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('Not authenticated');

      const { error } = await supabase.from('posts').insert({
        user_id: session.session.user.id,
        content,
        type,
        metadata,
        image_url: imageUrl,
        lat: location?.lat,
        lng: location?.lng,
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('createPost error:', error);
      return false;
    }
  },

  uploadImage: async (uri: string): Promise<string | null> => {
    try {
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      };

      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
       console.error('uploadImage error:', error);
       return null;
    }
  },

  getComments: async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
            *,
            user:profiles(id, full_name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

        if (error) throw error;
        
        return data.map((c: any) => ({
            id: c.id,
            user: {
                id: c.user?.id,
                name: c.user?.full_name,
                avatar: c.user?.avatar_url
            },
            content: c.content,
            created_at: c.created_at,
            is_approved: c.is_approved
        }));
    } catch (error) {
       console.error('getComments error:', error);
       return [];
    }
  },

  approveComment: async (commentId: string) => {
      try {
          const { error } = await supabase
              .from('comments')
              .update({ is_approved: true })
              .eq('id', commentId);
          return !error;
      } catch (e) {
          return false;
      }
  },

  deleteComment: async (commentId: string) => {
      try {
          const { error } = await supabase.from('comments').delete().eq('id', commentId);
          return !error;
      } catch (e) {
          return false;
      }
  },

  addComment: async (postId: string, content: string, postType: string = 'standard') => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('Not authenticated');

      // Moderation: Janaza/SickVisit comments default to unapproved
      const isApproved = !['janaza', 'sick_visit'].includes(postType); // default true for others

      const { data, error } = await supabase.from('comments').insert({
          post_id: postId,
          user_id: session.session.user.id,
          content,
          is_approved: isApproved
      }).select(`
        *,
        user:profiles(id, full_name, avatar_url)
      `).single();
      
      if (error) throw error;
      
      return {
            id: data.id,
            user: {
                id: data.user?.id,
                name: data.user?.full_name,
                avatar: data.user?.avatar_url
            },
            content: data.content,
            created_at: data.created_at,
            is_approved: data.is_approved
      };
    } catch (error) {
        console.error('addComment error:', error);
        return null;
    }
  },

  // --- Notifications ---

  getNotifications: async () => {
    try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return [];

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', session.session.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('getNotifications error:', error);
        return [];
    }
  },

  markNotificationRead: async (notificationId: string) => {
      try {
          await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);
          return true;
      } catch (error) {
          console.error(error);
          return false;
      }
  },

  sharePost: async (content: string) => {
    try {
      await Share.share({
        message: content,
      });
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  },



  createMatch: async (opponentId: string) => {
      try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { error } = await supabase.from('matches').insert({
              challenger_id: session.session.user.id,
              opponent_id: opponentId,
              status: 'pending'
          });
          
          if (error) throw error;
          return true;
      } catch(e) {
          console.error('createMatch error:', e);
          return false;
      }
  },

  getMatches: async () => {
      try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) return [];

          const userId = session.session.user.id;

          const { data, error } = await supabase
              .from('matches')
              .select(`
                  *,
                  challenger:profiles!challenger_id(*),
                  opponent:profiles!opponent_id(*)
              `)
              .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`);

          if (error) throw error;
          return data;
      } catch (error) {
          console.error('getMatches error:', error);
          return [];
      }
  },

  updateMatchStatus: async (matchId: string, status: 'accepted' | 'rejected') => {
      try {
          const { error } = await supabase
              .from('matches')
              .update({ status })
              .eq('id', matchId);
          
          if (error) throw error;
          return true;
      } catch (error) {
          console.error('updateMatchStatus error:', error);
          return false;
      }
  },

  // --- Chat ---

  getMessages: async (otherUserId: string) => {
      try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) return [];
          const myId = session.session.user.id;

          const { data, error } = await supabase
              .from('messages')
              .select('*')
              .or(`and(sender_id.eq.${myId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${myId})`)
              .order('created_at', { ascending: true });

          if (error) throw error;
          return data;
      } catch (error) {
          console.error('getMessages error:', error);
          return [];
      }
  },

  sendMessage: async (receiverId: string, content: string) => {
      try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { error } = await supabase
              .from('messages')
              .insert({
                  sender_id: session.session.user.id,
                  receiver_id: receiverId,
                  content
              });

          if (error) throw error;
          return true;
      } catch (error) {
          console.error('sendMessage error:', error);
          return false;
      }
  },

  // --- Mosques ---

  getMosques: async (): Promise<Mosque[]> => {
    try {
      const { data, error } = await supabase.from('mosques').select('*');
      if (error) throw error;

      return data.map((m: any) => ({
        id: m.id,
        name: m.name,
        latitude: m.lat,
        longitude: m.lng,
        address: m.address,
        distance: undefined,
        hasWomenSection: m.has_women_section,
        hasQuranSession: m.has_quran_session,
        parkingAvailable: m.parking_available || false,
        wheelchairAccess: m.wheelchair_access || false,
        kidsArea: m.kids_area || false,
        wuduArea: m.wudu_area || false,
        capacity: m.capacity ? parseInt(m.capacity) : 0,
        jummahTime: m.jummah_time,
        adminPinned: true, 
        images: m.image_url ? [m.image_url] : [],
      }));
    } catch (error) {
      console.error('getMosques error:', error);
      return MOCK_MOSQUES;
    }
  },

  addMosque: async (data: Omit<Mosque, 'id' | 'images' | 'distance' | 'adminPinned'>, imageUri: string) => {
       try {
           let imageUrl = null;
           if (imageUri) {
               imageUrl = await socialService.uploadImage(imageUri);
           }

           const { error } = await supabase.from('mosques').insert({
               name: data.name,
               address: data.address,
               lat: data.latitude,
               lng: data.longitude,
               capacity: data.capacity?.toString(),
               has_women_section: data.hasWomenSection,
               has_quran_session: data.hasQuranSession,
               parking_available: data.parkingAvailable,
               jummah_time: data.jummahTime,
               wheelchair_access: data.wheelchairAccess,
               kids_area: data.kidsArea,
               wudu_area: data.wuduArea,
               image_url: imageUrl
           });

           if (error) throw error;
           return true;
       } catch (error) {
           console.error('addMosque error:', error);
           return false;
       }
  },

  // --- Quiz Management ---

  getQuestions: async (limit: number = 50): Promise<Question[]> => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .limit(limit)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('getQuestions error:', error);
      return [];
    }
  },

  addQuestion: async (question: Omit<Question, 'id'>) => {
      try {
          const { error } = await supabase
              .from('questions')
              .insert(question);
          
          if (error) throw error;
          return true;
      } catch (error) {
          console.error('addQuestion error:', error);
          return false;
      }
  },

  deleteQuestion: async (id: string) => {
      try {
          const { error } = await supabase
              .from('questions')
              .delete()
              .eq('id', id);
          
          if (error) throw error;
          return true;
      } catch (error) {
          console.error('deleteQuestion error:', error);
          return false;
      }
  },

  // --- New Quiz Architecture ---

  getQuizCategories: async (): Promise<QuizCategory[]> => {
      try {
          const { data, error } = await supabase
              .from('quiz_categories')
              .select('*')
              .order('name');
          if (error) throw error;
          return data;
      } catch (error) {
          console.error('getQuizCategories error:', error);
          return [];
      }
  },

  getQuizzesByCategory: async (categoryId: string): Promise<Quiz[]> => {
      try {
          const { data, error } = await supabase
              .from('quizzes')
              .select('*')
              .eq('category_id', categoryId)
              .order('created_at', { ascending: false });
          if (error) throw error;
          return data;
      } catch (error) {
          console.error('getQuizzesByCategory error:', error);
          return [];
      }
  },


  // --- Dua Management ---

  getDuas: async (category?: string): Promise<Dua[]> => {
      try {
          let query = supabase.from('duas').select('*').order('title');
          if (category) {
              query = query.eq('category', category);
          }
          const { data, error } = await query;
          if (error) throw error;
          return data || [];
      } catch (error) {
          console.error('getDuas error:', error);
          return [];
      }
  },

  getDuaCategories: async (): Promise<string[]> => {
      try {
          // Verify if we can use distinct with supabase js or just fetch all and filter
          const { data, error } = await supabase.from('duas').select('category');
          if (error) throw error;
          // specific distinct logic might be needed if RPC not available, standard JS Set for now
          const categories = Array.from(new Set(data.map((d: any) => d.category)));
          return categories;
      } catch (error) {
          console.error('getDuaCategories error:', error);
          return [];
      }
  },

  addDua: async (dua: Omit<Dua, 'id' | 'created_at'>) => {
      try {
          const { error } = await supabase.from('duas').insert(dua);
          if (error) throw error;
          return true;
      } catch (error) {
          console.error('addDua error:', error);
          return false;
      }
  },

  updateDua: async (id: string, dua: Partial<Dua>) => {
      try {
          const { error } = await supabase.from('duas').update(dua).eq('id', id);
          if (error) throw error;
          return true;
      } catch (error) {
          console.error('updateDua error:', error);
          return false;
      }
  },

  deleteDua: async (id: string) => {
      try {
          const { error } = await supabase.from('duas').delete().eq('id', id);
          if (error) throw error;
          return true;
      } catch (error) {
          console.error('deleteDua error:', error);
          return false;
      }
  },

  getQuestionsByCategoryId: async (categoryId: string): Promise<QuizQuestion[]> => {
      try {
        // 1. Get a quiz for this category (random or first)
        const { data: quizzes } = await supabase
            .from('quizzes')
            .select('id')
            .eq('category_id', categoryId)
            .limit(1);

        if (!quizzes || quizzes.length === 0) return [];
        const quizId = quizzes[0].id;

        // 2. Get questions for this quiz
        const { data: questions, error } = await supabase
            .from('quiz_questions')
            .select('*')
            .eq('quiz_id', quizId)
            .limit(10);
        
        if (error) throw error;
        return questions || [];
      } catch (error) {
          console.error('getQuestionsByCategoryId error:', error);
          return [];
      }
  },

  getUser: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      // Fetch profile for admin status
      const { data: profile } = await supabase.from('profiles').select('*, is_admin').eq('id', session.user.id).single();
      return { ...session.user, isAdmin: profile?.is_admin };
  },

  deletePost: async (postId: string) => {
    try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) throw new Error('Not authenticated');

        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('deletePost error:', error);
        return false;
    }
  },

  // Progress & Achievements
  saveQuizProgress: async (quizId: string, index: number, score: number, status: 'in_progress' | 'completed' = 'in_progress') => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
          .from('user_quiz_progress')
          .upsert({
              user_id: session.user.id,
              quiz_id: quizId,
              current_question_index: index,
              score: score,
              status: status,
              updated_at: new Date().toISOString()
          }, { onConflict: 'user_id, quiz_id' });

      if (error) console.error('Error saving progress:', error);
  },

  getQuizProgress: async (quizId: string): Promise<QuizProgress | null> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data, error } = await supabase
          .from('user_quiz_progress')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('quiz_id', quizId)
          .single();

      if (error || !data) return null;
      return data;
  },

  getUserAchievements: async (): Promise<Achievement[]> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      // Fetch all achievements
      const { data: allAchievements, error: aError } = await supabase
          .from('achievements')
          .select('*');

      if (aError) return [];

      // Fetch user earned achievements
      const { data: earned, error: eError } = await supabase
          .from('user_achievements')
          .select('achievement_id, earned_at')
          .eq('user_id', session.user.id);

      if (eError) return [];
      
      const earnedMap = new Map(earned?.map(e => [e.achievement_id, e.earned_at]));

      return allAchievements.map(a => ({
          ...a,
          earned_at: earnedMap.get(a.id)
      }));
  }
};

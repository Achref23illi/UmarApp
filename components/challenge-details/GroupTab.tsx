import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

type Participant = {
  id: string;
  name: string;
  updatedAt?: string | null;
  active: boolean;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  updated_at: string | null;
};

export default function GroupTab() {
  const { colors } = useTheme();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: session } = await supabase.auth.getSession();
        const myId = session.session?.user?.id;

        const { data, error: dbError } = await supabase
          .from('public_profiles')
          .select('id, full_name, updated_at')
          .order('updated_at', { ascending: false })
          .limit(12);

        if (dbError) throw dbError;

        const list = ((data ?? []) as ProfileRow[])
          .filter((p) => (myId ? p.id !== myId : true))
          .map<Participant>((p) => ({
            id: p.id,
            name: p.full_name || 'User',
            updatedAt: p.updated_at,
            active: false,
          }));

        if (!isActive) return;
        const firstId = list[0]?.id ?? null;
        setActiveId(firstId);
        setParticipants(list.map((p) => ({ ...p, active: firstId ? p.id === firstId : false })));
      } catch (e) {
        console.error('Failed to load group participants:', e);
        if (!isActive) return;
        setParticipants([]);
        setActiveId(null);
        setError('Unable to load participants');
      } finally {
        if (!isActive) return;
        setIsLoading(false);
      }
    };

    load();

    return () => {
      isActive = false;
    };
  }, []);

  const activeParticipant = participants.find((p) => p.id === activeId) || null;

  const lastConnection =
    activeParticipant?.updatedAt ? new Date(activeParticipant.updatedAt).toLocaleString() : '—';

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.participantsContainer}>
        <Text style={[styles.participantsTitle, { color: colors.text.primary }]}>
          {participants.length} participants
        </Text>

        {isLoading ? (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error ? (
          <Text style={{ color: colors.text.secondary }}>{error}</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.participantsScroll}>
            {participants.map((p) => (
              <Pressable
                key={p.id}
                style={styles.participantItem}
                onPress={() => {
                  setActiveId(p.id);
                  setParticipants((prev) => prev.map((x) => ({ ...x, active: x.id === p.id })));
                }}
              >
                <View
                  style={[
                    styles.avatarContainer,
                    { backgroundColor: colors.surfaceHighlight },
                    p.active && { borderColor: colors.primary, borderWidth: 2 },
                  ]}
                >
                  <Ionicons name="person" size={28} color={p.active ? colors.primary : colors.text.disabled} />
                </View>
                <Text style={[styles.participantName, { color: p.active ? colors.primary : colors.text.secondary }]} numberOfLines={1}>
                  {p.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
          {activeParticipant ? `Profil: ${activeParticipant.name}` : 'Profil'}
        </Text>
        <Text style={[styles.cardSubtitle, { color: colors.text.secondary }]}>Dernière connexion: {lastConnection}</Text>
        <Text style={[styles.cardHint, { color: colors.text.secondary }]}>
          Le classement et la progression de groupe seront affichés ici.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  participantsContainer: {
    marginBottom: 16,
    paddingLeft: 16,
  },
  participantsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  participantsScroll: {
    paddingRight: 20,
  },
  participantItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 72,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  participantName: {
    fontSize: 12,
    textAlign: 'center',
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12,
  },
  cardHint: {
    fontSize: 12,
    marginTop: 6,
  },
});

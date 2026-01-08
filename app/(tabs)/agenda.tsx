import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { PostItem } from '@/components/feed/PostItem';
import { PrayerBanner } from '@/components/prayer/PrayerBanner';
import { Colors } from '@/config/colors';
import { Post, socialService } from '@/services/socialService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setAgendaEntries } from '@/store/slices/agendaSlice';

type FilterType = 'janaza' | 'sick_visit';

export default function AgendaScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const agendaState = useAppSelector((s) => s.agenda);
  const [filter, setFilter] = useState<FilterType>('janaza');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const data = await socialService.getAgendaPosts();
      if (mounted) {
        setPosts(data);
        dispatch(
          setAgendaEntries({
            ids: data.map((p) => p.id),
            pinnedIds: data.filter((p) => p.pinned).map((p) => p.id),
          })
        );
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    const data = await socialService.getAgendaPosts();
    setPosts(data);
    dispatch(
      setAgendaEntries({
        ids: data.map((p) => p.id),
        pinnedIds: data.filter((p) => p.pinned).map((p) => p.id),
      })
    );
    setRefreshing(false);
  };

  const filtered = posts.filter((p) => (filter === 'janaza' ? p.type === 'janaza' : p.type === 'sick_visit'));

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <PrayerBanner style={styles.banner} />

      <View style={styles.toggleRow}>
        <Pressable
          onPress={() => setFilter('janaza')}
          style={[styles.toggleButton, filter === 'janaza' && styles.toggleActive]}
        >
          <Text style={[styles.toggleText, filter === 'janaza' && styles.toggleTextActive]}>Salat janaza</Text>
        </Pressable>
        <Pressable
          onPress={() => setFilter('sick_visit')}
          style={[styles.toggleButton, filter === 'sick_visit' && styles.toggleActive]}
        >
          <Text style={[styles.toggleText, filter === 'sick_visit' && styles.toggleTextActive]}>
            Visites aux malades
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.palette.purple.primary} />}
        >
          {filtered.length > 0 ? (
            filtered.map((post) => <PostItem key={post.id} post={post} />)
          ) : (
            <Text style={styles.empty}>{t('feed.noPosts') || 'Aucune annonce pour le moment.'}</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8fb' },
  banner: { marginHorizontal: 12, marginBottom: 8 },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#ECECF5',
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: Colors.palette.purple.primary,
  },
  toggleText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 13,
  },
  toggleTextActive: {
    color: '#FFF',
  },
  empty: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 24,
  },
});

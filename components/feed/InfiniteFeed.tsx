import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Fonts } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { Post, socialService } from '@/services/socialService';
import { useTranslation } from 'react-i18next';

import { JanazaPostItem } from './JanazaPostItem';
import { PostItem } from './PostItem';

interface InfiniteFeedProps {
  ListHeaderComponent?: React.ReactElement | null;
  userId?: string;
  userLocation?: { lat: number; lng: number };
}

export function InfiniteFeed({ ListHeaderComponent, userId, userLocation }: InfiniteFeedProps) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(false);

  const fetchPosts = useCallback(async (pageNum: number, shouldRefresh = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      setError(false);
      
      const newPosts = await socialService.getPosts(pageNum, userId, userLocation);
      
      // Sort posts: pinned first, then by timestamp
      const sortedPosts = [...newPosts].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      
      if (shouldRefresh) {
        setPosts(sortedPosts);
      } else {
        setPosts(prev => {
          // Combine and re-sort to ensure pinned posts stay at top
          const combined = [...prev, ...sortedPosts];
          return combined.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
          });
        });
      }
      
      setHasMore(newPosts.length > 0);
    } catch (error) {
      console.error('Failed to fetch posts', error);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(1, true);
  }, [fetchPosts]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchPosts(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && !refreshing && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage);
    }
  };

  const renderItem = ({ item, index }: { item: Post; index: number }) => {
    // Animation delay based on index for initial load
    const delay = index < 5 ? index * 100 : 0;
    
    return (
      <Animated.View entering={FadeInDown.delay(delay).springify()}>
        {item.type === 'janaza' ? (
          <JanazaPostItem post={item} />
        ) : (
          <PostItem post={item} />
        )}
      </Animated.View>
    );
  };

  const renderFooter = () => {
    if (!loading || refreshing) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmptyComponent = () => {
      if (loading) {
          return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />;
      }
      
      if (error) {
          return (
              <View style={styles.centerContainer}>
                  <Ionicons name="cloud-offline-outline" size={48} color={colors.text.secondary} />
                  <Text style={[styles.emptyText, { color: colors.text.secondary }]}>{t('feed.noConnection')}</Text>
                  <Pressable onPress={() => fetchPosts(1, true)} style={[styles.retryButton, { backgroundColor: colors.primary }]}>
                      <Text style={styles.retryText}>{t('feed.retry')}</Text>
                  </Pressable>
              </View>
          );
      }

      return (
          <View style={styles.centerContainer}>
              <Ionicons name="documents-outline" size={48} color={colors.text.secondary} />
              <Text style={[styles.emptyText, { color: colors.text.secondary }]}>{t('feed.noPosts')}</Text>
          </View>
      );
  };

  return (
    <FlatList
      data={posts}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      contentContainerStyle={[styles.listContent]}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={renderEmptyComponent}
      ListFooterComponent={renderFooter}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 150,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  centerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 60,
      gap: 12,
  },
  emptyText: {
      fontSize: 16,
      fontFamily: Fonts.medium,
  },
  retryButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
  },
  retryText: {
      color: '#FFF',
      fontWeight: '600',
  },
});

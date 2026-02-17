import { Fonts } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { adminService } from '@/services/adminService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logoutUser } from '@/store/slices/userSlice';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Dimensions,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 52) / 3;
const CARD_HEIGHT = 125;

interface Analytics {
  totalUsers: number;
  totalPosts: number;
  totalMosques: number;
  totalComments: number;
  totalLikes: number;
  recentPosts: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const userData = useAppSelector((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalUsers: 0,
    totalPosts: 0,
    totalMosques: 0,
    totalComments: 0,
    totalLikes: 0,
    recentPosts: 0,
  });

  // Refresh when screen comes into focus (e.g., returning from add-mosque)
  useFocusEffect(
    React.useCallback(() => {
      fetchAnalytics();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  const fetchAnalytics = async () => {
    try {
      const overview = await adminService.analytics.getOverview();
      const metrics = overview.metrics;

      setAnalytics({
        totalUsers: metrics.totalUsers || 0,
        totalPosts: metrics.totalPosts || 0,
        totalMosques: metrics.totalMosques || 0,
        totalComments: metrics.totalComments || 0,
        totalLikes: metrics.totalLikes || 0,
        recentPosts: metrics.recentPosts || 0,
      });
    } catch (error) {
      console.error('Admin analytics API failed, falling back to direct queries:', error);
      // Fallback: query Supabase directly so the stats bar always shows real data
      try {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const [usersRes, postsRes, mosquesRes, commentsRes, likesRes, recentRes] =
          await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('posts').select('*', { count: 'exact', head: true }),
            supabase.from('mosques').select('*', { count: 'exact', head: true }),
            supabase.from('comments').select('*', { count: 'exact', head: true }),
            supabase.from('likes').select('*', { count: 'exact', head: true }),
            supabase
              .from('posts')
              .select('*', { count: 'exact', head: true })
              .gte('created_at', weekAgo),
          ]);

        setAnalytics({
          totalUsers: usersRes.count ?? 0,
          totalPosts: postsRes.count ?? 0,
          totalMosques: mosquesRes.count ?? 0,
          totalComments: commentsRes.count ?? 0,
          totalLikes: likesRes.count ?? 0,
          recentPosts: recentRes.count ?? 0,
        });
      } catch (fallbackError) {
        console.error('Fallback analytics also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    router.replace('/');
  };

  const { t } = useTranslation();

  const menuItems = [
    {
      id: 'mosques',
      title: t('admin.addMosque'),
      subtitle: t('admin.addNewMosque'),
      icon: 'location',
      gradient: ['#6366F1', '#8B5CF6'] as const,
      route: '/admin/add-mosque',
    },
    {
      id: 'users',
      title: t('admin.users'),
      subtitle: `${analytics.totalUsers} ${t('admin.registered')}`,
      icon: 'people',
      gradient: ['#10B981', '#059669'] as const,
      route: '/admin/users',
    },
    {
      id: 'posts',
      title: t('admin.posts'),
      subtitle: `${analytics.totalPosts} ${t('admin.total')}`,
      icon: 'document-text',
      gradient: ['#F59E0B', '#D97706'] as const,
      route: '/admin/posts',
    },
    {
      id: 'analytics',
      title: t('admin.analytics'),
      subtitle: t('admin.viewInsights'),
      icon: 'stats-chart',
      gradient: ['#EF4444', '#DC2626'] as const,
      route: '/admin/analytics',
    },
    {
      id: 'challenges',
      title: t('admin.challenges'),
      subtitle: t('admin.manageContent'),
      icon: 'trophy',
      gradient: ['#0EA5E9', '#2563EB'] as const,
      route: '/admin/challenges',
    },
    {
      id: 'quizzes',
      title: t('admin.quizzes'),
      subtitle: t('admin.manageQuizzes'),
      icon: 'school',
      gradient: ['#8B5CF6', '#7C3AED'] as const,
      route: '/admin/quizzes',
    },
    {
      id: 'duas',
      title: t('admin.duas'),
      subtitle: t('admin.manageDuas'),
      icon: 'book',
      gradient: ['#14B8A6', '#0D9488'] as const,
      route: '/admin/duas',
    },
  ];

  if (loading) {
    return (
      <View
        style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text
              style={[styles.greeting, { color: colors.text.secondary, fontFamily: Fonts.medium }]}
            >
              {t('admin.welcomeBack')}
            </Text>
            <Text style={[styles.title, { color: colors.text.primary, fontFamily: Fonts.bold }]}>
              {userData.name || 'Admin'}
            </Text>
          </View>
          <Pressable
            onPress={handleLogout}
            style={[styles.logoutButton, { backgroundColor: colors.surface }]}
          >
            <Ionicons name="log-out-outline" size={22} color={colors.text.primary} />
          </Pressable>
        </View>

        {/* Stats Overview */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
          <Text
            style={[styles.statsTitle, { color: colors.text.primary, fontFamily: Fonts.semiBold }]}
          >
            {t('admin.quickStats')}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary, fontFamily: Fonts.bold }]}>
                {analytics.recentPosts}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: colors.text.secondary, fontFamily: Fonts.regular },
                ]}
              >
                {t('admin.postsWeek')}
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary, fontFamily: Fonts.bold }]}>
                {analytics.totalLikes}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: colors.text.secondary, fontFamily: Fonts.regular },
                ]}
              >
                {t('admin.likes')}
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary, fontFamily: Fonts.bold }]}>
                {analytics.totalComments}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: colors.text.secondary, fontFamily: Fonts.regular },
                ]}
              >
                {t('admin.comments')}
              </Text>
            </View>
          </View>
        </View>

        {/* Menu Grid */}
        <Text
          style={[styles.sectionTitle, { color: colors.text.primary, fontFamily: Fonts.semiBold }]}
        >
          {t('admin.management')}
        </Text>
        <View style={styles.grid}>
          {menuItems.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.card, { width: CARD_WIDTH, height: CARD_HEIGHT }]}
              onPress={() => item.route && router.push(item.route as any)}
              disabled={!item.route}
            >
              <LinearGradient
                colors={item.gradient}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.cardIconContainer}>
                  <Ionicons name={item.icon as any} size={22} color="#FFF" />
                </View>
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, { fontFamily: Fonts.semiBold }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.cardSubtitle, { fontFamily: Fonts.regular }]}>
                    {item.subtitle}
                  </Text>
                </View>
                {!item.route && (
                  <View style={styles.comingSoonBadge}>
                    <Text style={[styles.comingSoonText, { fontFamily: Fonts.medium }]}>
                      {t('admin.soon')}
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </Pressable>
          ))}
        </View>


      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 13,
    marginBottom: 2,
  },
  title: {
    fontSize: 22,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    flex: 1,
    padding: 11,
    justifyContent: 'space-between',
  },
  cardIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    marginTop: 'auto',
  },
  cardTitle: {
    fontSize: 13,
    color: '#FFF',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  comingSoonText: {
    fontSize: 9,
    color: '#FFF',
  },

});

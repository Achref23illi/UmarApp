import { AdminFilters } from '@/components/admin/AdminFilters';
import { AdminScreen } from '@/components/admin/AdminScreen';
import { useTheme } from '@/hooks/use-theme';
import { adminService } from '@/services/adminService';
import {
  AdminAnalyticsOverview,
  AdminContentHealth,
  AdminEngagementBreakdown,
  AdminTimeseriesPoint,
} from '@/types/admin';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

type RangePreset = '7d' | '30d' | '90d';

function getDateRange(preset: RangePreset) {
  const to = new Date();
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export default function AdminAnalyticsScreen() {
  const { colors } = useTheme();
  const [preset, setPreset] = useState<RangePreset>('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [overview, setOverview] = useState<AdminAnalyticsOverview | null>(null);
  const [contentHealth, setContentHealth] = useState<AdminContentHealth | null>(null);
  const [engagement, setEngagement] = useState<AdminEngagementBreakdown | null>(null);
  const [timeseries, setTimeseries] = useState<AdminTimeseriesPoint[]>([]);

  const { from, to } = useMemo(() => getDateRange(preset), [preset]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [overviewRes, contentRes, engagementRes, timeseriesRes] = await Promise.all([
        adminService.analytics.getOverview(from, to),
        adminService.analytics.getContentHealth(from, to),
        adminService.analytics.getEngagementBreakdown(from, to),
        adminService.analytics.getTimeseries('posts_created', from, to),
      ]);

      setOverview(overviewRes);
      setContentHealth(contentRes);
      setEngagement(engagementRes);
      setTimeseries(timeseriesRes.points || []);
    } catch (error) {
      console.error('Failed to load admin analytics', error);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const cards = overview
    ? [
        { label: 'Total Users', value: overview.metrics.totalUsers },
        { label: 'New Users', value: overview.metrics.newUsers },
        { label: 'DAU', value: overview.metrics.dau },
        { label: 'WAU', value: overview.metrics.wau },
        { label: 'Posts', value: overview.metrics.postsCreated },
        { label: 'Pending Posts', value: overview.metrics.pendingPosts },
        { label: 'Pending Comments', value: overview.metrics.pendingComments },
        { label: 'Quiz Attempts', value: overview.metrics.quizAttempts },
      ]
    : [];

  const cardWidth = useMemo(() => {
    const width = Dimensions.get('window').width;
    if (width >= 900) return (width - 64) / 3;
    if (width >= 600) return (width - 52) / 2;
    return (width - 44) / 2;
  }, []);

  const maxSeries = Math.max(1, ...timeseries.map((item) => item.value));

  return (
    <AdminScreen title="Analytics" scroll={false}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 30, gap: 12 }}
        stickyHeaderIndices={[0]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.stickyFilters}>
          <AdminFilters
            options={[
              { key: '7d', label: '7 Days' },
              { key: '30d', label: '30 Days' },
              { key: '90d', label: '90 Days' },
            ]}
            activeKey={preset}
            onChangeOption={(key) => setPreset(key as RangePreset)}
          />

          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: colors.text.secondary }]}>
              Range: {from} to {to}
            </Text>
          </View>
        </View>

        <View style={styles.grid}>
          {cards.map((card) => (
            <View
              key={card.label}
              style={[
                styles.metricCard,
                {
                  width: cardWidth,
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E5EAF2',
                },
              ]}
            >
              <Text style={[styles.metricLabel, { color: colors.text.secondary }]}>
                {card.label}
              </Text>
              <Text style={[styles.metricValue, { color: colors.text.primary }]}>{card.value}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.panel, { backgroundColor: '#FFFFFF', borderColor: '#E5EAF2' }]}>
          <Text style={[styles.panelTitle, { color: colors.text.primary }]}>Posts Timeseries</Text>
          {loading ? <Text style={{ color: colors.text.secondary }}>Loading...</Text> : null}
          {!loading && timeseries.length === 0 ? (
            <Text style={{ color: colors.text.secondary }}>No data</Text>
          ) : null}
          {!loading && timeseries.length > 0 ? (
            <View style={{ gap: 8 }}>
              {timeseries.map((point) => (
                <View key={point.date} style={{ gap: 4 }}>
                  <View style={styles.seriesHeader}>
                    <Text style={[styles.seriesDate, { color: colors.text.secondary }]}>
                      {point.date}
                    </Text>
                    <Text style={[styles.seriesValue, { color: colors.text.primary }]}>
                      {point.value}
                    </Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${(point.value / maxSeries) * 100}%`,
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View style={[styles.rowPanels, { gap: 10 }]}>
          <View
            style={[styles.panel, { flex: 1, backgroundColor: '#FFFFFF', borderColor: '#E5EAF2' }]}
          >
            <Text style={[styles.panelTitle, { color: colors.text.primary }]}>Content Health</Text>
            <Text style={[styles.line, { color: colors.text.secondary }]}>
              Posts Approved: {contentHealth?.posts.approved ?? 0}
            </Text>
            <Text style={[styles.line, { color: colors.text.secondary }]}>
              Posts Pending: {contentHealth?.posts.pending ?? 0}
            </Text>
            <Text style={[styles.line, { color: colors.text.secondary }]}>
              Posts Rejected: {contentHealth?.posts.rejected ?? 0}
            </Text>
            <Text style={[styles.line, { color: colors.text.secondary }]}>
              Comments Pending: {contentHealth?.comments.pending ?? 0}
            </Text>
          </View>

          <View
            style={[styles.panel, { flex: 1, backgroundColor: '#FFFFFF', borderColor: '#E5EAF2' }]}
          >
            <Text style={[styles.panelTitle, { color: colors.text.primary }]}>Engagement</Text>
            <Text style={[styles.line, { color: colors.text.secondary }]}>
              Likes: {engagement?.metrics.likes ?? 0}
            </Text>
            <Text style={[styles.line, { color: colors.text.secondary }]}>
              Comments: {engagement?.metrics.comments ?? 0}
            </Text>
            <Text style={[styles.line, { color: colors.text.secondary }]}>
              Avg comments/post: {engagement?.metrics.avgCommentsPerPost ?? 0}
            </Text>
            <Text style={[styles.line, { color: colors.text.secondary }]}>
              Challenge completions: {engagement?.metrics.challengeCompletions ?? 0}
            </Text>
          </View>
        </View>
      </ScrollView>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  stickyFilters: {
    backgroundColor: '#F6F8FB',
    paddingBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 78,
    justifyContent: 'space-between',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  panel: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  line: {
    fontSize: 13,
    fontWeight: '500',
  },
  seriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  seriesDate: {
    fontSize: 11,
  },
  seriesValue: {
    fontSize: 11,
    fontWeight: '600',
  },
  barTrack: {
    height: 8,
    borderRadius: 99,
    backgroundColor: '#E9EEF5',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 99,
  },
  rowPanels: {
    flexDirection: 'row',
  },
});

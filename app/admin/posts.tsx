import { AdminFilters } from '@/components/admin/AdminFilters';
import { AdminList } from '@/components/admin/AdminList';
import { AdminScreen } from '@/components/admin/AdminScreen';
import { useTheme } from '@/hooks/use-theme';
import { adminService } from '@/services/adminService';
import { AdminComment, AdminModerationStatus, AdminPost } from '@/types/admin';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type ContentTab = 'posts' | 'comments';

export default function AdminPostsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [contentTab, setContentTab] = useState<ContentTab>('posts');
  const [status, setStatus] = useState<AdminModerationStatus | ''>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [comments, setComments] = useState<AdminComment[]>([]);

  const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set());
  const [detailItem, setDetailItem] = useState<AdminPost | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      if (contentTab === 'posts') {
        const response = await adminService.posts.list({
          status: status || undefined,
          q: search || undefined,
          page: 1,
          limit: 200,
        });
        setPosts(response.items || []);
      } else {
        const response = await adminService.comments.list({
          status: status || undefined,
          q: search || undefined,
          page: 1,
          limit: 200,
        });
        setComments(response.items || []);
      }
    } catch (error: any) {
      console.error('Failed to load moderation data', error);
      Alert.alert('Error', error?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [contentTab, search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const toggleSelection = (id: string) => {
    setSelectedPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const applyBulk = async (nextStatus: AdminModerationStatus) => {
    const ids = Array.from(selectedPostIds);
    if (!ids.length) return;

    try {
      await Promise.all(ids.map((id) => adminService.posts.moderate(id, nextStatus)));
      setSelectedPostIds(new Set());
      await load();
    } catch {
      Alert.alert('Error', 'Failed to apply bulk moderation action');
    }
  };

  const moderatePost = async (id: string, nextStatus: AdminModerationStatus) => {
    try {
      await adminService.posts.moderate(id, nextStatus);
      await load();
    } catch {
      Alert.alert('Error', 'Failed to update moderation status');
    }
  };

  const deletePost = async (id: string) => {
    Alert.alert('Delete post', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminService.posts.remove(id);
            await load();
          } catch {
            Alert.alert('Error', 'Failed to delete post');
          }
        },
      },
    ]);
  };

  const approveComment = async (id: string) => {
    try {
      await adminService.comments.approve(id);
      await load();
    } catch {
      Alert.alert('Error', 'Failed to approve comment');
    }
  };

  const deleteComment = async (id: string) => {
    try {
      await adminService.comments.remove(id);
      await load();
    } catch {
      Alert.alert('Error', 'Failed to delete comment');
    }
  };

  const statusOptions = useMemo(() => {
    if (contentTab === 'posts') {
      return [
        { key: '', label: 'All' },
        { key: 'pending', label: 'Pending' },
        { key: 'approved', label: 'Approved' },
        { key: 'rejected', label: 'Rejected' },
      ];
    }

    return [
      { key: '', label: 'All' },
      { key: 'pending', label: 'Pending' },
      { key: 'approved', label: 'Approved' },
    ];
  }, [contentTab]);

  return (
    <AdminScreen
      title="Posts Control"
      scroll={false}
      right={
        contentTab === 'posts' ? (
          <Pressable onPress={() => router.push('/admin/create-post' as any)} hitSlop={8}>
            <Ionicons name="add-circle" size={24} color={colors.primary} />
          </Pressable>
        ) : undefined
      }
    >
      <View style={{ flex: 1, gap: 12 }}>
        <AdminFilters
          search={search}
          onChangeSearch={setSearch}
          options={[
            { key: 'posts', label: 'Posts' },
            { key: 'comments', label: 'Comments' },
          ]}
          activeKey={contentTab}
          onChangeOption={(key) => {
            setContentTab(key as ContentTab);
            setStatus('');
            setSelectedPostIds(new Set());
          }}
        />

        <AdminFilters
          options={statusOptions}
          activeKey={status}
          onChangeOption={(key) => setStatus(key as AdminModerationStatus)}
        />

        {contentTab === 'posts' && selectedPostIds.size > 0 ? (
          <View style={styles.bulkBar}>
            <Text style={[styles.bulkText, { color: colors.text.primary }]}>
              {selectedPostIds.size} selected
            </Text>
            <View style={styles.bulkActions}>
              <Pressable
                onPress={() => applyBulk('approved')}
                style={[styles.actionChip, { backgroundColor: '#10B981' }]}
              >
                <Text style={styles.actionChipText}>Approve</Text>
              </Pressable>
              <Pressable
                onPress={() => applyBulk('rejected')}
                style={[styles.actionChip, { backgroundColor: '#EF4444' }]}
              >
                <Text style={styles.actionChipText}>Reject</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {contentTab === 'posts' ? (
          <AdminList
            data={posts}
            loading={loading}
            refreshing={refreshing}
            onRefresh={onRefresh}
            keyExtractor={(item) => item.id}
            emptyText="No posts"
            renderItem={({ item }) => {
              const selected = selectedPostIds.has(item.id);
              return (
                <Pressable
                  onPress={() => setDetailItem(item)}
                  style={[
                    styles.card,
                    {
                      backgroundColor: '#FFFFFF',
                      borderColor: selected ? colors.primary : '#E5EAF2',
                    },
                  ]}
                >
                  <View style={styles.cardTopRow}>
                    <Pressable onPress={() => toggleSelection(item.id)} style={styles.checkbox}>
                      <Ionicons
                        name={selected ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={selected ? colors.primary : '#8B98A8'}
                      />
                    </Pressable>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.nameText, { color: colors.text.primary }]}>
                        {item.user?.full_name || 'Unknown'}
                      </Text>
                      <Text
                        style={[styles.subText, { color: colors.text.secondary }]}
                        numberOfLines={1}
                      >
                        {item.content || '(no content)'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            item.moderation_status === 'approved'
                              ? 'rgba(16,185,129,0.15)'
                              : item.moderation_status === 'rejected'
                                ? 'rgba(239,68,68,0.15)'
                                : 'rgba(245,158,11,0.18)',
                        },
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>{item.moderation_status}</Text>
                    </View>
                  </View>
                  <View style={styles.rowActions}>
                    <Pressable
                      onPress={() => moderatePost(item.id, 'approved')}
                      style={[styles.smallBtn, { backgroundColor: '#10B981' }]}
                    >
                      <Text style={styles.smallBtnText}>Approve</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => moderatePost(item.id, 'rejected')}
                      style={[styles.smallBtn, { backgroundColor: '#EF4444' }]}
                    >
                      <Text style={styles.smallBtnText}>Reject</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => deletePost(item.id)}
                      style={[styles.smallBtn, { backgroundColor: '#0F172A' }]}
                    >
                      <Text style={styles.smallBtnText}>Delete</Text>
                    </Pressable>
                  </View>
                </Pressable>
              );
            }}
          />
        ) : (
          <AdminList
            data={comments}
            loading={loading}
            refreshing={refreshing}
            onRefresh={onRefresh}
            keyExtractor={(item) => item.id}
            emptyText="No comments"
            renderItem={({ item }) => (
              <View style={[styles.card, { backgroundColor: '#FFFFFF', borderColor: '#E5EAF2' }]}>
                <Text style={[styles.nameText, { color: colors.text.primary }]}>
                  {item.user?.full_name || 'Unknown'}
                </Text>
                <Text style={[styles.subText, { color: colors.text.secondary }]}>
                  {item.content}
                </Text>
                <Text style={[styles.subText, { color: colors.text.secondary }]}>
                  Post: {item.post?.type || 'unknown'}
                </Text>
                <View style={styles.rowActions}>
                  <Pressable
                    onPress={() => approveComment(item.id)}
                    style={[styles.smallBtn, { backgroundColor: '#10B981' }]}
                  >
                    <Text style={styles.smallBtnText}>Approve</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => deleteComment(item.id)}
                    style={[styles.smallBtn, { backgroundColor: '#EF4444' }]}
                  >
                    <Text style={styles.smallBtnText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            )}
          />
        )}
      </View>

      <Modal
        visible={!!detailItem}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Post Details</Text>
              <Pressable onPress={() => setDetailItem(null)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 420 }}>
              <Text style={[styles.modalLabel, { color: colors.text.secondary }]}>Author</Text>
              <Text style={[styles.modalValue, { color: colors.text.primary }]}>
                {detailItem?.user?.full_name || 'Unknown'}
              </Text>
              <Text style={[styles.modalLabel, { color: colors.text.secondary }]}>Status</Text>
              <Text style={[styles.modalValue, { color: colors.text.primary }]}>
                {detailItem?.moderation_status}
              </Text>
              <Text style={[styles.modalLabel, { color: colors.text.secondary }]}>Content</Text>
              <Text style={[styles.modalValue, { color: colors.text.primary }]}>
                {detailItem?.content || '(no content)'}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  bulkBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5EAF2',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bulkText: {
    fontSize: 13,
    fontWeight: '700',
  },
  bulkActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionChip: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
    color: '#111827',
  },
  nameText: {
    fontSize: 14,
    fontWeight: '700',
  },
  subText: {
    fontSize: 12,
    marginTop: 2,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  smallBtn: {
    minHeight: 34,
    borderRadius: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  modalLabel: {
    fontSize: 12,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  modalValue: {
    fontSize: 14,
    marginTop: 4,
  },
});

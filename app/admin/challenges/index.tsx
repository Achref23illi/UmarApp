import { AdminFilters } from '@/components/admin/AdminFilters';
import { AdminList } from '@/components/admin/AdminList';
import { AdminScreen } from '@/components/admin/AdminScreen';
import { useTheme } from '@/hooks/use-theme';
import { adminService } from '@/services/adminService';
import { AdminChallengeCategory } from '@/types/admin';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

const EMPTY_FORM = {
  slug: '',
  title: '',
  subtitle: '',
  duration: '3 weeks',
  levels: '3 levels',
  prerequisite: 'None',
  icon_name: 'book-outline',
  color: '#5A67D8',
  is_enabled: true,
};

export default function AdminChallengesScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<AdminChallengeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<AdminChallengeCategory | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.challenges.listCategories({
        q: search || undefined,
        page: 1,
        limit: 200,
      });
      setCategories(response.items || []);
    } catch (error: any) {
      console.error('Failed to load challenge categories', error);
      Alert.alert('Load Error', error?.message || 'Failed to load challenge categories');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  };

  const openEdit = (item: AdminChallengeCategory) => {
    setEditing(item);
    setForm({
      slug: item.slug,
      title: item.title,
      subtitle: item.subtitle || '',
      duration: item.duration || '',
      levels: item.levels || '',
      prerequisite: item.prerequisite || '',
      icon_name: item.icon_name || 'book-outline',
      color: item.color || '#5A67D8',
      is_enabled: item.is_enabled !== false,
    });
    setModalVisible(true);
  };

  const save = async () => {
    if (!form.slug.trim() || !form.title.trim()) {
      Alert.alert('Validation', 'Slug and title are required');
      return;
    }

    const payload = {
      slug: form.slug.trim().toLowerCase(),
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      duration: form.duration.trim() || null,
      levels: form.levels.trim() || null,
      prerequisite: form.prerequisite.trim() || null,
      icon_name: form.icon_name.trim() || null,
      color: form.color.trim() || '#5A67D8',
      is_enabled: form.is_enabled,
    };

    try {
      if (editing) {
        await adminService.challenges.updateCategory(editing.id, payload);
      } else {
        await adminService.challenges.createCategory(payload);
      }
      setModalVisible(false);
      await load();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to save category');
    }
  };

  const remove = (id: string) => {
    Alert.alert('Delete category', 'This will remove category content if related records exist.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminService.challenges.deleteCategory(id);
            await load();
          } catch {
            Alert.alert('Error', 'Failed to delete category');
          }
        },
      },
    ]);
  };

  return (
    <AdminScreen
      title="Challenges"
      scroll={false}
      right={
        <Pressable onPress={openCreate} hitSlop={8}>
          <Ionicons name="add-circle" size={24} color={colors.primary} />
        </Pressable>
      }
    >
      <View style={{ flex: 1, gap: 12 }}>
        <AdminFilters search={search} onChangeSearch={setSearch} />

        <AdminList
          data={categories}
          loading={loading}
          refreshing={refreshing}
          onRefresh={onRefresh}
          keyExtractor={(item) => item.id}
          emptyText="No challenge categories"
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: '#FFFFFF', borderColor: '#E5EAF2' }]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { color: colors.text.primary }]}>{item.title}</Text>
                  <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
                    {item.slug}
                  </Text>
                </View>
                <View
                  style={[
                    styles.enabledPill,
                    {
                      backgroundColor:
                        item.is_enabled === false
                          ? 'rgba(239,68,68,0.15)'
                          : 'rgba(16,185,129,0.15)',
                    },
                  ]}
                >
                  <Text style={styles.enabledText}>
                    {item.is_enabled === false ? 'Disabled' : 'Enabled'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.subtitle, { color: colors.text.secondary }]} numberOfLines={2}>
                {item.description || item.subtitle || 'No description'}
              </Text>

              <View style={styles.actions}>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/admin/challenges/[categoryId]',
                      params: { categoryId: item.id },
                    })
                  }
                  style={[styles.btn, { backgroundColor: '#111827' }]}
                >
                  <Text style={styles.btnText}>Manage</Text>
                </Pressable>
                <Pressable
                  onPress={() => openEdit(item)}
                  style={[styles.btn, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.btnText}>Edit</Text>
                </Pressable>
                <Pressable
                  onPress={() => remove(item.id)}
                  style={[styles.btn, { backgroundColor: '#EF4444' }]}
                >
                  <Text style={styles.btnText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              {editing ? 'Edit category' : 'Create category'}
            </Text>

            <TextInput
              placeholder="Slug"
              value={form.slug}
              onChangeText={(value) => setForm((prev) => ({ ...prev, slug: value }))}
              style={[styles.input, { color: colors.text.primary, borderColor: '#DEE5EF' }]}
              placeholderTextColor={colors.text.secondary}
              autoCapitalize="none"
            />
            <TextInput
              placeholder="Title"
              value={form.title}
              onChangeText={(value) => setForm((prev) => ({ ...prev, title: value }))}
              style={[styles.input, { color: colors.text.primary, borderColor: '#DEE5EF' }]}
              placeholderTextColor={colors.text.secondary}
            />
            <TextInput
              placeholder="Subtitle"
              value={form.subtitle}
              onChangeText={(value) => setForm((prev) => ({ ...prev, subtitle: value }))}
              style={[styles.input, { color: colors.text.primary, borderColor: '#DEE5EF' }]}
              placeholderTextColor={colors.text.secondary}
            />
            <TextInput
              placeholder="Color (#hex)"
              value={form.color}
              onChangeText={(value) => setForm((prev) => ({ ...prev, color: value }))}
              style={[styles.input, { color: colors.text.primary, borderColor: '#DEE5EF' }]}
              placeholderTextColor={colors.text.secondary}
            />

            <View style={styles.switchRow}>
              <Text style={{ color: colors.text.primary, fontWeight: '600' }}>Enabled</Text>
              <Switch
                value={form.is_enabled}
                onValueChange={(value) => setForm((prev) => ({ ...prev, is_enabled: value }))}
                trackColor={{ false: '#CBD5E1', true: colors.primary }}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={[styles.modalBtn, { backgroundColor: '#CBD5E1' }]}
              >
                <Text style={[styles.modalBtnText, { color: '#0F172A' }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={save}
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.modalBtnText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  enabledPill: {
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enabledText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  btn: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
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
    gap: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

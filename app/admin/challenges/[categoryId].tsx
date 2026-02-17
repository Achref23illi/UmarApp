import { AdminScreen } from '@/components/admin/AdminScreen';
import { useTheme } from '@/hooks/use-theme';
import { adminService } from '@/services/adminService';
import { AdminChallengeArticle, AdminChallengeLevel } from '@/types/admin';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

type LevelForm = {
  id?: string;
  level_number: string;
  title: string;
  subtitle: string;
  description: string;
  duration_days: string;
};

type ArticleForm = {
  id?: string;
  title: string;
  content: string;
  sort_order: string;
  level_id: string;
};

const EMPTY_LEVEL_FORM: LevelForm = {
  level_number: '1',
  title: '',
  subtitle: '',
  description: '',
  duration_days: '7',
};

const EMPTY_ARTICLE_FORM: ArticleForm = {
  title: '',
  content: '',
  sort_order: '1',
  level_id: '',
};

export default function AdminChallengeCategoryDetailScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ categoryId: string }>();
  const categoryId = useMemo(
    () => (Array.isArray(params.categoryId) ? params.categoryId[0] : params.categoryId),
    [params.categoryId]
  );

  const [loading, setLoading] = useState(true);
  const [levels, setLevels] = useState<AdminChallengeLevel[]>([]);
  const [articles, setArticles] = useState<AdminChallengeArticle[]>([]);

  const [levelModal, setLevelModal] = useState(false);
  const [articleModal, setArticleModal] = useState(false);
  const [levelForm, setLevelForm] = useState<LevelForm>(EMPTY_LEVEL_FORM);
  const [articleForm, setArticleForm] = useState<ArticleForm>(EMPTY_ARTICLE_FORM);

  const load = useCallback(async () => {
    if (!categoryId) return;

    try {
      setLoading(true);
      const [levelsRes, articlesRes] = await Promise.all([
        adminService.challenges.listLevels({
          categoryId,
          page: 1,
          limit: 200,
        }),
        adminService.challenges.listArticles({
          categoryId,
          page: 1,
          limit: 500,
        }),
      ]);

      setLevels(levelsRes.items || []);
      setArticles(articlesRes.items || []);
    } catch (error) {
      console.error('Failed to load challenge category data', error);
      Alert.alert('Error', 'Failed to load challenge data');
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreateLevel = () => {
    setLevelForm({ ...EMPTY_LEVEL_FORM, level_number: String(levels.length + 1) });
    setLevelModal(true);
  };

  const openEditLevel = (level: AdminChallengeLevel) => {
    setLevelForm({
      id: level.id,
      level_number: String(level.level_number),
      title: level.title,
      subtitle: level.subtitle || '',
      description: level.description || '',
      duration_days: String(level.duration_days),
    });
    setLevelModal(true);
  };

  const saveLevel = async () => {
    if (!categoryId) return;

    const payload = {
      category_id: categoryId,
      level_number: Number.parseInt(levelForm.level_number, 10),
      title: levelForm.title.trim(),
      subtitle: levelForm.subtitle.trim() || null,
      description: levelForm.description.trim() || null,
      duration_days: Number.parseInt(levelForm.duration_days, 10),
    };

    if (!payload.title || !Number.isInteger(payload.level_number) || payload.duration_days < 1) {
      Alert.alert('Validation', 'Please fill valid level fields');
      return;
    }

    try {
      if (levelForm.id) {
        await adminService.challenges.updateLevel(levelForm.id, payload);
      } else {
        await adminService.challenges.createLevel(payload);
      }
      setLevelModal(false);
      await load();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to save level');
    }
  };

  const deleteLevel = (id: string) => {
    Alert.alert('Delete level', 'Delete this level and related progress references?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminService.challenges.deleteLevel(id);
            await load();
          } catch {
            Alert.alert('Error', 'Failed to delete level');
          }
        },
      },
    ]);
  };

  const openCreateArticle = () => {
    setArticleForm({ ...EMPTY_ARTICLE_FORM, sort_order: String(articles.length + 1) });
    setArticleModal(true);
  };

  const openEditArticle = (article: AdminChallengeArticle) => {
    setArticleForm({
      id: article.id,
      title: article.title,
      content: article.content,
      sort_order: String(article.sort_order),
      level_id: article.level_id || '',
    });
    setArticleModal(true);
  };

  const saveArticle = async () => {
    if (!categoryId) return;

    const payload = {
      category_id: categoryId,
      level_id: articleForm.level_id || null,
      title: articleForm.title.trim(),
      content: articleForm.content.trim(),
      sort_order: Number.parseInt(articleForm.sort_order, 10) || 0,
    };

    if (!payload.title || !payload.content) {
      Alert.alert('Validation', 'Title and content are required');
      return;
    }

    try {
      if (articleForm.id) {
        await adminService.challenges.updateArticle(articleForm.id, payload);
      } else {
        await adminService.challenges.createArticle(payload);
      }
      setArticleModal(false);
      await load();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to save article');
    }
  };

  const deleteArticle = (id: string) => {
    Alert.alert('Delete article', 'Delete this article?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminService.challenges.deleteArticle(id);
            await load();
          } catch {
            Alert.alert('Error', 'Failed to delete article');
          }
        },
      },
    ]);
  };

  return (
    <AdminScreen title="Challenge Details" scroll={false}>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 30 }}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Levels</Text>
          <Pressable onPress={openCreateLevel}>
            <Ionicons name="add-circle" size={24} color={colors.primary} />
          </Pressable>
        </View>

        {loading ? <Text style={{ color: colors.text.secondary }}>Loading...</Text> : null}

        {levels.map((level) => (
          <View
            key={level.id}
            style={[styles.card, { backgroundColor: '#FFFFFF', borderColor: '#E5EAF2' }]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
                Level {level.level_number}: {level.title}
              </Text>
              <View style={styles.cardActions}>
                <Pressable onPress={() => openEditLevel(level)}>
                  <Ionicons name="create-outline" size={20} color={colors.primary} />
                </Pressable>
                <Pressable onPress={() => deleteLevel(level.id)}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </Pressable>
              </View>
            </View>
            <Text style={[styles.cardText, { color: colors.text.secondary }]} numberOfLines={2}>
              {level.description || level.subtitle || 'No description'}
            </Text>
            <Text style={[styles.cardText, { color: colors.text.secondary }]}>
              Duration: {level.duration_days} days
            </Text>
          </View>
        ))}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Lecture du jour (Articles)
          </Text>
          <Pressable onPress={openCreateArticle}>
            <Ionicons name="add-circle" size={24} color={colors.primary} />
          </Pressable>
        </View>

        {articles.map((article) => (
          <View
            key={article.id}
            style={[styles.card, { backgroundColor: '#FFFFFF', borderColor: '#E5EAF2' }]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text.primary }]} numberOfLines={1}>
                {article.sort_order}. {article.title}
              </Text>
              <View style={styles.cardActions}>
                <Pressable onPress={() => openEditArticle(article)}>
                  <Ionicons name="create-outline" size={20} color={colors.primary} />
                </Pressable>
                <Pressable onPress={() => deleteArticle(article.id)}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </Pressable>
              </View>
            </View>
            <Text style={[styles.cardText, { color: colors.text.secondary }]} numberOfLines={3}>
              {article.content}
            </Text>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={levelModal}
        transparent
        animationType="slide"
        onRequestClose={() => setLevelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              {levelForm.id ? 'Edit level' : 'Create level'}
            </Text>
            <TextInput
              value={levelForm.level_number}
              onChangeText={(value) => setLevelForm((prev) => ({ ...prev, level_number: value }))}
              keyboardType="numeric"
              placeholder="Level number"
              placeholderTextColor={colors.text.secondary}
              style={[styles.input, { color: colors.text.primary, borderColor: '#DEE5EF' }]}
            />
            <TextInput
              value={levelForm.title}
              onChangeText={(value) => setLevelForm((prev) => ({ ...prev, title: value }))}
              placeholder="Title"
              placeholderTextColor={colors.text.secondary}
              style={[styles.input, { color: colors.text.primary, borderColor: '#DEE5EF' }]}
            />
            <TextInput
              value={levelForm.subtitle}
              onChangeText={(value) => setLevelForm((prev) => ({ ...prev, subtitle: value }))}
              placeholder="Subtitle"
              placeholderTextColor={colors.text.secondary}
              style={[styles.input, { color: colors.text.primary, borderColor: '#DEE5EF' }]}
            />
            <TextInput
              value={levelForm.duration_days}
              onChangeText={(value) => setLevelForm((prev) => ({ ...prev, duration_days: value }))}
              keyboardType="numeric"
              placeholder="Duration days"
              placeholderTextColor={colors.text.secondary}
              style={[styles.input, { color: colors.text.primary, borderColor: '#DEE5EF' }]}
            />
            <TextInput
              value={levelForm.description}
              onChangeText={(value) => setLevelForm((prev) => ({ ...prev, description: value }))}
              placeholder="Description"
              placeholderTextColor={colors.text.secondary}
              multiline
              style={[
                styles.input,
                styles.textArea,
                { color: colors.text.primary, borderColor: '#DEE5EF' },
              ]}
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setLevelModal(false)}
                style={[styles.modalBtn, { backgroundColor: '#CBD5E1' }]}
              >
                <Text style={[styles.modalBtnText, { color: '#0F172A' }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={saveLevel}
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.modalBtnText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={articleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setArticleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              {articleForm.id ? 'Edit article' : 'Create article'}
            </Text>
            <TextInput
              value={articleForm.title}
              onChangeText={(value) => setArticleForm((prev) => ({ ...prev, title: value }))}
              placeholder="Title"
              placeholderTextColor={colors.text.secondary}
              style={[styles.input, { color: colors.text.primary, borderColor: '#DEE5EF' }]}
            />
            <TextInput
              value={articleForm.sort_order}
              onChangeText={(value) => setArticleForm((prev) => ({ ...prev, sort_order: value }))}
              keyboardType="numeric"
              placeholder="Sort order"
              placeholderTextColor={colors.text.secondary}
              style={[styles.input, { color: colors.text.primary, borderColor: '#DEE5EF' }]}
            />
            <TextInput
              value={articleForm.level_id}
              onChangeText={(value) => setArticleForm((prev) => ({ ...prev, level_id: value }))}
              placeholder="Level ID (optional)"
              placeholderTextColor={colors.text.secondary}
              style={[styles.input, { color: colors.text.primary, borderColor: '#DEE5EF' }]}
            />
            <TextInput
              value={articleForm.content}
              onChangeText={(value) => setArticleForm((prev) => ({ ...prev, content: value }))}
              placeholder="Content"
              placeholderTextColor={colors.text.secondary}
              multiline
              style={[
                styles.input,
                styles.textArea,
                { color: colors.text.primary, borderColor: '#DEE5EF', minHeight: 120 },
              ]}
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setArticleModal(false)}
                style={[styles.modalBtn, { backgroundColor: '#CBD5E1' }]}
              >
                <Text style={[styles.modalBtnText, { color: '#0F172A' }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={saveArticle}
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  cardText: {
    fontSize: 12,
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
    minHeight: 44,
    fontSize: 14,
  },
  textArea: {
    textAlignVertical: 'top',
    paddingTop: 12,
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

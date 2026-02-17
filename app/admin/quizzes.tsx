import { AdminFilters } from '@/components/admin/AdminFilters';
import { AdminList } from '@/components/admin/AdminList';
import { AdminScreen } from '@/components/admin/AdminScreen';
import { useTheme } from '@/hooks/use-theme';
import { adminService } from '@/services/adminService';
import { AdminQuiz, AdminQuizAnalytics, AdminQuizCategory, AdminQuizQuestion } from '@/types/admin';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';

type QuizTab = 'categories' | 'quizzes' | 'questions' | 'analytics';

const EMPTY_CATEGORY_FORM = {
  name: '',
  name_fr: '',
  slug: '',
  icon: 'school',
  description: '',
  description_fr: '',
  color: '#8B5CF6',
  min_question_count: '10',
  is_enabled: true,
};

const EMPTY_QUIZ_FORM = {
  title: '',
  title_fr: '',
  difficulty: 'medium',
  is_enabled: true,
};

const EMPTY_QUESTION_FORM = {
  question: '',
  question_fr: '',
  options: ['', '', '', ''],
  correctIndex: '0',
  is_active: true,
};

export default function AdminQuizzesScreen() {
  const { colors } = useTheme();

  const [tab, setTab] = useState<QuizTab>('categories');
  const [search, setSearch] = useState('');

  const [categories, setCategories] = useState<AdminQuizCategory[]>([]);
  const [quizzes, setQuizzes] = useState<AdminQuiz[]>([]);
  const [questions, setQuestions] = useState<AdminQuizQuestion[]>([]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AdminQuizAnalytics | null>(null);

  const [categoryModal, setCategoryModal] = useState(false);
  const [quizModal, setQuizModal] = useState(false);
  const [questionModal, setQuestionModal] = useState(false);

  const [editingCategory, setEditingCategory] = useState<AdminQuizCategory | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<AdminQuiz | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<AdminQuizQuestion | null>(null);

  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY_FORM);
  const [quizForm, setQuizForm] = useState(EMPTY_QUIZ_FORM);
  const [questionForm, setQuestionForm] = useState(EMPTY_QUESTION_FORM);

  const selectedCategory = categories.find((item) => item.id === selectedCategoryId) || null;
  const selectedQuiz = quizzes.find((item) => item.id === selectedQuizId) || null;

  const loadCategories = useCallback(async () => {
    const response = await adminService.quiz.listCategories({
      q: search || undefined,
      page: 1,
      limit: 200,
    });
    const rows = response.items || [];
    setCategories(rows);

    if (rows.length > 0 && !rows.some((row) => row.id === selectedCategoryId)) {
      setSelectedCategoryId(rows[0].id);
    }

    if (!rows.length) {
      setSelectedCategoryId('');
      setSelectedQuizId('');
      setQuizzes([]);
      setQuestions([]);
    }
  }, [search, selectedCategoryId]);

  const loadQuizzes = useCallback(async () => {
    if (!selectedCategoryId) {
      setQuizzes([]);
      setSelectedQuizId('');
      return;
    }

    const response = await adminService.quiz.listQuizzes({
      categoryId: selectedCategoryId,
      page: 1,
      limit: 200,
    });
    const rows = response.items || [];
    setQuizzes(rows);

    if (rows.length > 0 && !rows.some((row) => row.id === selectedQuizId)) {
      setSelectedQuizId(rows[0].id);
    }

    if (!rows.length) {
      setSelectedQuizId('');
      setQuestions([]);
    }
  }, [selectedCategoryId, selectedQuizId]);

  const loadQuestions = useCallback(async () => {
    if (!selectedQuizId) {
      setQuestions([]);
      return;
    }

    const response = await adminService.quiz.listQuestions({
      quizId: selectedQuizId,
      page: 1,
      limit: 500,
    });
    setQuestions(response.items || []);
  }, [selectedQuizId]);

  const loadAnalytics = useCallback(async () => {
    try {
      const res = await adminService.quiz.getAnalytics();
      setAnalytics(res);
    } catch {
      // Analytics can fail gracefully
    }
  }, []);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      await loadCategories();
    } catch (error: any) {
      console.error('Failed to load quiz admin', error);
      Alert.alert('Load Error', error?.message || 'Failed to load quiz data');
    } finally {
      setLoading(false);
    }
  }, [loadCategories]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    void loadQuizzes();
  }, [loadQuizzes]);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  useEffect(() => {
    if (tab === 'analytics') {
      void loadAnalytics();
    }
  }, [tab, loadAnalytics]);

  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm(EMPTY_CATEGORY_FORM);
    setCategoryModal(true);
  };

  const openEditCategory = (item: AdminQuizCategory) => {
    setEditingCategory(item);
    setCategoryForm({
      name: item.name,
      name_fr: item.name_fr || '',
      slug: item.slug || '',
      icon: item.icon || 'school',
      description: item.description || '',
      description_fr: item.description_fr || '',
      color: item.color || '#8B5CF6',
      min_question_count: String(item.min_question_count || 10),
      is_enabled: item.is_enabled !== false,
    });
    setCategoryModal(true);
  };

  const saveCategory = async () => {
    if (!categoryForm.name.trim() || !categoryForm.slug.trim()) {
      Alert.alert('Validation', 'Name and slug are required');
      return;
    }

    const payload = {
      name: categoryForm.name.trim(),
      name_fr: categoryForm.name_fr.trim() || null,
      slug: categoryForm.slug.trim().toLowerCase(),
      icon: categoryForm.icon.trim() || 'school',
      description: categoryForm.description.trim() || null,
      description_fr: categoryForm.description_fr.trim() || null,
      color: categoryForm.color.trim() || '#8B5CF6',
      min_question_count: Number.parseInt(categoryForm.min_question_count, 10) || 10,
      is_enabled: categoryForm.is_enabled,
    };

    try {
      if (editingCategory) {
        await adminService.quiz.updateCategory(editingCategory.id, payload);
      } else {
        await adminService.quiz.createCategory(payload);
      }
      setCategoryModal(false);
      await loadCategories();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to save category');
    }
  };

  const removeCategory = async (id: string) => {
    try {
      const res = await adminService.quiz.deleteCategory(id);
      if (res.softDisabled) {
        Alert.alert(
          'Soft disabled',
          'Category has historical attempts, so it was disabled instead of deleted.'
        );
      }
      await loadCategories();
    } catch {
      Alert.alert('Error', 'Failed to delete category');
    }
  };

  const openCreateQuiz = () => {
    if (!selectedCategoryId) {
      Alert.alert('Info', 'Create or select a category first');
      return;
    }
    setEditingQuiz(null);
    setQuizForm(EMPTY_QUIZ_FORM);
    setQuizModal(true);
  };

  const openEditQuiz = (item: AdminQuiz) => {
    setEditingQuiz(item);
    setQuizForm({
      title: item.title,
      title_fr: item.title_fr || '',
      difficulty: item.difficulty || 'medium',
      is_enabled: item.is_enabled !== false,
    });
    setQuizModal(true);
  };

  const saveQuiz = async () => {
    if (!selectedCategoryId || !quizForm.title.trim()) {
      Alert.alert('Validation', 'Category and title are required');
      return;
    }

    const payload = {
      category_id: selectedCategoryId,
      title: quizForm.title.trim(),
      title_fr: quizForm.title_fr.trim() || null,
      difficulty: quizForm.difficulty,
      is_enabled: quizForm.is_enabled,
    };

    try {
      if (editingQuiz) {
        await adminService.quiz.updateQuiz(editingQuiz.id, payload);
      } else {
        await adminService.quiz.createQuiz(payload);
      }
      setQuizModal(false);
      await loadQuizzes();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to save quiz');
    }
  };

  const removeQuiz = async (id: string) => {
    try {
      const res = await adminService.quiz.deleteQuiz(id);
      if (res.softDisabled) {
        Alert.alert(
          'Soft disabled',
          'Quiz has historical sessions, so it was disabled instead of deleted.'
        );
      }
      await loadQuizzes();
    } catch {
      Alert.alert('Error', 'Failed to delete quiz');
    }
  };

  const openCreateQuestion = () => {
    if (!selectedQuizId) {
      Alert.alert('Info', 'Select a quiz first');
      return;
    }
    setEditingQuestion(null);
    setQuestionForm(EMPTY_QUESTION_FORM);
    setQuestionModal(true);
  };

  const openEditQuestion = (item: AdminQuizQuestion) => {
    const normalizedOptions = [...(item.options || []), '', '', '', ''].slice(0, 4);
    const matchIndex = Math.max(
      0,
      normalizedOptions.findIndex((opt) => opt === item.correct_answer)
    );

    setEditingQuestion(item);
    setQuestionForm({
      question: item.question,
      question_fr: item.question_fr || '',
      options: normalizedOptions,
      correctIndex: String(matchIndex),
      is_active: item.is_active !== false,
    });
    setQuestionModal(true);
  };

  const saveQuestion = async () => {
    if (!selectedQuizId || !questionForm.question.trim()) {
      Alert.alert('Validation', 'Quiz and question are required');
      return;
    }

    const options = questionForm.options.map((opt) => opt.trim()).filter(Boolean);
    const correctIndex = Number.parseInt(questionForm.correctIndex, 10);

    if (options.length < 2 || !options[correctIndex]) {
      Alert.alert('Validation', 'Provide at least 2 options and valid correct answer index');
      return;
    }

    const payload = {
      quiz_id: selectedQuizId,
      question: questionForm.question.trim(),
      question_fr: questionForm.question_fr.trim() || null,
      options,
      correct_answer: options[correctIndex],
      is_active: questionForm.is_active,
    };

    try {
      if (editingQuestion) {
        await adminService.quiz.updateQuestion(editingQuestion.id, payload);
      } else {
        await adminService.quiz.createQuestion(payload);
      }
      setQuestionModal(false);
      await loadQuestions();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to save question');
    }
  };

  const removeQuestion = async (id: string) => {
    try {
      const res = await adminService.quiz.deleteQuestion(id);
      if (res.softDisabled) {
        Alert.alert(
          'Soft disabled',
          'Question has historical answers, so it was disabled instead of deleted.'
        );
      }
      await loadQuestions();
    } catch {
      Alert.alert('Error', 'Failed to delete question');
    }
  };

  const tabOptions = [
    { key: 'categories', label: 'Categories' },
    { key: 'quizzes', label: 'Quizzes' },
    { key: 'questions', label: 'Questions' },
    { key: 'analytics', label: 'Analytics' },
  ];

  return (
    <AdminScreen
      title="Quiz Control"
      scroll={false}
      right={
        <Pressable
          onPress={() => {
            if (tab === 'categories') openCreateCategory();
            if (tab === 'quizzes') openCreateQuiz();
            if (tab === 'questions') openCreateQuestion();
            if (tab === 'analytics') void loadAnalytics();
          }}
          hitSlop={8}
        >
          <Ionicons
            name={tab === 'analytics' ? 'refresh' : 'add-circle'}
            size={24}
            color={colors.primary}
          />
        </Pressable>
      }
    >
      <View style={{ flex: 1, gap: 12 }}>
        <AdminFilters
          options={tabOptions}
          activeKey={tab}
          onChangeOption={(key) => setTab(key as QuizTab)}
        />

        {tab !== 'analytics' ? <AdminFilters search={search} onChangeSearch={setSearch} /> : null}

        <View style={styles.selectorRow}>
          <View style={[styles.selector, { borderColor: '#DEE5EF' }]}>
            <Text style={[styles.selectorLabel, { color: colors.text.secondary }]}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6 }}
            >
              {categories.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => setSelectedCategoryId(item.id)}
                  style={[
                    styles.selectorChip,
                    {
                      backgroundColor: selectedCategoryId === item.id ? colors.primary : '#EEF2F7',
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: selectedCategoryId === item.id ? '#FFFFFF' : '#0F172A',
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {(tab === 'questions' || tab === 'quizzes') && (
            <View style={[styles.selector, { borderColor: '#DEE5EF' }]}>
              <Text style={[styles.selectorLabel, { color: colors.text.secondary }]}>Quiz</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6 }}
              >
                {quizzes.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => setSelectedQuizId(item.id)}
                    style={[
                      styles.selectorChip,
                      { backgroundColor: selectedQuizId === item.id ? colors.primary : '#EEF2F7' },
                    ]}
                  >
                    <Text
                      style={{
                        color: selectedQuizId === item.id ? '#FFFFFF' : '#0F172A',
                        fontSize: 12,
                        fontWeight: '700',
                      }}
                    >
                      {item.title}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {tab === 'categories' ? (
          <AdminList
            data={categories}
            loading={loading}
            keyExtractor={(item) => item.id}
            emptyText="No categories"
            renderItem={({ item }) => (
              <View style={[styles.card, { backgroundColor: '#FFFFFF', borderColor: '#E5EAF2' }]}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.cardMeta, { color: colors.text.secondary }]}>
                      {item.slug}
                    </Text>
                  </View>
                  <Switch
                    value={item.is_enabled !== false}
                    onValueChange={async (value) => {
                      await adminService.quiz.updateCategory(item.id, { is_enabled: value });
                      await loadCategories();
                    }}
                    trackColor={{ false: '#CBD5E1', true: colors.primary }}
                  />
                </View>
                <View style={styles.actions}>
                  <Pressable
                    onPress={() => openEditCategory(item)}
                    style={[styles.btn, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.btnText}>Edit</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => removeCategory(item.id)}
                    style={[styles.btn, { backgroundColor: '#EF4444' }]}
                  >
                    <Text style={styles.btnText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            )}
          />
        ) : null}

        {tab === 'quizzes' ? (
          <AdminList
            data={quizzes}
            loading={loading}
            keyExtractor={(item) => item.id}
            emptyText={selectedCategory ? 'No quizzes' : 'Select a category'}
            renderItem={({ item }) => (
              <View style={[styles.card, { backgroundColor: '#FFFFFF', borderColor: '#E5EAF2' }]}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.cardMeta, { color: colors.text.secondary }]}>
                      Difficulty: {item.difficulty || 'medium'}
                    </Text>
                  </View>
                  <Switch
                    value={item.is_enabled !== false}
                    onValueChange={async (value) => {
                      await adminService.quiz.updateQuiz(item.id, { is_enabled: value });
                      await loadQuizzes();
                    }}
                    trackColor={{ false: '#CBD5E1', true: colors.primary }}
                  />
                </View>
                <View style={styles.actions}>
                  <Pressable
                    onPress={() => openEditQuiz(item)}
                    style={[styles.btn, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.btnText}>Edit</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => removeQuiz(item.id)}
                    style={[styles.btn, { backgroundColor: '#EF4444' }]}
                  >
                    <Text style={styles.btnText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            )}
          />
        ) : null}

        {tab === 'questions' ? (
          <AdminList
            data={questions}
            loading={loading}
            keyExtractor={(item) => item.id}
            emptyText={selectedQuiz ? 'No questions' : 'Select a quiz'}
            renderItem={({ item }) => (
              <View style={[styles.card, { backgroundColor: '#FFFFFF', borderColor: '#E5EAF2' }]}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
                      {item.question}
                    </Text>
                    <Text style={[styles.cardMeta, { color: colors.text.secondary }]}>
                      Correct: {item.correct_answer}
                    </Text>
                  </View>
                  <Switch
                    value={item.is_active !== false}
                    onValueChange={async (value) => {
                      await adminService.quiz.updateQuestion(item.id, { is_active: value });
                      await loadQuestions();
                    }}
                    trackColor={{ false: '#CBD5E1', true: colors.primary }}
                  />
                </View>
                <View style={styles.actions}>
                  <Pressable
                    onPress={() => openEditQuestion(item)}
                    style={[styles.btn, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.btnText}>Edit</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => removeQuestion(item.id)}
                    style={[styles.btn, { backgroundColor: '#EF4444' }]}
                  >
                    <Text style={styles.btnText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            )}
          />
        ) : null}

        {tab === 'analytics' ? (
          <ScrollView contentContainerStyle={{ gap: 10, paddingBottom: 20 }}>
            <View style={[styles.card, { backgroundColor: '#FFFFFF', borderColor: '#E5EAF2' }]}>
              <Text style={[styles.cardTitle, { color: colors.text.primary }]}>Quiz Metrics</Text>
              <Text style={[styles.cardMeta, { color: colors.text.secondary }]}>
                Attempts: {analytics?.metrics.totalAttempts ?? 0}
              </Text>
              <Text style={[styles.cardMeta, { color: colors.text.secondary }]}>
                Average score: {analytics?.metrics.avgScore ?? 0}
              </Text>
              <Text style={[styles.cardMeta, { color: colors.text.secondary }]}>
                Questions: {analytics?.metrics.totalQuestions ?? 0}
              </Text>
              <Text style={[styles.cardMeta, { color: colors.text.secondary }]}>
                Active questions: {analytics?.metrics.activeQuestions ?? 0}
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: '#FFFFFF', borderColor: '#E5EAF2' }]}>
              <Text style={[styles.cardTitle, { color: colors.text.primary }]}>Mode breakdown</Text>
              {Object.entries(analytics?.modeBreakdown || {}).map(([mode, count]) => (
                <Text key={mode} style={[styles.cardMeta, { color: colors.text.secondary }]}>
                  {mode}: {count}
                </Text>
              ))}
            </View>

            <View style={[styles.card, { backgroundColor: '#FFFFFF', borderColor: '#E5EAF2' }]}>
              <Text style={[styles.cardTitle, { color: colors.text.primary }]}>Top categories</Text>
              {(analytics?.categoryBreakdown || []).map((item) => (
                <Text
                  key={`${item.category_id}-${item.attempts}`}
                  style={[styles.cardMeta, { color: colors.text.secondary }]}
                >
                  {item.category_name}: {item.attempts}
                </Text>
              ))}
            </View>
          </ScrollView>
        ) : null}
      </View>

      <Modal
        visible={categoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalCard} contentContainerStyle={{ gap: 10 }}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              {editingCategory ? 'Edit category' : 'Create category'}
            </Text>
            <TextInput
              placeholder="Name"
              value={categoryForm.name}
              onChangeText={(v) => setCategoryForm((p) => ({ ...p, name: v }))}
              style={[styles.input, { color: colors.text.primary }]}
              placeholderTextColor={colors.text.secondary}
            />
            <TextInput
              placeholder="Name (FR)"
              value={categoryForm.name_fr}
              onChangeText={(v) => setCategoryForm((p) => ({ ...p, name_fr: v }))}
              style={[styles.input, { color: colors.text.primary }]}
              placeholderTextColor={colors.text.secondary}
            />
            <TextInput
              placeholder="Slug"
              value={categoryForm.slug}
              onChangeText={(v) => setCategoryForm((p) => ({ ...p, slug: v }))}
              autoCapitalize="none"
              style={[styles.input, { color: colors.text.primary }]}
              placeholderTextColor={colors.text.secondary}
            />
            <TextInput
              placeholder="Icon"
              value={categoryForm.icon}
              onChangeText={(v) => setCategoryForm((p) => ({ ...p, icon: v }))}
              style={[styles.input, { color: colors.text.primary }]}
              placeholderTextColor={colors.text.secondary}
            />
            <TextInput
              placeholder="Description"
              value={categoryForm.description}
              onChangeText={(v) => setCategoryForm((p) => ({ ...p, description: v }))}
              style={[styles.input, { color: colors.text.primary }]}
              placeholderTextColor={colors.text.secondary}
            />
            <TextInput
              placeholder="Description (FR)"
              value={categoryForm.description_fr}
              onChangeText={(v) => setCategoryForm((p) => ({ ...p, description_fr: v }))}
              style={[styles.input, { color: colors.text.primary }]}
              placeholderTextColor={colors.text.secondary}
            />
            <TextInput
              placeholder="Color"
              value={categoryForm.color}
              onChangeText={(v) => setCategoryForm((p) => ({ ...p, color: v }))}
              style={[styles.input, { color: colors.text.primary }]}
              placeholderTextColor={colors.text.secondary}
            />
            <TextInput
              placeholder="Minimum question count"
              value={categoryForm.min_question_count}
              onChangeText={(v) => setCategoryForm((p) => ({ ...p, min_question_count: v }))}
              keyboardType="numeric"
              style={[styles.input, { color: colors.text.primary }]}
              placeholderTextColor={colors.text.secondary}
            />
            <View style={styles.switchRow}>
              <Text style={{ color: colors.text.primary, fontWeight: '600' }}>Enabled</Text>
              <Switch
                value={categoryForm.is_enabled}
                onValueChange={(v) => setCategoryForm((p) => ({ ...p, is_enabled: v }))}
                trackColor={{ false: '#CBD5E1', true: colors.primary }}
              />
            </View>
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setCategoryModal(false)}
                style={[styles.modalBtn, { backgroundColor: '#CBD5E1' }]}
              >
                <Text style={[styles.modalBtnText, { color: '#111827' }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={saveCategory}
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.modalBtnText}>Save</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={quizModal}
        transparent
        animationType="slide"
        onRequestClose={() => setQuizModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              {editingQuiz ? 'Edit quiz' : 'Create quiz'}
            </Text>
            <TextInput
              placeholder="Title"
              value={quizForm.title}
              onChangeText={(v) => setQuizForm((p) => ({ ...p, title: v }))}
              style={[styles.input, { color: colors.text.primary }]}
              placeholderTextColor={colors.text.secondary}
            />
            <TextInput
              placeholder="Title (FR)"
              value={quizForm.title_fr}
              onChangeText={(v) => setQuizForm((p) => ({ ...p, title_fr: v }))}
              style={[styles.input, { color: colors.text.primary }]}
              placeholderTextColor={colors.text.secondary}
            />
            <TextInput
              placeholder="Difficulty (easy/medium/hard)"
              value={quizForm.difficulty}
              onChangeText={(v) => setQuizForm((p) => ({ ...p, difficulty: v }))}
              style={[styles.input, { color: colors.text.primary }]}
              placeholderTextColor={colors.text.secondary}
            />
            <View style={styles.switchRow}>
              <Text style={{ color: colors.text.primary, fontWeight: '600' }}>Enabled</Text>
              <Switch
                value={quizForm.is_enabled}
                onValueChange={(v) => setQuizForm((p) => ({ ...p, is_enabled: v }))}
                trackColor={{ false: '#CBD5E1', true: colors.primary }}
              />
            </View>
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setQuizModal(false)}
                style={[styles.modalBtn, { backgroundColor: '#CBD5E1' }]}
              >
                <Text style={[styles.modalBtnText, { color: '#111827' }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={saveQuiz}
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.modalBtnText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={questionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setQuestionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalCard} contentContainerStyle={{ gap: 10 }}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              {editingQuestion ? 'Edit question' : 'Create question'}
            </Text>
            <TextInput
              placeholder="Question"
              value={questionForm.question}
              onChangeText={(v) => setQuestionForm((p) => ({ ...p, question: v }))}
              style={[styles.input, { color: colors.text.primary }]}
              placeholderTextColor={colors.text.secondary}
            />
            <TextInput
              placeholder="Question (FR)"
              value={questionForm.question_fr}
              onChangeText={(v) => setQuestionForm((p) => ({ ...p, question_fr: v }))}
              style={[styles.input, { color: colors.text.primary }]}
              placeholderTextColor={colors.text.secondary}
            />
            {questionForm.options.map((option, index) => (
              <TextInput
                key={`option-${index}`}
                placeholder={`Option ${index + 1}`}
                value={option}
                onChangeText={(value) =>
                  setQuestionForm((prev) => {
                    const nextOptions = [...prev.options];
                    nextOptions[index] = value;
                    return { ...prev, options: nextOptions };
                  })
                }
                style={[styles.input, { color: colors.text.primary }]}
                placeholderTextColor={colors.text.secondary}
              />
            ))}
            <TextInput
              placeholder="Correct option index (0-3)"
              value={questionForm.correctIndex}
              onChangeText={(v) => setQuestionForm((p) => ({ ...p, correctIndex: v }))}
              keyboardType="numeric"
              style={[styles.input, { color: colors.text.primary }]}
              placeholderTextColor={colors.text.secondary}
            />
            <View style={styles.switchRow}>
              <Text style={{ color: colors.text.primary, fontWeight: '600' }}>Active</Text>
              <Switch
                value={questionForm.is_active}
                onValueChange={(v) => setQuestionForm((p) => ({ ...p, is_active: v }))}
                trackColor={{ false: '#CBD5E1', true: colors.primary }}
              />
            </View>
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setQuestionModal(false)}
                style={[styles.modalBtn, { backgroundColor: '#CBD5E1' }]}
              >
                <Text style={[styles.modalBtnText, { color: '#111827' }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={saveQuestion}
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.modalBtnText}>Save</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  selectorRow: {
    gap: 8,
  },
  selector: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  selectorChip: {
    minHeight: 30,
    borderRadius: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardMeta: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    minHeight: 34,
    borderRadius: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '700',
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
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DEE5EF',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalActions: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 8,
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

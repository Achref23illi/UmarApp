import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import {
  AdminQuiz,
  AdminQuizCategory,
  AdminQuizQuestion,
  quizAdminService,
} from '@/services/quizAdminService';

const EMPTY_OPTIONS = ['', '', '', ''];

export default function AdminQuizzesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [categories, setCategories] = useState<AdminQuizCategory[]>([]);
  const [quizzes, setQuizzes] = useState<AdminQuiz[]>([]);
  const [questions, setQuestions] = useState<AdminQuizQuestion[]>([]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [questionTextFr, setQuestionTextFr] = useState('');
  const [answers, setAnswers] = useState<string[]>([...EMPTY_OPTIONS]);
  const [answersFr, setAnswersFr] = useState<string[]>([...EMPTY_OPTIONS]);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(0);
  const [correctAnswerFr, setCorrectAnswerFr] = useState('');
  const [isActive, setIsActive] = useState(true);

  const selectedQuiz = useMemo(
    () => quizzes.find((quiz) => quiz.id === selectedQuizId) || null,
    [quizzes, selectedQuizId]
  );

  const resetForm = () => {
    setEditingQuestionId(null);
    setQuestionText('');
    setQuestionTextFr('');
    setAnswers([...EMPTY_OPTIONS]);
    setAnswersFr([...EMPTY_OPTIONS]);
    setCorrectAnswerIndex(0);
    setCorrectAnswerFr('');
    setIsActive(true);
  };

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const data = await quizAdminService.getCategories();
      setCategories(data);

      if (data.length > 0) {
        const nextCategoryId =
          selectedCategoryId && data.some((item) => item.id === selectedCategoryId)
            ? selectedCategoryId
            : data[0].id;
        setSelectedCategoryId(nextCategoryId);
      } else {
        setSelectedCategoryId(null);
      }
    } catch (error) {
      console.error('Failed to load quiz categories', error);
      Alert.alert('Error', 'Failed to load quiz categories.');
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadQuizzes = async (categoryId: string) => {
    try {
      const data = await quizAdminService.getQuizzes(categoryId);
      setQuizzes(data);

      if (data.length > 0) {
        const nextQuizId =
          selectedQuizId && data.some((item) => item.id === selectedQuizId)
            ? selectedQuizId
            : data[0].id;
        setSelectedQuizId(nextQuizId);
      } else {
        setSelectedQuizId(null);
        setQuestions([]);
      }
    } catch (error) {
      console.error('Failed to load quizzes', error);
      Alert.alert('Error', 'Failed to load quizzes for selected category.');
      setQuizzes([]);
      setSelectedQuizId(null);
      setQuestions([]);
    }
  };

  const loadQuestions = async (quizId: string) => {
    try {
      setLoadingQuestions(true);
      const data = await quizAdminService.getQuestions(quizId);
      setQuestions(data);
    } catch (error) {
      console.error('Failed to load quiz questions', error);
      Alert.alert('Error', 'Failed to load questions.');
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    void loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedCategoryId) return;
    void loadQuizzes(selectedCategoryId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId]);

  useEffect(() => {
    if (!selectedQuizId) return;
    void loadQuestions(selectedQuizId);
  }, [selectedQuizId]);

  const updateAnswer = (index: number, text: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = text;
      return next;
    });
  };

  const updateAnswerFr = (index: number, text: string) => {
    setAnswersFr((prev) => {
      const next = [...prev];
      next[index] = text;
      return next;
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleOpenEdit = (question: AdminQuizQuestion) => {
    setEditingQuestionId(question.id);
    setQuestionText(question.question);
    setQuestionTextFr(question.question_fr || '');

    const normalizedOptions = [...question.options, ...EMPTY_OPTIONS].slice(0, 4);
    setAnswers(normalizedOptions);

    const normalizedOptionsFr = [...(question.options_fr || []), ...EMPTY_OPTIONS].slice(0, 4);
    setAnswersFr(normalizedOptionsFr);

    const matchIndex = normalizedOptions.findIndex((option) => option === question.correct_answer);
    setCorrectAnswerIndex(matchIndex >= 0 ? matchIndex : 0);
    setCorrectAnswerFr(question.correct_answer_fr || '');
    setIsActive(question.is_active);
    setModalVisible(true);
  };

  const validateForm = (): string | null => {
    if (!selectedQuizId) return 'Please select a quiz first.';
    if (!questionText.trim()) return 'Please enter question text.';
    if (answers.some((answer) => !answer.trim())) return 'Please fill all 4 answer options.';

    const correct = answers[correctAnswerIndex]?.trim();
    if (!correct) return 'Please select the correct answer.';

    return null;
  };

  const handleSaveQuestion = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Validation', validationError);
      return;
    }

    const payload = {
      question: questionText,
      questionFr: questionTextFr,
      options: answers,
      optionsFr: answersFr.some((answer) => answer.trim().length > 0) ? answersFr : undefined,
      correctAnswer: answers[correctAnswerIndex],
      correctAnswerFr: correctAnswerFr,
      isActive,
    };

    try {
      setIsSubmitting(true);

      if (editingQuestionId) {
        await quizAdminService.updateQuestion(editingQuestionId, payload);
      } else {
        await quizAdminService.createQuestion({
          quizId: selectedQuizId!,
          ...payload,
        });
      }

      setModalVisible(false);
      resetForm();

      if (selectedQuizId) {
        await loadQuestions(selectedQuizId);
      }
    } catch (error: any) {
      console.error('Failed to save question', error);
      Alert.alert('Error', error?.message || 'Failed to save question.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (questionId: string) => {
    Alert.alert('Delete Question', 'Are you sure you want to delete this question?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await quizAdminService.deleteQuestion(questionId);
            setQuestions((prev) => prev.filter((question) => question.id !== questionId));
          } catch (error) {
            console.error('Failed to delete question', error);
            Alert.alert('Error', 'Failed to delete question.');
          }
        },
      },
    ]);
  };

  const renderQuestionItem = ({ item }: { item: AdminQuizQuestion }) => (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.cardHeaderRow}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={[styles.questionText, { color: colors.text.primary }]}>{item.question}</Text>
          {item.question_fr ? (
            <Text style={[styles.questionFrText, { color: colors.text.secondary }]}>
              {item.question_fr}
            </Text>
          ) : null}
        </View>

        <View style={styles.cardActions}>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: item.is_active
                  ? 'rgba(16, 185, 129, 0.2)'
                  : 'rgba(239, 68, 68, 0.2)',
              },
            ]}
          >
            <Text
              style={{
                color: item.is_active ? '#059669' : '#DC2626',
                fontSize: 12,
                fontWeight: '600',
              }}
            >
              {item.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
          <Pressable onPress={() => handleOpenEdit(item)} hitSlop={8}>
            <Ionicons name="create-outline" size={20} color={colors.primary} />
          </Pressable>
          <Pressable onPress={() => handleDelete(item.id)} hitSlop={8}>
            <Ionicons name="trash-outline" size={20} color={colors.error || '#EF4444'} />
          </Pressable>
        </View>
      </View>

      <View style={styles.answersList}>
        {item.options.map((answer, index) => (
          <Text
            key={`${item.id}-option-${index}`}
            style={[
              styles.answerText,
              { color: answer === item.correct_answer ? '#059669' : colors.text.secondary },
            ]}
          >
            {index + 1}. {answer} {answer === item.correct_answer ? '(Correct)' : ''}
          </Text>
        ))}
      </View>
    </View>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Manage Quizzes</Text>
        <Pressable onPress={() => void loadCategories()} style={styles.refreshButton}>
          <Ionicons name="refresh-outline" size={20} color={colors.primary} />
        </Pressable>
      </View>

      {loadingCategories ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.selectorSection}>
            <Text style={[styles.selectorLabel, { color: colors.text.secondary }]}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.selectorChips}
            >
              {categories.map((category) => {
                const selected = category.id === selectedCategoryId;
                return (
                  <Pressable
                    key={category.id}
                    onPress={() => setSelectedCategoryId(category.id)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected ? colors.primary : colors.surface,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={{ color: selected ? '#fff' : colors.text.primary, fontWeight: '600' }}
                    >
                      {category.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={[styles.selectorLabel, { color: colors.text.secondary }]}>Quiz</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.selectorChips}
            >
              {quizzes.map((quiz) => {
                const selected = quiz.id === selectedQuizId;
                return (
                  <Pressable
                    key={quiz.id}
                    onPress={() => setSelectedQuizId(quiz.id)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected ? colors.primary : colors.surface,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={{ color: selected ? '#fff' : colors.text.primary, fontWeight: '600' }}
                    >
                      {quiz.title}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {loadingQuestions ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={questions}
              renderItem={renderQuestionItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={{ paddingVertical: 40 }}>
                  <Text style={{ textAlign: 'center', color: colors.text.secondary }}>
                    {selectedQuiz
                      ? 'No questions found for this quiz.'
                      : 'Select a quiz to manage questions.'}
                  </Text>
                </View>
              }
            />
          )}
        </>
      )}

      <Pressable
        style={[
          styles.fab,
          {
            backgroundColor: selectedQuizId ? colors.primary : colors.text.disabled,
            opacity: selectedQuizId ? 1 : 0.6,
          },
        ]}
        onPress={handleOpenCreate}
        disabled={!selectedQuizId}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              {editingQuestionId ? 'Edit Question' : 'Add Question'}
            </Text>
            <Pressable onPress={() => setModalVisible(false)}>
              <Text style={{ color: colors.primary, fontSize: 16 }}>Close</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={[styles.label, { color: colors.text.secondary }]}>Quiz</Text>
            <Text style={[styles.quizTitleValue, { color: colors.text.primary }]}>
              {selectedQuiz?.title || '-'}
            </Text>

            <Text style={[styles.label, { color: colors.text.secondary }]}>Question (EN)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.text.primary,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Enter question"
              placeholderTextColor={colors.text.secondary}
              value={questionText}
              onChangeText={setQuestionText}
              multiline
            />

            <Text style={[styles.label, { color: colors.text.secondary }]}>
              Question (FR) - optional
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.text.primary,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Entrez la question"
              placeholderTextColor={colors.text.secondary}
              value={questionTextFr}
              onChangeText={setQuestionTextFr}
              multiline
            />

            <Text style={[styles.label, { color: colors.text.secondary }]}>
              Options (minimum 4)
            </Text>
            {answers.map((answer, index) => (
              <View key={`option-${index}`} style={styles.optionRow}>
                <Pressable
                  style={[
                    styles.radio,
                    {
                      borderColor:
                        correctAnswerIndex === index ? colors.primary : colors.text.secondary,
                    },
                  ]}
                  onPress={() => setCorrectAnswerIndex(index)}
                >
                  {correctAnswerIndex === index ? (
                    <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                  ) : null}
                </Pressable>

                <TextInput
                  style={[
                    styles.input,
                    styles.optionInput,
                    {
                      backgroundColor: colors.surface,
                      color: colors.text.primary,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder={`Option ${index + 1}`}
                  placeholderTextColor={colors.text.secondary}
                  value={answer}
                  onChangeText={(text) => updateAnswer(index, text)}
                />
              </View>
            ))}

            <Text style={[styles.label, { color: colors.text.secondary }]}>
              Options (FR) - optional
            </Text>
            {answersFr.map((answer, index) => (
              <TextInput
                key={`option-fr-${index}`}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text.primary,
                    borderColor: colors.border,
                  },
                ]}
                placeholder={`Option FR ${index + 1}`}
                placeholderTextColor={colors.text.secondary}
                value={answer}
                onChangeText={(text) => updateAnswerFr(index, text)}
              />
            ))}

            <Text style={[styles.label, { color: colors.text.secondary }]}>
              Correct answer (FR) - optional
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.text.primary,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Bonne reponse"
              placeholderTextColor={colors.text.secondary}
              value={correctAnswerFr}
              onChangeText={setCorrectAnswerFr}
            />

            <View style={styles.switchRow}>
              <Text style={[styles.label, { color: colors.text.secondary, marginBottom: 0 }]}>
                Active
              </Text>
              <Switch value={isActive} onValueChange={setIsActive} />
            </View>

            <Pressable
              style={[
                styles.submitButton,
                { backgroundColor: colors.primary, opacity: isSubmitting ? 0.7 : 1 },
              ]}
              onPress={handleSaveQuestion}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>
                  {editingQuestionId ? 'Update Question' : 'Save Question'}
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  refreshButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    gap: 8,
  },
  selectorLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  selectorChips: {
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 110,
    gap: 10,
  },
  card: {
    borderRadius: 12,
    padding: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  questionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  questionFrText: {
    marginTop: 4,
    fontSize: 13,
  },
  answersList: {
    marginTop: 10,
    gap: 4,
  },
  answerText: {
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    right: 22,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  modalContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  label: {
    marginBottom: 8,
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  quizTitleValue: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionInput: {
    flex: 1,
    marginBottom: 0,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  submitButton: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

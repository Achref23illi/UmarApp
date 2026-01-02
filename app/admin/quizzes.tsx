import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { Question, socialService } from '@/services/socialService';

export default function AdminQuizzesScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [questionText, setQuestionText] = useState('');
  const [answers, setAnswers] = useState<string[]>(['', '', '', '']);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(0);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    const data = await socialService.getQuestions(100);
    setQuestions(data);
    setLoading(false);
  };

  const handleAddQuestion = async () => {
      // Validation
      if (!questionText.trim()) {
          Alert.alert("Error", "Please enter a question.");
          return;
      }
      if (answers.some(a => !a.trim())) {
          Alert.alert("Error", "Please fill in all answers.");
          return;
      }

      setIsSubmitting(true);
      const correctAnswer = answers[correctAnswerIndex];
      
      const success = await socialService.addQuestion({
          question: questionText,
          answers,
          correct_answer: correctAnswer
      });

      setIsSubmitting(false);

      if (success) {
          Alert.alert("Success", "Question added successfully");
          setModalVisible(false);
          // Reset form
          setQuestionText('');
          setAnswers(['', '', '', '']);
          setCorrectAnswerIndex(0);
          fetchQuestions();
      } else {
          Alert.alert("Error", "Failed to add question");
      }
  };

  const handleDelete = (id: string) => {
      Alert.alert(
          "Delete Question",
          "Are you sure you want to delete this question?",
          [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: async () => {
                  const success = await socialService.deleteQuestion(id);
                  if (success) {
                      setQuestions(questions.filter(q => q.id !== id));
                  } else {
                      Alert.alert("Error", "Failed to delete question");
                  }
              }}
          ]
      );
  };

  const updateAnswer = (text: string, index: number) => {
      const newAnswers = [...answers];
      newAnswers[index] = text;
      setAnswers(newAnswers);
  };

  const renderItem = ({ item }: { item: Question }) => (
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
              <Text style={[styles.questionText, { color: colors.text.primary }]}>{item.question}</Text>
              <Pressable onPress={() => handleDelete(item.id)} hitSlop={10}>
                  <Ionicons name="trash-outline" size={20} color={colors.error || '#EF4444'} />
              </Pressable>
          </View>
          <View style={styles.answersList}>
              {item.answers.map((ans, idx) => (
                  <Text key={idx} style={[
                      styles.answerText, 
                      { color: ans === item.correct_answer ? '#10B981' : colors.text.secondary }
                  ]}>
                      • {ans} {ans === item.correct_answer && "(Correct)"}
                  </Text>
              ))}
          </View>
      </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Manage Quizzes</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      {loading ? (
          <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
          </View>
      ) : (
          <FlatList
              data={questions}
              renderItem={renderItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                  <Text style={[styles.emptyText, { color: colors.text.secondary }]}>No questions found.</Text>
              }
          />
      )}

      {/* FAB */}
      <Pressable 
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setModalVisible(true)}
      >
          <Ionicons name="add" size={28} color="#FFF" />
      </Pressable>

      {/* Add Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Add Question</Text>
                  <Pressable onPress={() => setModalVisible(false)}>
                      <Text style={{ color: colors.primary, fontSize: 16 }}>Cancel</Text>
                  </Pressable>
              </View>

              <View style={styles.form}>
                  <Text style={[styles.label, { color: colors.text.secondary }]}>Question Text</Text>
                  <TextInput
                      style={[styles.input, { backgroundColor: colors.surface, color: colors.text.primary, borderColor: colors.border }]}
                      placeholder="Enter question..."
                      placeholderTextColor={colors.text.secondary}
                      value={questionText}
                      onChangeText={setQuestionText}
                      multiline
                  />

                  <Text style={[styles.label, { color: colors.text.secondary, marginTop: 16 }]}>Answers (select correct one)</Text>
                  {answers.map((ans, idx) => (
                      <View key={idx} style={styles.answerRow}>
                           <Pressable 
                              style={[styles.radio, { borderColor: correctAnswerIndex === idx ? colors.primary : colors.text.secondary }]}
                              onPress={() => setCorrectAnswerIndex(idx)}
                           >
                               {correctAnswerIndex === idx && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                           </Pressable>
                           <TextInput
                              style={[styles.input, { flex: 1, marginBottom: 0, backgroundColor: colors.surface, color: colors.text.primary, borderColor: colors.border }]}
                              placeholder={`Option ${idx + 1}`}
                              placeholderTextColor={colors.text.secondary}
                              value={ans}
                              onChangeText={(t) => updateAnswer(t, idx)}
                          />
                      </View>
                  ))}

                  <Pressable 
                      style={[styles.submitButton, { backgroundColor: colors.primary, opacity: isSubmitting ? 0.7 : 1 }]}
                      onPress={handleAddQuestion}
                      disabled={isSubmitting}
                  >
                      {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Save Question</Text>}
                  </Pressable>
              </View>
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
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  },
  list: {
      padding: 16,
      paddingBottom: 100,
  },
  card: {
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
  },
  cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
  },
  questionText: {
      fontSize: 16,
      fontWeight: '600',
      flex: 1,
      marginRight: 8,
  },
  answersList: {
      marginTop: 8,
      gap: 4,
  },
  answerText: {
      fontSize: 14,
  },
  emptyText: {
      textAlign: 'center',
      marginTop: 40,
      fontSize: 16,
  },
  fab: {
      position: 'absolute',
      bottom: 32,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
  },
  modalContainer: {
      flex: 1,
      padding: 20,
  },
  modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
      marginTop: 10,
  },
  modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
  },
  form: {
      flex: 1,
  },
  label: {
      fontSize: 14,
      marginBottom: 8,
      fontWeight: '500',
  },
  input: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      marginBottom: 16,
  },
  answerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
  },
  radio: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
  },
  radioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
  },
  submitButton: {
      marginTop: 24,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
  },
  submitText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: '600',
  }
});

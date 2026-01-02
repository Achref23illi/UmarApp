import { useTheme } from '@/hooks/use-theme';
import i18n from '@/locales/i18n';
import { Dua, socialService } from '@/services/socialService';
import { useAppSelector } from '@/store/hooks';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';

export default function AdminDuasScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const currentLanguage = useAppSelector(state => state.language.currentLanguage);
  const t = (key: string) => i18n.t(key, { locale: currentLanguage });

  const [duas, setDuas] = useState<Dua[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDua, setEditingDua] = useState<Dua | null>(null);

  // Form State
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [titleFr, setTitleFr] = useState('');
  const [content, setContent] = useState('');
  const [transliteration, setTransliteration] = useState('');
  const [translation, setTranslation] = useState('');
  const [translationFr, setTranslationFr] = useState('');

  useEffect(() => {
    loadDuas();
  }, []);

  const loadDuas = async () => {
    setLoading(true);
    const data = await socialService.getDuas();
    setDuas(data);
    setLoading(false);
  };

  const handleEdit = (dua: Dua) => {
    setEditingDua(dua);
    setCategory(dua.category);
    setTitle(dua.title);
    setTitleFr(dua.title_fr);
    setContent(dua.content);
    setTransliteration(dua.transliteration || '');
    setTranslation(dua.translation);
    setTranslationFr(dua.translation_fr);
    setModalVisible(true);
  };

  const handleAdd = () => {
    setEditingDua(null);
    setCategory('');
    setTitle('');
    setTitleFr('');
    setContent('');
    setTransliteration('');
    setTranslation('');
    setTranslationFr('');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!category || !title || !content) {
      Alert.alert('Error', 'Please fill required fields (Category, Title, Arabic Content)');
      return;
    }

    const duaData = {
      category,
      title,
      title_fr: titleFr,
      content,
      transliteration,
      translation,
      translation_fr: translationFr
    };

    let success = false;
    if (editingDua) {
      success = await socialService.updateDua(editingDua.id, duaData);
    } else {
      success = await socialService.addDua(duaData);
    }

    if (success) {
      setModalVisible(false);
      loadDuas();
      Alert.alert('Success', 'Dua saved successfully');
    } else {
      Alert.alert('Error', 'Failed to save Dua');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      t('dua.deleteDua'),
      t('dua.confirmDelete'),
      [
        { text: t('dua.cancel'), style: 'cancel' },
        {
          text: t('dua.deleteDua'),
          style: 'destructive',
          onPress: async () => {
            const success = await socialService.deleteDua(id);
            if (success) {
              loadDuas();
            } else {
              Alert.alert('Error', 'Failed to delete');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: Dua }) => (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.categoryBadge, { backgroundColor: colors.primary }]}>{item.category}</Text>
        <View style={styles.actions}>
          <Pressable onPress={() => handleEdit(item)} style={styles.actionBtn}>
            <Ionicons name="create-outline" size={20} color={colors.text.primary} />
          </Pressable>
          <Pressable onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </Pressable>
        </View>
      </View>
      <Text style={[styles.cardTitle, { color: colors.text.primary }]}>{item.title}</Text>
      <Text style={[styles.cardTitleFr, { color: colors.text.secondary }]}>{item.title_fr}</Text>
      <Text style={[styles.arabicPreview, { color: colors.text.primary }]}>{item.content.substring(0, 50)}...</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>{t('dua.title')}</Text>
        <Pressable onPress={handleAdd} style={styles.addBtn}>
          <Ionicons name="add" size={24} color="#FFF" />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={duas}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: colors.text.secondary, marginTop: 20 }}>{t('dua.noDuas')}</Text>}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                {editingDua ? t('dua.editDua') : t('dua.addDua')}
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </Pressable>
            </View>

            <ScrollView style={styles.formScroll}>
              <Text style={[styles.label, { color: colors.text.secondary }]}>{t('dua.categoryLabel')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text.primary }]}
                value={category}
                onChangeText={setCategory}
                placeholder="e.g. Morning"
                placeholderTextColor={colors.text.tertiary}
              />

              <Text style={[styles.label, { color: colors.text.secondary }]}>{t('dua.titleLabel')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text.primary }]}
                value={title}
                onChangeText={setTitle}
                placeholder="English Title"
                placeholderTextColor={colors.text.tertiary}
              />

              <Text style={[styles.label, { color: colors.text.secondary }]}>{t('dua.titleFrLabel')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text.primary }]}
                value={titleFr}
                onChangeText={setTitleFr}
                placeholder="French Title"
                placeholderTextColor={colors.text.tertiary}
              />

              <Text style={[styles.label, { color: colors.text.secondary }]}>{t('dua.contentLabel')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text.primary, height: 100 }]}
                value={content}
                onChangeText={setContent}
                placeholder="Arabic Text"
                placeholderTextColor={colors.text.tertiary}
                multiline
              />

              <Text style={[styles.label, { color: colors.text.secondary }]}>{t('dua.transliterationLabel')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text.primary }]}
                value={transliteration}
                onChangeText={setTransliteration}
                placeholder="Optional"
                placeholderTextColor={colors.text.tertiary}
                multiline
              />

              <Text style={[styles.label, { color: colors.text.secondary }]}>{t('dua.translationLabel')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text.primary, height: 80 }]}
                value={translation}
                onChangeText={setTranslation}
                placeholder="English Translation"
                placeholderTextColor={colors.text.tertiary}
                multiline
              />

              <Text style={[styles.label, { color: colors.text.secondary }]}>{t('dua.translationFrLabel')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text.primary, height: 80 }]}
                value={translationFr}
                onChangeText={setTranslationFr}
                placeholder="French Translation"
                placeholderTextColor={colors.text.tertiary}
                multiline
              />
            </ScrollView>

            <Pressable onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.saveBtnText}>{t('dua.save')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingTop: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  addBtn: { backgroundColor: '#10B981', padding: 8, borderRadius: 20 },
  listContent: { padding: 16 },
  card: { padding: 16, borderRadius: 12, marginBottom: 16, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, color: '#FFF', fontSize: 12, fontWeight: 'bold', overflow: 'hidden' },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { padding: 4 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  cardTitleFr: { fontSize: 14, fontStyle: 'italic', marginBottom: 8 },
  arabicPreview: { fontSize: 16, textAlign: 'right', fontFamily: 'System' }, // Use appropriate Arabic font if available
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { height: '90%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  formScroll: { flex: 1 },
  label: { fontSize: 14, marginBottom: 6, fontWeight: '600' },
  input: { padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 16, textAlignVertical: 'top' },
  saveBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});

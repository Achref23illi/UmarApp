import { useTheme } from '@/hooks/use-theme';
import i18n from '@/locales/i18n';
import { Dua, socialService } from '@/services/socialService';
import { useAppSelector } from '@/store/hooks';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    LayoutAnimation,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    UIManager,
    View
} from 'react-native';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function DuaScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const currentLanguage = useAppSelector(state => state.language.currentLanguage);
  const t = (key: string) => i18n.t(key, { locale: currentLanguage });

  const [duas, setDuas] = useState<Dua[]>([]);
  const [filteredDuas, setFilteredDuas] = useState<Dua[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDuas();
  }, []);

  useEffect(() => {
    filterDuas();
  }, [searchQuery, selectedCategory, duas]);

  const loadDuas = async () => {
    setLoading(true);
    const data = await socialService.getDuas();
    setDuas(data);
    
    // Extract categories
    const cats = Array.from(new Set(data.map(d => d.category)));
    setCategories(cats);
    
    setLoading(false);
  };

  const filterDuas = () => {
    let filtered = duas;

    if (selectedCategory) {
      filtered = filtered.filter(d => d.category === selectedCategory);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(d => 
        d.title.toLowerCase().includes(q) ||
        d.title_fr.toLowerCase().includes(q) ||
        d.translation.toLowerCase().includes(q) ||
        d.translation_fr.toLowerCase().includes(q)
      );
    }

    setFilteredDuas(filtered);
  };

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const renderCategoryItem = ({ item }: { item: string }) => (
    <Pressable
      style={[
        styles.categoryChip,
        { 
          backgroundColor: selectedCategory === item ? colors.primary : colors.surface,
          borderColor: colors.border 
        }
      ]}
      onPress={() => setSelectedCategory(selectedCategory === item ? null : item)}
    >
      <Text style={[
        styles.categoryText,
        { color: selectedCategory === item ? '#FFF' : colors.text.primary }
      ]}>
        {item}
      </Text>
    </Pressable>
  );

  const renderDuaItem = ({ item }: { item: Dua }) => {
    const isExpanded = expandedId === item.id;
    const title = currentLanguage === 'fr' && item.title_fr ? item.title_fr : item.title;
    const translation = currentLanguage === 'fr' && item.translation_fr ? item.translation_fr : item.translation;

    return (
      <Pressable 
        style={[styles.duaCard, { backgroundColor: colors.surface }]}
        onPress={() => toggleExpand(item.id)}
      >
        <View style={styles.duaHeader}>
          <Text style={[styles.duaTitle, { color: colors.primary }]}>{title}</Text>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={colors.text.secondary} 
          />
        </View>

        {isExpanded && (
          <View style={styles.duaContent}>
            <Text style={[styles.arabicText, { color: colors.text.primary }]}>{item.content}</Text>
            
            {item.transliteration && (
              <View style={styles.section}>
                <Text style={[styles.label, { color: colors.text.tertiary }]}>{t('dua.transliterationLabel')}</Text>
                <Text style={[styles.text, { color: colors.text.secondary, fontStyle: 'italic' }]}>{item.transliteration}</Text>
              </View>
            )}

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text.tertiary }]}>{t('dua.translationLabel')}</Text>
              <Text style={[styles.text, { color: colors.text.secondary }]}>{translation}</Text>
            </View>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>{t('dua.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
          <Ionicons name="search" size={20} color={colors.text.tertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text.primary }]}
            placeholder={t('dua.searchPlaceholder')}
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.text.tertiary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
          keyExtractor={(item) => item}
          renderItem={renderCategoryItem}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredDuas}
          keyExtractor={(item) => item.id}
          renderItem={renderDuaItem}
          contentContainerStyle={styles.listContent}
          initialNumToRender={10}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', color: colors.text.secondary, marginTop: 40 }}>
              {t('dua.noDuas')}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    padding: 16, 
    paddingTop: 60, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 3 
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  searchContainer: { padding: 16, paddingBottom: 8 },
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    borderRadius: 12, 
    height: 48 
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16 },
  categoriesContainer: { paddingBottom: 8 },
  categoriesContent: { paddingHorizontal: 16, gap: 8 },
  categoryChip: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    borderWidth: 1 
  },
  categoryText: { fontSize: 14, fontWeight: '600' },
  listContent: { padding: 16, paddingTop: 8 },
  duaCard: { 
    borderRadius: 16, 
    marginBottom: 12, 
    padding: 16, 
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  duaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  duaTitle: { fontSize: 18, fontWeight: 'bold', flex: 1, marginRight: 8 },
  duaContent: { marginTop: 16 },
  arabicText: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    textAlign: 'right', 
    color: '#000', 
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Geeza Pro' : 'serif' 
  },
  section: { marginTop: 12 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  text: { fontSize: 16, lineHeight: 24 }
});

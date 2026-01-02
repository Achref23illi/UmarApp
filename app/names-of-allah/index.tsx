/**
 * 99 Names of Allah Screen
 * =========================
 * Beautiful display of Asma ul Husna with meanings.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { useAppSelector } from '@/store/hooks';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Sample of 99 Names (abbreviated for brevity, you can add all 99)
const NAMES_OF_ALLAH = [
  { id: 1, arabic: 'الرَّحْمَنُ', transliteration: 'Ar-Rahman', meaning: 'The Most Gracious' },
  { id: 2, arabic: 'الرَّحِيمُ', transliteration: 'Ar-Raheem', meaning: 'The Most Merciful' },
  { id: 3, arabic: 'الْمَلِكُ', transliteration: 'Al-Malik', meaning: 'The King' },
  { id: 4, arabic: 'الْقُدُّوسُ', transliteration: 'Al-Quddus', meaning: 'The Most Holy' },
  { id: 5, arabic: 'السَّلَامُ', transliteration: 'As-Salam', meaning: 'The Source of Peace' },
  { id: 6, arabic: 'الْمُؤْمِنُ', transliteration: 'Al-Mu\'min', meaning: 'The Guardian of Faith' },
  { id: 7, arabic: 'الْمُهَيْمِنُ', transliteration: 'Al-Muhaymin', meaning: 'The Protector' },
  { id: 8, arabic: 'الْعَزِيزُ', transliteration: 'Al-Aziz', meaning: 'The Almighty' },
  { id: 9, arabic: 'الْجَبَّارُ', transliteration: 'Al-Jabbar', meaning: 'The Compeller' },
  { id: 10, arabic: 'الْمُتَكَبِّرُ', transliteration: 'Al-Mutakabbir', meaning: 'The Greatest' },
  { id: 11, arabic: 'الْخَالِقُ', transliteration: 'Al-Khaliq', meaning: 'The Creator' },
  { id: 12, arabic: 'الْبَارِئُ', transliteration: 'Al-Bari', meaning: 'The Evolver' },
  { id: 13, arabic: 'الْمُصَوِّرُ', transliteration: 'Al-Musawwir', meaning: 'The Fashioner' },
  { id: 14, arabic: 'الْغَفَّارُ', transliteration: 'Al-Ghaffar', meaning: 'The Forgiving' },
  { id: 15, arabic: 'الْقَهَّارُ', transliteration: 'Al-Qahhar', meaning: 'The Subduer' },
  { id: 16, arabic: 'الْوَهَّابُ', transliteration: 'Al-Wahhab', meaning: 'The Bestower' },
  { id: 17, arabic: 'الرَّزَّاقُ', transliteration: 'Ar-Razzaq', meaning: 'The Provider' },
  { id: 18, arabic: 'الْفَتَّاحُ', transliteration: 'Al-Fattah', meaning: 'The Opener' },
  { id: 19, arabic: 'اَلْعَلِيْمُ', transliteration: 'Al-Alim', meaning: 'The All-Knowing' },
  { id: 20, arabic: 'الْقَابِضُ', transliteration: 'Al-Qabid', meaning: 'The Constrictor' },
  // Add more names as needed...
];

export default function NamesOfAllahScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  
  const fontRegular = getFont(currentLanguage, 'regular');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontSemiBold = getFont(currentLanguage, 'semiBold');
  const fontBold = getFont(currentLanguage, 'bold');

  const [searchQuery, setSearchQuery] = useState('');

  const filteredNames = NAMES_OF_ALLAH.filter(
    name => 
      name.transliteration.toLowerCase().includes(searchQuery.toLowerCase()) ||
      name.meaning.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item, index }: { item: typeof NAMES_OF_ALLAH[0]; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <Pressable style={[styles.nameCard, { backgroundColor: colors.surface }]}>
        <LinearGradient
          colors={['#EC4899', '#DB2777']}
          style={styles.numberBadge}
        >
          <Text style={[styles.numberText, { fontFamily: fontBold }]}>{item.id}</Text>
        </LinearGradient>
        <View style={styles.nameContent}>
          <Text style={[styles.arabicName, { fontFamily: 'Amiri-Bold', color: colors.text.primary }]}>
            {item.arabic}
          </Text>
          <Text style={[styles.transliteration, { fontFamily: fontSemiBold, color: colors.primary }]}>
            {item.transliteration}
          </Text>
          <Text style={[styles.meaning, { fontFamily: fontRegular, color: colors.text.secondary }]}>
            {item.meaning}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          onPress={() => router.back()} 
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
            99 Names of Allah
          </Text>
          <Text style={[styles.headerSubtitle, { fontFamily: fontMedium, color: colors.text.secondary }]}>
            أسماء الله الحسنى
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Ionicons name="search" size={20} color={colors.text.secondary} />
        <TextInput
          style={[styles.searchInput, { fontFamily: fontRegular, color: colors.text.primary }]}
          placeholder="Search names..."
          placeholderTextColor={colors.text.disabled}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Names List */}
      <FlatList
        data={filteredNames}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  nameCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    gap: 16,
    alignItems: 'center',
  },
  numberBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    color: '#FFF',
    fontSize: 16,
  },
  nameContent: {
    flex: 1,
  },
  arabicName: {
    fontSize: 28,
    marginBottom: 4,
  },
  transliteration: {
    fontSize: 16,
    marginBottom: 2,
  },
  meaning: {
    fontSize: 13,
  },
});

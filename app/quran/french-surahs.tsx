/**
 * French Surahs List
 * ==================
 * List of all 114 Surahs with French translation
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { SURAHS, SurahInfo } from '@/services/quranData';
import { useAppSelector } from '@/store/hooks';

export default function FrenchSurahsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);

  const fontRegular = getFont(currentLanguage, 'regular');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontSemiBold = getFont(currentLanguage, 'semiBold');
  const fontBold = getFont(currentLanguage, 'bold');

  const [searchQuery, setSearchQuery] = useState('');

  const filteredSurahs = searchQuery
    ? SURAHS.filter(s =>
        s.transliteration.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.translation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.name.includes(searchQuery) ||
        s.number.toString() === searchQuery
      )
    : SURAHS;

  const handleSurahPress = (surah: SurahInfo) => {
    router.push({
      pathname: '/quran/french-reader',
      params: {
        chapterId: surah.number.toString(),
        chapterName: surah.transliteration,
      }
    });
  };

  const renderSurahItem = ({ item, index }: { item: SurahInfo; index: number }) => {
    return (
      <Animated.View entering={FadeInRight.delay(Math.min(index, 15) * 20)}>
        <Pressable
          style={({ pressed }) => [
            styles.surahItem,
            {
              backgroundColor: colors.surface,
              opacity: pressed ? 0.8 : 1,
            }
          ]}
          onPress={() => handleSurahPress(item)}
        >
          {/* Number Badge */}
          <View style={[styles.numberBadge, { backgroundColor: '#3B82F615' }]}>
            <Text style={[styles.numberText, { fontFamily: fontBold, color: '#3B82F6' }]}>
              {item.number}
            </Text>
          </View>

          {/* Surah Info */}
          <View style={styles.surahInfo}>
            <Text style={[styles.surahName, { fontFamily: fontSemiBold, color: colors.text.primary }]}>
              {item.transliteration}
            </Text>
            <Text style={[styles.surahMeta, { fontFamily: fontRegular, color: colors.text.secondary }]}>
              {item.translation} • {item.verses} Versets
            </Text>
          </View>

          {/* Arabic Name & Revelation */}
          <View style={styles.rightContent}>
            <Text style={[styles.arabicName, { color: colors.text.primary }]}>
              {item.name}
            </Text>
            <View style={[
              styles.revelationBadge,
              { backgroundColor: item.revelation === 'Meccan' ? '#F59E0B20' : '#3B82F620' }
            ]}>
              <Text style={[
                styles.revelationText,
                {
                  fontFamily: fontMedium,
                  color: item.revelation === 'Meccan' ? '#F59E0B' : '#3B82F6'
                }
              ]}>
                {item.revelation === 'Meccan' ? 'Mecquoise' : 'Médinoise'}
              </Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.surface }]}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
              Traduction Française
            </Text>
            <Text style={[styles.headerSubtitle, { fontFamily: fontRegular, color: colors.text.secondary }]}>
              114 Sourates
            </Text>
          </View>
          <View style={styles.backButton} />
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.input.background, borderColor: colors.input.border }]}>
          <Ionicons name="search" size={20} color={colors.text.secondary} />
          <TextInput
            style={[styles.searchInput, { fontFamily: fontRegular, color: colors.text.primary }]}
            placeholder="Rechercher une sourate..."
            placeholderTextColor={colors.input.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Surah List */}
      <FlatList
        data={filteredSurahs}
        renderItem={renderSurahItem}
        keyExtractor={(item) => item.number.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  surahItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  numberBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  numberText: {
    fontSize: 16,
  },
  surahInfo: {
    flex: 1,
    gap: 2,
  },
  surahName: {
    fontSize: 17,
  },
  surahMeta: {
    fontSize: 13,
  },
  rightContent: {
    alignItems: 'flex-end',
    gap: 6,
  },
  arabicName: {
    fontSize: 20,
    fontFamily: 'System',
  },
  revelationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  revelationText: {
    fontSize: 11,
  },
});

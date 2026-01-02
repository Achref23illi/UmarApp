/**
 * Surah List Screen
 * ==================
 * List of all 114 surahs for the selected edition
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
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
import { QURAN_EDITIONS, SURAH_NAMES, SurahMeta } from '@/services/quranLibrary';
import { useAppSelector } from '@/store/hooks';

export default function SurahsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { editionId, editionName } = useLocalSearchParams<{ editionId: string; editionName: string }>();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);

  const fontRegular = getFont(currentLanguage, 'regular');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontSemiBold = getFont(currentLanguage, 'semiBold');
  const fontBold = getFont(currentLanguage, 'bold');

  const [searchQuery, setSearchQuery] = useState('');
  
  const edition = QURAN_EDITIONS.find(e => e.id === editionId);
  const isArabic = edition?.languageCode === 'ar';

  const filteredSurahs = searchQuery
    ? SURAH_NAMES.filter(s =>
        s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.englishTranslation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.arabicName.includes(searchQuery) ||
        s.number.toString() === searchQuery
      )
    : SURAH_NAMES;

  const handleSurahPress = (surah: SurahMeta) => {
    router.push({
      pathname: '/quran/reader',
      params: { 
        editionId, 
        surahNumber: surah.number.toString(),
        surahName: isArabic ? surah.arabicName : surah.englishName
      }
    });
  };

  const renderSurahItem = ({ item, index }: { item: SurahMeta; index: number }) => {
    return (
      <Animated.View entering={FadeInRight.delay(Math.min(index, 15) * 30)}>
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
          <View style={[styles.numberBadge, { backgroundColor: colors.primary + '15' }]}>
            <Text style={[styles.numberText, { fontFamily: fontBold, color: colors.primary }]}>
              {item.number}
            </Text>
          </View>
          
          {/* Surah Info */}
          <View style={styles.surahInfo}>
            <Text style={[styles.surahName, { fontFamily: fontSemiBold, color: colors.text.primary }]}>
              {isArabic ? item.arabicName : item.englishName}
            </Text>
            <Text style={[styles.surahMeta, { fontFamily: fontRegular, color: colors.text.secondary }]}>
              {item.englishTranslation} • {item.numberOfAyahs} Ayahs
            </Text>
          </View>
          
          {/* Arabic Name & Revelation */}
          <View style={styles.rightContent}>
            {!isArabic && (
              <Text style={[styles.arabicName, { color: colors.text.primary }]}>
                {item.arabicName}
              </Text>
            )}
            <View style={[
              styles.revelationBadge, 
              { backgroundColor: item.revelationType === 'Meccan' ? '#F59E0B20' : '#3B82F620' }
            ]}>
              <Text style={[
                styles.revelationText, 
                { 
                  fontFamily: fontMedium, 
                  color: item.revelationType === 'Meccan' ? '#F59E0B' : '#3B82F6' 
                }
              ]}>
                {item.revelationType}
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
              {editionName || 'Quran'}
            </Text>
            <Text style={[styles.headerSubtitle, { fontFamily: fontRegular, color: colors.text.secondary }]}>
              {edition?.language} Edition
            </Text>
          </View>
          <View style={styles.backButton} />
        </View>
        
        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.input.background, borderColor: colors.input.border }]}>
          <Ionicons name="search" size={20} color={colors.text.secondary} />
          <TextInput
            style={[styles.searchInput, { fontFamily: fontRegular, color: colors.text.primary }]}
            placeholder="Search surah..."
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
    fontSize: 18,
  },
  headerSubtitle: {
    fontSize: 12,
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
    fontSize: 14,
  },
  surahInfo: {
    flex: 1,
    gap: 2,
  },
  surahName: {
    fontSize: 16,
  },
  surahMeta: {
    fontSize: 12,
  },
  rightContent: {
    alignItems: 'flex-end',
    gap: 4,
  },
  arabicName: {
    fontSize: 18,
    fontFamily: 'System',
  },
  revelationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  revelationText: {
    fontSize: 10,
  },
});

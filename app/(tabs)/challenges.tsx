import ChallengeCategoryCard from '@/components/challenges/ChallengeCategoryCard';
import MyChallengesView from '@/components/challenges/MyChallengesView';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { ChallengeCategory, challengeService } from '@/services/challengeService';
import { useAppSelector } from '@/store/hooks';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChallengesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'my_challenges' | 'categories'>('categories');
  
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontBold = getFont(currentLanguage, 'bold');

  const [categories, setCategories] = useState<ChallengeCategory[]>(
    () => challengeService.getFallbackCategories()
  );
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const loadCategories = useCallback(async () => {
    try {
      setIsLoadingCategories(true);
      const data = await challengeService.getCategories();
      setCategories(data ?? []);
    } catch (error) {
      console.error('Failed to load challenge categories:', error);
      setCategories([]);
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable
          style={[styles.tab, activeTab === 'my_challenges' && styles.activeTab]}
          onPress={() => setActiveTab('my_challenges')}
        >
          <Text style={[
            styles.tabText, 
            { fontFamily: fontMedium, color: colors.text.secondary },
            activeTab === 'my_challenges' && { color: colors.primary, fontFamily: fontBold }
          ]}>
            Mes challenges
          </Text>
          {activeTab === 'my_challenges' && <View style={[styles.activeLine, { backgroundColor: colors.primary }]} />}
        </Pressable>

        <Pressable
          style={[styles.tab, activeTab === 'categories' && styles.activeTab]}
          onPress={() => setActiveTab('categories')}
        >
          <Text style={[
             styles.tabText, 
             { fontFamily: fontMedium, color: colors.text.secondary },
             activeTab === 'categories' && { color: colors.primary, fontFamily: fontBold }
          ]}>
            Challenge
          </Text>
          {activeTab === 'categories' && <View style={[styles.activeLine, { backgroundColor: colors.primary }]} />}
        </Pressable>
      </View>

      {/* Content */}
      <View style={[styles.content, { backgroundColor: colors.background }]}>
        {activeTab === 'categories' ? (
          isLoadingCategories && categories.length === 0 ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : categories.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.text.primary }]}>Aucun challenge</Text>
              <Text style={[styles.emptySubText, { color: colors.text.secondary }]}>
                Les challenges seront bientôt disponibles.
              </Text>
              <Pressable
                onPress={loadCategories}
                style={{ marginTop: 16, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.primary }}
              >
                <Text style={{ color: '#fff', fontFamily: fontBold }}>Actualiser</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable onPress={() => router.push(`/challenge-details/${item.slug}`)}>
                  <ChallengeCategoryCard
                    title={item.title}
                    subtitle={item.subtitle ?? undefined}
                    description={item.description ?? undefined}
                    duration={item.duration}
                    levels={item.levels}
                    prerequisite={item.prerequisite}
                    iconName={item.iconName}
                    imageSource={item.imageUrl ? { uri: item.imageUrl } : undefined}
                    isLocked={item.isLocked}
                    color={item.color}
                  />
                </Pressable>
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )
        ) : (
          <MyChallengesView onSwitchToChallenges={() => setActiveTab('categories')} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    position: 'relative',
  },
  activeTab: {
  },
  tabText: {
    fontSize: 16,
  },
  activeLine: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // Extra space for bottom tab bar
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

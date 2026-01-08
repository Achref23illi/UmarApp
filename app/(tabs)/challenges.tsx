import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Dimensions, ImageBackground } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import ChallengeCategoryCard from '@/components/challenges/ChallengeCategoryCard';
import MyChallengesView from '@/components/challenges/MyChallengesView';

// Import images
const QURAN_IMG = { uri: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=400&q=80' };
const SALAT_IMG = { uri: 'https://images.unsplash.com/photo-1564121211835-e88c852648ab?w=400&q=80' };
const FASTING_IMG = { uri: 'https://images.unsplash.com/photo-1585675373807-6f0227926e85?w=400&q=80' };
const SADAQA_IMG = { uri: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400&q=80' };
const PERSO_IMG = { uri: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&q=80' };
const ADAB_IMG = { uri: 'https://images.unsplash.com/photo-1519818804723-5e921d6d8412?w=400&q=80' };
const EDU_IMG = { uri: 'https://images.unsplash.com/photo-1588614560706-921d4c22cc7b?w=400&q=80' };

const CHALLENGES_DATA = [
  {
    id: '1',
    title: 'Coran',
    duration: '3 semaines',
    levels: '3 niveaux',
    prerequisite: 'Aucun',
    iconName: 'book-outline',
    imageSource: QURAN_IMG,
    color: '#000',
  },
  {
    id: '2',
    title: 'Salat',
    subtitle: 'Obligatoire',
    description: 'La salât constitue certainement la plus importante et bénéfique des adorations.\n«Et accomplissez la Prière, et acquittez la Zakat, et inclinez-vous avec ceux qui s’inclinent.» (Sourate 2, Verset 43)',
    duration: '3 semaines',
    levels: '3 niveaux',
    prerequisite: 'Aucun',
    iconName: 'person-outline',
    imageSource: SALAT_IMG,
    color: '#000',
  },
  {
    id: '3',
    title: 'Salat',
    subtitle: 'Surérogatoire',
    description: 'La salât constitue certainement la plus importante et bénéfique des adorations.\n«Et accomplissez la Prière, et acquittez la Zakat, et inclinez-vous avec ceux qui s’inclinent.» (Sourate 2, Verset 43)',
    duration: '3 semaines',
    levels: '3 niveaux',
    prerequisite: 'Salat obligatoire',
    iconName: 'person-outline',
    imageSource: SALAT_IMG, // Same image for now
    isLocked: true,
    color: '#000',
  },
  {
    id: '4',
    title: 'Jeûne',
    description: '« Ô les croyants! On vous a prescrit as-Siyâm comme on l’a prescrit à ceux d’avant vous, ainsi atteindrez-vous la piété, pendant un nombre déterminé de jours »\n(Sourate 2, Verset 183)',
    duration: '3 semaines',
    levels: '3 niveaux',
    prerequisite: 'Aucun',
    iconName: 'restaurant-outline',
    imageSource: FASTING_IMG,
    color: '#000',
  },
  {
    id: '5',
    title: 'Sadaqa',
    duration: '3 semaines',
    levels: '3 niveaux',
    prerequisite: 'Aucun',
    iconName: 'heart-outline',
    imageSource: SADAQA_IMG,
    color: '#000',
  },
  {
    id: '6',
    title: '!? Perso',
    duration: '3 semaines',
    levels: '3 niveaux',
    prerequisite: 'Aucun',
    iconName: 'help-outline',
    imageSource: PERSO_IMG,
    color: '#000',
  },
  {
    id: '7',
    title: 'Adab',
    duration: '3 semaines',
    levels: '3 niveaux',
    prerequisite: 'Aucun',
    iconName: 'people-outline',
    imageSource: ADAB_IMG,
    color: '#000',
  },
  {
    id: '8',
    title: 'Education',
    duration: '3 semaines',
    levels: '3 niveaux',
    prerequisite: 'Aucun',
    iconName: 'school-outline',
    imageSource: EDU_IMG,
    color: '#000',
  },
];

export default function ChallengesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'my_challenges' | 'categories'>('categories');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Tabs */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, activeTab === 'my_challenges' && styles.activeTab]}
          onPress={() => setActiveTab('my_challenges')}
        >
          <Text style={[styles.tabText, activeTab === 'my_challenges' && styles.activeTabText]}>
            Mes challenges
          </Text>
          {activeTab === 'my_challenges' && <View style={styles.activeLine} />}
        </Pressable>

        <Pressable
          style={[styles.tab, activeTab === 'categories' && styles.activeTab]}
          onPress={() => setActiveTab('categories')}
        >
          <Text style={[styles.tabText, activeTab === 'categories' && styles.activeTabText]}>
            Challenge
          </Text>
          {activeTab === 'categories' && <View style={styles.activeLine} />}
        </Pressable>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'categories' ? (
          <FlatList
            data={CHALLENGES_DATA}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable onPress={() => router.push(`/challenge-details/${item.id}`)}>
                <ChallengeCategoryCard
                  title={item.title}
                  subtitle={item.subtitle}
                  description={item.description}
                  duration={item.duration}
                  levels={item.levels}
                  prerequisite={item.prerequisite}
                  iconName={item.iconName}
                  imageSource={item.imageSource}
                  isLocked={item.isLocked}
                  color={item.color}
                />
              </Pressable>
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <MyChallengesView />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // White background based on image, or light gray
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    position: 'relative',
  },
  activeTab: {
    // Background can change or just the line indicator
  },
  tabText: {
    fontSize: 16,
    fontFamily: 'Metropolis-Medium',
    color: '#999',
  },
  activeTabText: {
    color: '#670FA4', // Primary color
    fontFamily: 'Metropolis-Bold',
  },
  activeLine: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 3,
    backgroundColor: '#670FA4',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  content: {
    flex: 1,
    backgroundColor: '#f5f5f5', // Light gray background for the list area
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
    color: '#333',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

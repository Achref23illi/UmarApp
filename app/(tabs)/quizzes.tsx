import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Dimensions, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { QuizCategory, socialService } from '@/services/socialService';
import { useAppSelector } from '@/store/hooks';

const { width } = Dimensions.get('window');

// Redesign: List Layout
const ITEM_HEIGHT = 120;
const ITEM_WIDTH = width - 40; // Full width minus padding

export default function QuizzesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  
  const [categories, setCategories] = useState<QuizCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [showAchievements, setShowAchievements] = useState(false);

  const fontBold = getFont(currentLanguage, 'bold');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontRegular = getFont(currentLanguage, 'regular');

  // Background Animation
  const bgOpacity = useSharedValue(0.05);

  useEffect(() => {
    bgOpacity.value = withRepeat(withTiming(0.1, { duration: 3000 }), -1, true);
    loadCategories();
    loadAchievements();
  }, []);

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  const loadCategories = async () => {
    setLoading(true);
    const data = await socialService.getQuizCategories();
    setCategories(data);
    setLoading(false);
  };

  const loadAchievements = async () => {
      const data = await socialService.getUserAchievements();
      setAchievements(data);
  };

  const handleCategoryPress = (category: QuizCategory) => {
    router.push(`/quizzes/${category.id}`);
  };

  const renderItem = ({ item, index }: { item: QuizCategory; index: number }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 150).springify()} 
      style={styles.cardContainer}
    >
      <Pressable 
        style={({ pressed }) => [
          styles.card, 
          { 
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderColor: '#F59E0B', // Gold Border
            transform: [{ scale: pressed ? 0.98 : 1 }]
          }
        ]}
        onPress={() => handleCategoryPress(item)}
      >
        <View style={styles.cardContent}>
            <View style={[styles.iconContainer, { backgroundColor: item.color || colors.primary }]}>
                <Ionicons name={item.icon as any || 'book'} size={32} color="#FFF" />
            </View>
            <View style={styles.textContainer}>
                <Text style={[styles.cardTitle, { fontFamily: fontBold }]}>
                    {currentLanguage === 'fr' ? (item.name_fr || item.name) : item.name}
                </Text>
                <Text style={[styles.cardDesc, { fontFamily: fontRegular }]} numberOfLines={2}>
                    {currentLanguage === 'fr' ? (item.description_fr || item.description) : item.description}
                </Text>
            </View>
            <View style={styles.arrowContainer}>
                 <Ionicons name="chevron-forward" size={24} color="#F59E0B" />
            </View>
        </View>
      </Pressable>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
        <LinearGradient
            colors={['#2E1065', '#4C1D95', '#5B21B6']} // Deep Purple Gradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.background}
        />
        
        {/* Islamic Background Pattern (Simulated with massive Moon icon) */}
        <Animated.View style={[styles.bgPattern, bgStyle]}>
            <Ionicons name="moon" size={500} color="#F59E0B" />
        </Animated.View>

        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
            <View>
                <Text style={[styles.headerTitle, { fontFamily: fontBold }]}>Knowledge Center</Text>
                <Text style={[styles.headerSubtitle, { fontFamily: fontMedium }]}>Expand your understanding</Text>
            </View>
            <View style={styles.headerButtons}>
                <Pressable 
                    style={[styles.achievementsButton, { marginRight: 8 }]}
                    onPress={() => router.push('/challenge')}
                >
                    <Ionicons name="game-controller" size={24} color="#F59E0B" />
                </Pressable>
                <Pressable 
                    style={styles.achievementsButton}
                    onPress={() => setShowAchievements(true)}
                >
                    <Ionicons name="trophy" size={24} color="#F59E0B" />
                </Pressable>
            </View>
        </View>

        {loading ? (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#F59E0B" />
            </View>
        ) : (
            <FlatList
                data={categories}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[styles.list, { paddingBottom: 120 }]}
                showsVerticalScrollIndicator={false}
            />
        )}
        
        <Modal
            animationType="slide"
            transparent={true}
            visible={showAchievements}
            onRequestClose={() => setShowAchievements(false)}
        >
            <View style={styles.modalContainer}>
                <View style={[styles.modalContent, { backgroundColor: isDark ? '#1F2937' : '#FFF' }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { fontFamily: fontBold, color: isDark ? '#FFF' : '#000' }]}>
                            Achievements
                        </Text>
                        <Pressable onPress={() => setShowAchievements(false)}>
                            <Ionicons name="close" size={24} color={isDark ? '#FFF' : '#6B7280'} />
                        </Pressable>
                    </View>
                    
                    <FlatList
                        data={achievements}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <View style={[
                                styles.achievementItem, 
                                !item.earned_at && styles.achievementLocked,
                                { borderColor: isDark ? '#374151' : '#E5E7EB' }
                            ]}>
                                <View style={[
                                    styles.badgeContainer, 
                                    item.earned_at ? { backgroundColor: '#FEF3C7' } : { backgroundColor: '#F3F4F6' }
                                ]}>
                                    <Ionicons 
                                        name={item.badge_icon as any} 
                                        size={24} 
                                        color={item.earned_at ? '#F59E0B' : '#9CA3AF'} 
                                    />
                                </View>
                                <View style={styles.achievementText}>
                                    <Text style={[styles.achievementTitle, { fontFamily: fontBold, color: isDark ? '#FFF' : '#000' }]}>
                                        {item.title}
                                    </Text>
                                    <Text style={[styles.achievementDesc, { fontFamily: fontRegular, color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                        {item.description}
                                    </Text>
                                </View>
                                {item.earned_at && (
                                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                )}
                            </View>
                        )}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
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
  background: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
  },
  bgPattern: {
      position: 'absolute',
      right: -150,
      bottom: -150,
      opacity: 0.1,
      transform: [{ rotate: '-15deg' }]
  },
  center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  },
  header: {
      paddingHorizontal: 24,
      marginBottom: 30,
  },
  headerTitle: {
      fontSize: 32,
      color: '#FFF',
      textShadowColor: 'rgba(0,0,0,0.3)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
  },
  headerSubtitle: {
      fontSize: 16,
      color: '#F59E0B',
      marginTop: 4,
      letterSpacing: 0.5,
  },
  list: {
      paddingHorizontal: 20,
      gap: 16,
  },
  cardContainer: {
      width: '100%',
  },
  card: {
      padding: 16,
      borderRadius: 20,
      borderWidth: 1,
      // Glassmorphism
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
  },
  cardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
  },
  iconContainer: {
      width: 60,
      height: 60,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
elevation: 3,
  },
  textContainer: {
      flex: 1,
  },
  cardTitle: {
      fontSize: 18,
      color: '#FFF',
      marginBottom: 4,
  },
  cardDesc: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.7)',
      lineHeight: 18,
  },
  arrowContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingLeft: 8,
  },
  headerButtons: {
      flexDirection: 'row',
  },
  achievementsButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  modalContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
      height: '60%',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
  },
  modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
  },
  modalTitle: {
      fontSize: 20,
  },
  achievementItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 12,
      gap: 12,
  },
  achievementLocked: {
      opacity: 0.6,
  },
  badgeContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
  },
  achievementText: {
      flex: 1,
  },
  achievementTitle: {
      fontSize: 16,
      marginBottom: 4,
  },
  achievementDesc: {
      fontSize: 14,
  }
});

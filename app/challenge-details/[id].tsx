import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions, ImageBackground } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Fonts } from '@/hooks/use-fonts';

// Tabs
import ProgressTab from '@/components/challenge-details/ProgressTab';
import GroupTab from '@/components/challenge-details/GroupTab';
import ContentTab from '@/components/challenge-details/ContentTab';

const { width } = Dimensions.get('window');

export default function ChallengeDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'progress' | 'group' | 'content'>('progress');

  const renderContent = () => {
    switch (activeTab) {
      case 'progress':
        return <ProgressTab />;
      case 'group':
        return <GroupTab />;
      case 'content':
        return <ContentTab />;
      default:
        return <ProgressTab />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Gradient Background */}
      <LinearGradient
        colors={['#670FA4', '#4A0B78']} // Purple gradient from screenshots
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.navBar}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#FFF" />
          </Pressable>
          <View style={styles.titleContainer}>
             <Text style={styles.headerTitle}>Challenge Coran</Text>
             <Ionicons name="book-outline" size={20} color="#FFF" style={{ marginLeft: 8 }} />
          </View>
          <View style={{ width: 28 }} /> 
        </View>

        {/* Custom Tab Bar */}
        <View style={styles.tabBar}>
          <Pressable 
            style={styles.tabItem} 
            onPress={() => setActiveTab('progress')}
          >
            <Ionicons 
              name="person" 
              size={24} 
              color={activeTab === 'progress' ? '#FFF' : 'rgba(255,255,255,0.5)'} 
            />
            <Text style={[
              styles.tabText, 
              activeTab === 'progress' && styles.activeTabText
            ]}>Ma progression</Text>
            {activeTab === 'progress' && <View style={styles.activeIndicator} />}
          </Pressable>

          <Pressable 
            style={styles.tabItem} 
            onPress={() => setActiveTab('group')}
          >
            <Ionicons 
              name="people" 
              size={24} 
              color={activeTab === 'group' ? '#FFF' : 'rgba(255,255,255,0.5)'} 
            />
            <Text style={[
              styles.tabText, 
              activeTab === 'group' && styles.activeTabText
            ]}>Mon groupe</Text>
            {activeTab === 'group' && <View style={styles.activeIndicator} />}
          </Pressable>

          <Pressable 
            style={styles.tabItem} 
            onPress={() => setActiveTab('content')}
          >
            <Ionicons 
              name="book" 
              size={24} 
              color={activeTab === 'content' ? '#FFF' : 'rgba(255,255,255,0.5)'} 
            />
            <Text style={[
              styles.tabText, 
              activeTab === 'content' && styles.activeTabText
            ]}>Le Coran</Text>
            {activeTab === 'content' && <View style={styles.activeIndicator} />}
          </Pressable>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingBottom: 0,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
  backButton: {
    padding: 4,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Metropolis-Bold',
    color: '#FFF',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
  },
  tabItem: {
    alignItems: 'center',
    paddingBottom: 12,
    flex: 1,
    position: 'relative',
    gap: 4,
  },
  tabText: {
    fontSize: 12,
    fontFamily: 'Metropolis-Medium',
    color: 'rgba(255,255,255,0.5)',
  },
  activeTabText: {
    color: '#FFF',
    fontFamily: 'Metropolis-Bold',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 60, 
    height: 4,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  contentContainer: {
    flex: 1,
  },
});

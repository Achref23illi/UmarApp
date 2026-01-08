import React from 'react';
import { View, Text, StyleSheet, ImageBackground, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '@/hooks/use-fonts';

const { width } = Dimensions.get('window');

interface ActiveChallengeCardProps {
  title: string;
  duration: string;
  levels: string;
  prerequisite: string;
  imageSource: any;
  progress?: number;
}

export default function ActiveChallengeCard({
  title,
  duration,
  levels,
  prerequisite,
  imageSource,
}: ActiveChallengeCardProps) {
  return (
    <View style={styles.container}>
      <ImageBackground source={imageSource} style={styles.imageBackground} imageStyle={styles.imageStyle}>
        {/* Badge "EN COURS" - Purple ribbon top left */}
        <View style={styles.badgeWrapper}>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>EN COURS</Text>
            </View>
        </View>

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        >
          <View style={styles.contentContainer}>
              <Text style={styles.title}>{title}</Text>
              
              <View style={styles.metaContainer}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color="#D8B4FE" />
                  <Text style={styles.metaText}>{duration}</Text>
                </View>
                
                <View style={styles.metaItem}>
                  <Ionicons name="stats-chart-outline" size={14} color="#D8B4FE" />
                  <Text style={styles.metaText}>{levels}</Text>
                </View>

                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Pré-requis : </Text>
                  <Text style={styles.metaText}>{prerequisite}</Text>
                </View>
              </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width - 32, // Full width minus padding
    height: 220,
    borderRadius: 20,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    alignSelf: 'center',
    backgroundColor: '#fff',
  },
  imageBackground: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  imageStyle: {
    borderRadius: 20,
  },
  badgeWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 100,
    height: 100,
    overflow: 'hidden',
    zIndex: 10,
    borderTopLeftRadius: 20,
  },
  badgeContainer: {
    backgroundColor: '#7C3AED', // Strong Purple
    paddingVertical: 6,
    width: 150,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-45deg' }, { translateX: -45 }, { translateY: -10 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Metropolis-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    justifyContent: 'flex-end',
    padding: 20,
  },
  contentContainer: {
    gap: 8,
  },
  title: {
    fontSize: 32,
    color: '#fff',
    fontFamily: 'Metropolis-Bold',
    textAlign: 'right', 
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 4,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  metaText: {
    color: '#F3F4F6',
    fontSize: 11,
    fontFamily: 'Metropolis-Medium',
  },
  metaLabel: {
    color: '#D8B4FE', // Light purple
    fontSize: 11,
    fontFamily: 'Metropolis-Bold',
  },
});

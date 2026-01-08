import React from 'react';
import { View, Text, StyleSheet, ImageBackground, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

interface CompletedChallengeCardProps {
  title: string;
  date: string;
  imageSource: any;
  progress: number;
  stats?: string;
}

export default function CompletedChallengeCard({
  title,
  date,
  imageSource,
  progress,
}: CompletedChallengeCardProps) {
  return (
    <View style={styles.container}>
      <ImageBackground source={imageSource} style={styles.image} imageStyle={{ borderRadius: 16 }}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
          style={styles.gradient}
        >
          <View style={styles.content}>
             <View>
                 <Text style={styles.title}>{title}</Text>
                 <View style={styles.dateRow}>
                    <Ionicons name="calendar-outline" size={10} color="#D1D5DB" />
                    <Text style={styles.date}>{date}</Text>
                 </View>
             </View>
             
             <View style={styles.progressContainer}>
                <Ionicons name="refresh-circle-outline" size={16} color="#A78BFA" />
                <Text style={styles.progressText}>{progress}%</Text>
             </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: 140,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: '#f0f0f0',
  },
  image: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 10,
  },
  content: {
    gap: 4,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Metropolis-Bold',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  date: {
    color: '#D1D5DB',
    fontSize: 10,
    fontFamily: 'Metropolis-Regular',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 2,
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Metropolis-Bold',
  },
});

import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GroupCardProps {
  title: string;
  imageSource: any;
  onPress?: () => void;
}

export default function GroupCard({ title, imageSource, onPress }: GroupCardProps) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.container}>
      <ImageBackground source={imageSource} style={styles.image} imageStyle={{ borderRadius: 16 }}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradient}
        >
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 140,
    height: 140,
    marginRight: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 12,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Metropolis-Bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

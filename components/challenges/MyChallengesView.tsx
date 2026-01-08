import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import ActiveChallengeCard from './ActiveChallengeCard';
import GroupCard from './GroupCard';
import CompletedChallengeCard from './CompletedChallengeCard';

const { width } = Dimensions.get('window');

// Placeholder images - in real app use proper assets
const BG_IMAGE = require('@/assets/images/bg-wa.jpg'); 
// Using same image for demo purposes, should be varied
const DEMO_IMAGE_1 = require('@/assets/images/bg-wa.jpg'); 
const DEMO_IMAGE_2 = require('@/assets/images/bg-wa.jpg');

export default function MyChallengesView() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Featured / Active Challenge */}
      <View style={styles.section}>
        <ActiveChallengeCard
          title="AS SALAT"
          duration="5 semaines"
          levels="3 niveaux"
          prerequisite="Aucun"
          imageSource={BG_IMAGE}
        />
        {/* Pagination dots simulation */}
        <View style={styles.dotsContainer}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>

      {/* My Groups */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mes groupes</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
          <GroupCard title="Objectif firdaws" imageSource={DEMO_IMAGE_1} />
          <GroupCard title="Coran" imageSource={DEMO_IMAGE_2} />
          <GroupCard title="Jeûne" imageSource={DEMO_IMAGE_1} />
        </ScrollView>
      </View>

      {/* Completed Challenges */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Challenges terminés</Text>
        <View style={styles.grid}>
           <CompletedChallengeCard
              title="Prier à l'heure"
              date="27 Avril 2019"
              progress={100}
              imageSource={DEMO_IMAGE_2}
           />
           <CompletedChallengeCard
              title="Salat al Fajr"
              date="27 Avril 2019"
              progress={91}
              imageSource={DEMO_IMAGE_1}
           />
           <CompletedChallengeCard
              title="Lecture Coran"
              date="15 Mai 2019"
              progress={100}
              imageSource={DEMO_IMAGE_2}
           />
           <CompletedChallengeCard
              title="Sadaqa"
              date="01 Juin 2019"
              progress={85}
              imageSource={DEMO_IMAGE_1}
           />
        </View>
      </View>
      
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Metropolis-Bold',
    color: '#1F2937',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  horizontalScroll: {
    paddingHorizontal: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  activeDot: {
    backgroundColor: '#7C3AED', // Purple
    width: 24, // Elongated active dot
    height: 8,
    borderRadius: 4,
    marginTop: 0,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
});

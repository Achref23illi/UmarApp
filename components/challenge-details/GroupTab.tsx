import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');

const INITIAL_PARTICIPANTS = [
  { id: 1, name: 'Mounir A.', image: null, active: false },
  { id: 2, name: 'Jouad B.', image: null, active: true },
  { id: 3, name: 'Samir A.', image: null, active: false },
  { id: 4, name: 'Mohamed', image: null, active: false },
  { id: 5, name: 'Karim', image: null, active: false },
];

export default function GroupTab() {
  const [participants, setParticipants] = useState(INITIAL_PARTICIPANTS);
  const [activeParticipant, setActiveParticipant] = useState(INITIAL_PARTICIPANTS[1]);

  const handleParticipantPress = (id: number) => {
    const newParticipants = participants.map(p => ({
      ...p,
      active: p.id === id
    }));
    setParticipants(newParticipants);
    const active = newParticipants.find(p => p.id === id);
    if (active) setActiveParticipant(active);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* Participants Header */}
      <View style={styles.participantsContainer}>
        <Text style={styles.participantsTitle}>7 participants</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.participantsScroll}>
          {participants.map((p) => (
            <Pressable 
              key={p.id} 
              style={styles.participantItem}
              onPress={() => handleParticipantPress(p.id)}
            >
              <View style={[styles.avatarContainer, p.active && styles.activeAvatar]}>
                 <Ionicons name="person" size={32} color={p.active ? "#670FA4" : "#ccc"} />
              </View>
              <Text style={[styles.participantName, p.active && styles.activeName]}>{p.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Group Progress Chart */}
      <View style={styles.chartCard}>
         <View style={styles.chartHeader}>
             <Text style={styles.chartTitle}>Progression de {activeParticipant.name}</Text>
             <View style={styles.purpleUnderline} />
         </View>
         
         <GroupProgressChart activeId={activeParticipant.id} />
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
          {/* Connection Stat */}
          <View style={styles.statBox}>
              <Text style={styles.statTitle}>Connexion</Text>
              <View style={styles.statUnderline} />
              <Text style={styles.statDesc}>
                  Dernière connexion il y a 18 heures.
              </Text>
          </View>

          {/* Reading Daily Stat */}
          <View style={styles.statBox}>
              <Text style={styles.statTitle}>Lecture journalière</Text>
              <View style={styles.statUnderline} />
              <View style={{ alignItems: 'flex-end', marginTop: 8 }}>
                  <Text style={styles.statValue}>Régulière</Text>
                  <Text style={styles.statSubValue}>
                      <Text style={{color: '#670FA4'}}>Moyene : </Text> 
                      2 heures 12 min
                  </Text>
              </View>
          </View>
      </View>

       <View style={styles.statsGrid}>
          {/* Reading Trends */}
          <View style={styles.statBox}>
              <Text style={styles.statTitle}>Tendance de lecture</Text>
              <View style={styles.statUnderline} />
              <View style={styles.trendList}>
                  <Text style={styles.trendItem}>L'aube : 0%</Text>
                  <Text style={styles.trendItem}>La matinée : 35%</Text>
                  <Text style={styles.trendItem}>L'après-midi : 2%</Text>
                  <Text style={styles.trendItem}>Le soir : 63%</Text>
              </View>
          </View>

          {/* Progression */}
          <View style={styles.statBox}>
              <Text style={styles.statTitle}>Progression</Text>
              <View style={styles.statUnderline} />
              <View style={{ alignItems: 'flex-end', marginTop: 16 }}>
                  <Text style={styles.progressionText}>
                      En avance de 2 hizb sur le programme.
                  </Text>
              </View>
          </View>
      </View>

      {/* Central Donut Overlay */}
      <View style={styles.donutOverlay}>
          <View style={styles.donutCircle}>
               <Text style={styles.donutText}>35%</Text>
          </View>
      </View>

      <View style={{height: 40}} />
    </ScrollView>
  );
}

const GroupProgressChart = ({ activeId }: { activeId: number }) => {
    // Generate random position based on activeId to simulate data change
    const activeY = 40 + (activeId % 3) * 20;

    return (
        <View style={{ height: 160, width: '100%', marginTop: 10, justifyContent: 'center' }}>
            {/* Tooltip */}
             <View style={[styles.tooltip, { top: activeY - 40 }]}>
                 <Text style={styles.tooltipValue}>{22 + (activeId % 5)}</Text>
                 <Text style={styles.tooltipLabel}>Hizbs</Text>
                 <View style={styles.tooltipArrow} />
            </View>

            <Svg height="120" width="100%" viewBox="0 0 320 120">
                {/* Horizontal Grid Lines */}
                <Line x1="0" y1="30" x2="320" y2="30" stroke="#f5f5f5" strokeWidth="1" />
                <Line x1="0" y1="60" x2="320" y2="60" stroke="#f5f5f5" strokeWidth="1" />
                <Line x1="0" y1="90" x2="320" y2="90" stroke="#f5f5f5" strokeWidth="1" />

                {/* Data Points */}
                {/* Randomly placed dots for effect */}
                <Circle cx="40" cy="80" r="4" fill="#f0f0f0" />
                <Circle cx="90" cy="60" r="4" fill="#f0f0f0" />
                <Circle cx="140" cy="90" r="4" fill="#f0f0f0" />
                
                {/* Highlighted Point (Active Participant) */}
                <Circle cx="180" cy={activeY} r="8" fill="#670FA4" fillOpacity={0.2} />
                <Circle cx="180" cy={activeY} r="4" fill="#670FA4" />

                <Circle cx="230" cy="70" r="4" fill="#f0f0f0" />
                <Circle cx="280" cy="80" r="4" fill="#f0f0f0" />
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    backgroundColor: '#F9FAFB',
  },
  participantsContainer: {
    marginBottom: 20,
    paddingLeft: 16,
  },
  participantsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  participantsScroll: {
    paddingRight: 20,
  },
  participantItem: {
    alignItems: 'center',
    marginRight: 20,
    width: 60,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeAvatar: {
    borderWidth: 2,
    borderColor: '#670FA4',
    backgroundColor: '#F3E5F5',
  },
  participantName: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },

  activeName: {
    color: '#670FA4',
    fontWeight: 'bold',
  },

  chartCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    height: 200,
  },
  chartHeader: {
    marginBottom: 10,
  },
  chartTitle: {
    fontSize: 14,
    color: '#670FA4',
  },
  purpleUnderline: {
      width: 30,
      height: 2,
      backgroundColor: '#670FA4',
      marginTop: 4,
  },

  tooltip: {
      position: 'absolute',
      top: 0,
      left: 160, // approximate center
      backgroundColor: '#fff',
      padding: 8,
      borderRadius: 8,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      elevation: 4,
      zIndex: 10,
  },
  tooltipValue: { fontSize: 18, fontWeight: 'bold' },
  tooltipLabel: { fontSize: 10, color: '#999' },
  tooltipArrow: {
      position: 'absolute',
      bottom: -6,
      width: 0, 
      height: 0, 
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderTopWidth: 6,
      borderStyle: 'solid',
      backgroundColor: 'transparent',
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: '#fff',
  },

  statsGrid: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      gap: 16,
      marginBottom: 16,
  },
  statBox: {
      flex: 1,
      backgroundColor: '#fff',
      borderRadius: 8,
      padding: 12,
      minHeight: 100,
  },
  statTitle: {
      fontSize: 12,
      color: '#670FA4',
  },
  statUnderline: {
      width: 20,
      height: 1,
      backgroundColor: '#670FA4',
      marginTop: 4,
      marginBottom: 8,
  },
  statDesc: {
      fontSize: 12,
      color: '#333',
      lineHeight: 18,
  },
  statValue: {
      fontSize: 14,
      color: '#333',
      fontWeight: '500',
  },
  statSubValue: {
      fontSize: 10,
      color: '#666',
      marginTop: 2,
  },
  trendList: {
      marginTop: 4,
  },
  trendItem: {
      fontSize: 10,
      color: '#333',
      marginBottom: 2,
  },
  progressionText: {
      fontSize: 12,
      color: '#333',
      textAlign: 'right',
  },

  donutOverlay: {
      position: 'absolute',
      top: 520, // Approximate vertical position based on layout
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 20,
  },
  donutCircle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#670FA4', // Gradient in real app
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 4,
      borderColor: '#fff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      elevation: 5,
  },
  donutText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 14,
  },
});

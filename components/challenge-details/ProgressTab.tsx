import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Pressable, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line, Text as SvgText, G, Rect } from 'react-native-svg';

const { width } = Dimensions.get('window');

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Mock Data
const INITIAL_DAYS = [
  { day: 'Lun', date: '23', month: 'avril', year: '2019', active: false },
  { day: 'Mar', date: '24', month: 'avril', year: '2019', active: false },
  { day: 'Mer', date: '25', month: 'avril', year: '2019', active: true },
  { day: 'Jeu', date: '26', month: 'avril', year: '2019', active: false },
  { day: 'Ven', date: '27', month: 'avril', year: '2019', active: false },
  { day: 'Sam', date: '28', month: 'avril', year: '2019', active: false },
  { day: 'Dim', date: '29', month: 'avril', year: '2019', active: false },
];

const READING_TRENDS = [
  { label: 'Lu', value: 0 },
  { label: 'Ma', value: 0 },
  { label: 'Me', value: 3 }, // Active day
  { label: 'Je', value: 0 },
  { label: 'Ve', value: 0 },
  { label: 'Sa', value: 0 },
  { label: 'Di', value: 0 },
  // Second row (evening/other times)
  { label: 'Lu', value: 2, type: 'secondary' },
  { label: 'Ma', value: 2, type: 'secondary' },
  { label: 'Me', value: 0, type: 'secondary' },
  { label: 'Je', value: 2, type: 'secondary' },
  { label: 'Ve', value: 2, type: 'secondary' },
  { label: 'Sa', value: 0, type: 'secondary' }, // mixed
  { label: 'Di', value: 0, type: 'secondary' },
];

export default function ProgressTab() {
  const [days, setDays] = useState(INITIAL_DAYS);
  const [trendViewMode, setTrendViewMode] = useState<'grid' | 'chart'>('grid');

  const handleDayPress = (index: number) => {
    const newDays = days.map((day, i) => ({
      ...day,
      active: i === index
    }));
    setDays(newDays);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* Calendar Strip */}
      <View style={styles.calendarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendarScroll}>
          {days.map((item, index) => (
            <Pressable 
              key={index} 
              style={[styles.dayCard, item.active && styles.activeDayCard]}
              onPress={() => handleDayPress(index)}
            >
              {item.active && (
                <View style={styles.activeTag}>
                  <Text style={styles.activeTagText}>Jour {9 + (index - 2)}</Text>
                </View>
              )}
              <Text style={[styles.dayText, item.active && styles.activeText]}>{item.day}</Text>
              <Text style={[styles.dateText, item.active && styles.activeText]}>{item.date}</Text>
              <Text style={[styles.monthText, item.active && styles.activeText]}>{item.month}</Text>
              <Text style={[styles.yearText, item.active && styles.activeText]}>{item.year}</Text>
              {item.active && <View style={styles.triangle} />}
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Encouragement Card */}
      <View style={styles.encouragementCard}>
        <View style={styles.purpleBar} />
        <Text style={styles.encouragementText}>
          Vous êtes en avance de 1 hizbs, continuez comme ça.
        </Text>
        <Ionicons name="thumbs-up-outline" size={24} color="#670FA4" />
      </View>

      {/* Daily Task Card */}
      <View style={styles.taskCard}>
        <View style={styles.orangeBar} />
        <View style={styles.taskContent}>
            <Text style={styles.taskText}>
            Lire sourate <Text style={styles.bold}>Al-Araf</Text> <Text style={styles.orangeText}>Verset 88</Text> à Sourate <Text style={styles.bold}>Al-Anfal</Text> <Text style={styles.orangeText}>Verset 40</Text>
            </Text>
        </View>
        <View style={styles.programTag}>
            <Text style={styles.programTagText}>Programme du 9è jour</Text>
        </View>
      </View>

      {/* Objective Section */}
      <View style={styles.objectiveContainer}>
        <Text style={styles.objectiveTitle}>Objectif</Text>
        <Text style={styles.objectiveDesc}>Lire intégralement le noble livre en 30 jours.</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
            <Text style={styles.statLabel}>Journalier</Text>
            <Text style={styles.statValue}>2</Text>
            <Text style={styles.statUnit}>Hizb</Text>
        </View>

        {/* Center Progress Circle (Mocked visual) */}
        <View style={styles.centerProgress}>
            <LinearGradientCircle />
        </View>

        <View style={styles.statItem}>
            <Text style={styles.statLabel}>hebdomadaire</Text>
            <Text style={styles.statValue}>14</Text>
            <Text style={styles.statUnit}>Hizb</Text>
        </View>
      </View>

      {/* Line Chart Section */}
      <View style={styles.chartSection}>
         <ProgressLineChart />
      </View>

      {/* Donut Chart Section */}
      <View style={styles.donutSection}>
         <View style={{flex: 1, alignItems: 'center'}}>
             <DonutChart />
         </View>
         <View style={{flex: 1.5, paddingLeft: 16}}>
             <Text style={styles.donutTitle}>Durée de la lecture</Text>
             <Text style={styles.donutDesc}>
                 Vous avez gagné 20% sur votre temps de lecture.
             </Text>
             <View style={styles.timeRow}>
                 <Text style={styles.timeLabel}>Jour 8 : </Text>
                 <Text style={styles.timeValue}>2 heures 30 min</Text>
             </View>
             <View style={styles.timeRow}>
                 <Text style={styles.timeLabel}>Jour 9 : </Text>
                 <Text style={styles.timeValue}>2 heures 12 min</Text>
             </View>
         </View>
      </View>

      {/* Reading Trends (Heatmap style) */}
      <View style={styles.trendsSection}>
         <View style={styles.trendsHeader}>
             <Text style={styles.trendsTitle}>Tendance de lecture</Text>
             <View style={styles.trendsIcons}>
                 <Pressable onPress={() => setTrendViewMode('grid')}>
                    <Ionicons name="grid" size={20} color={trendViewMode === 'grid' ? "#670FA4" : "#ccc"} />
                 </Pressable>
                 <Pressable onPress={() => setTrendViewMode('chart')} style={{marginLeft: 10}}>
                    <Ionicons name="stats-chart" size={20} color={trendViewMode === 'chart' ? "#670FA4" : "#ccc"} />
                 </Pressable>
             </View>
         </View>
         <View style={styles.separator} />
         
         {trendViewMode === 'grid' ? <ReadingTrendsGrid /> : <ReadingTrendsChart />}
      </View>

      <View style={{height: 40}} />
    </ScrollView>
  );
}

// Sub-components for Charts

const LinearGradientCircle = () => (
    <View style={styles.circleContainer}>
        <View style={styles.circle}>
            <Text style={styles.circleText}>24%</Text>
        </View>
    </View>
);

const ProgressLineChart = () => {
    const animation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(animation, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false, // SVG props cannot use native driver
            easing: Easing.out(Easing.cubic),
        }).start();
    }, []);

    const goldX2 = animation.interpolate({ inputRange: [0, 1], outputRange: [20, 300] });
    const goldY2 = animation.interpolate({ inputRange: [0, 1], outputRange: [140, 20] });
    
    const purpleX2 = animation.interpolate({ inputRange: [0, 1], outputRange: [20, 100] });
    const purpleY2 = animation.interpolate({ inputRange: [0, 1], outputRange: [140, 90] });
    
    // For tooltip opacity
    const tooltipOpacity = animation.interpolate({ inputRange: [0.7, 1], outputRange: [0, 1] });
    const tooltipScale = animation.interpolate({ inputRange: [0.7, 1], outputRange: [0.5, 1] });

    return (
        <View style={{ height: 180, width: '100%', marginTop: 20 }}>
            {/* Legend */}
            <Animated.View style={[styles.chartTooltip, { opacity: tooltipOpacity, transform: [{ scale: tooltipScale }] }]}>
                 <Text style={styles.tooltipTitle}>+1</Text>
                 <Text style={styles.tooltipSub}>Hizb</Text>
            </Animated.View>
            
            <Svg height="100%" width="100%" viewBox="0 0 300 150">
                 {/* Grid Lines */}
                 <Line x1="0" y1="30" x2="300" y2="30" stroke="#f0f0f0" strokeWidth="1" />
                 <Line x1="0" y1="60" x2="300" y2="60" stroke="#f0f0f0" strokeWidth="1" />
                 <Line x1="0" y1="90" x2="300" y2="90" stroke="#f0f0f0" strokeWidth="1" />
                 <Line x1="0" y1="120" x2="300" y2="120" stroke="#f0f0f0" strokeWidth="1" />
                 
                 {/* Y Axis Labels */}
                 <SvgText x="0" y="30" fontSize="10" fill="#ccc">12</SvgText>
                 <SvgText x="0" y="60" fontSize="10" fill="#ccc">10</SvgText>
                 <SvgText x="0" y="90" fontSize="10" fill="#ccc">08</SvgText>
                 <SvgText x="0" y="120" fontSize="10" fill="#ccc">06</SvgText>

                 {/* Trend Line (Gold) */}
                 <AnimatedLine x1="20" y1="140" x2={goldX2} y2={goldY2} stroke="#D4A84A" strokeWidth="1" />

                 {/* Progress Line (Purple) */}
                 <AnimatedLine x1="20" y1="140" x2={purpleX2} y2={purpleY2} stroke="#670FA4" strokeWidth="2" />
                 <AnimatedCircle cx={purpleX2} cy={purpleY2} r="3" stroke="#670FA4" strokeWidth="2" fill="#fff" />
            </Svg>

            <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#670FA4' }]} />
                    <Text style={styles.legendText}>Ma progression</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#D4A84A' }]} />
                    <Text style={styles.legendText}>Rhytme de lecture</Text>
                </View>
            </View>
        </View>
    );
};

const DonutChart = () => {
    return (
        <View style={{ width: 120, height: 120, justifyContent: 'center', alignItems: 'center' }}>
            <Svg height="120" width="120" viewBox="0 0 120 120">
                <Circle cx="60" cy="60" r="50" stroke="#670FA4" strokeWidth="15" fill="none" />
                <Circle cx="60" cy="60" r="50" stroke="#D4A84A" strokeWidth="15" fill="none" strokeDasharray="80 240" strokeLinecap="round" rotation="-90" origin="60, 60"/>
            </Svg>
            <View style={{ position: 'absolute' }}>
                <Text style={{ fontSize: 18, color: '#D4A84A', fontWeight: 'bold' }}>-18min</Text>
            </View>
        </View>
    );
};

const ReadingTrendsChart = ({ data }: { data: DailyLog[] }) => {
    // Process real data or fallback to mock
    // If no real data, we show empty or mock
    const chartData = data.length > 0 ? data.map(d => d.durationSeconds / 3600) : [0, 0, 0, 0, 0, 0, 0];
    
    // Fill up to 7 days if needed
    while (chartData.length < 7) {
        chartData.unshift(0);
    }
    
    // Last 7 days labels
    const days = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']; // Fixed for now, ideally dynamic
    const maxVal = Math.max(...chartData, 1); // Avoid div by zero
    const chartHeight = 150;
    const barWidth = 20;
    const spacing = 30; // space between bars centers
    const startX = 20;

    return (
        <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
            <Svg height="180" width="100%" viewBox="0 0 320 180">
                {/* Y Axis Grid Lines */}
                {[0, 2, 4, 6].map((val, i) => {
                    const y = 150 - (val / (Math.max(6, maxVal))) * 120; // Scale to max 6 hours or data max
                    return (
                        <G key={i}>
                            <Line x1="30" y1={y} x2="300" y2={y} stroke="#f0f0f0" strokeWidth="1" />
                            <SvgText x="15" y={y + 4} fontSize="10" fill="#ccc" textAnchor="middle">{val}h</SvgText>
                        </G>
                    );
                })}

                {/* Bars */}
                {chartData.map((value, index) => {
                    const x = startX + index * 40 + 30;
                    const barHeight = (value / (Math.max(6, maxVal))) * 120;
                    const y = 150 - barHeight;
                    
                    return (
                        <G key={index}>
                            <Rect
                                x={x - barWidth / 2}
                                y={y}
                                width={barWidth}
                                height={barHeight}
                                fill="#D4A84A"
                                rx="4"
                            />
                            <SvgText
                                x={x}
                                y="170"
                                fontSize="10"
                                fill="#ccc"
                                textAnchor="middle"
                            >
                                {days[index]}
                            </SvgText>
                        </G>
                    );
                })}
            </Svg>
        </View>
    );
};

const ReadingTrendsGrid = () => {
    // 24 hours vertical, 7 days horizontal
    // Simplified representation of the grid in the image
    const hours = ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22'];
    const days = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];
    
    // Mock active blocks [dayIndex, hourIndex]
    const activeBlocks = [
        [0, 5], [0, 10], // Lu: 04-06, 20-22 (indexes approx)
        [1, 5], [1, 10],
        [2, 11], // Me: Late night
        [3, 6], [3, 7], [3, 10], // Je
        [4, 5], [4, 10], // Ve
        [5, 7], [5, 8], // Sa
        [6, 5], // Di
    ];

    const [selectedCell, setSelectedCell] = useState<{d: number, h: number} | null>(null);

    const handleCellPress = (dIndex: number, hIndex: number) => {
        if (selectedCell?.d === dIndex && selectedCell?.h === hIndex) {
            setSelectedCell(null);
        } else {
            setSelectedCell({d: dIndex, h: hIndex});
        }
    };

    return (
        <View style={styles.gridContainer}>
            {/* Y Axis */}
            <View style={styles.gridYAxis}>
                {hours.map((h, i) => (
                    <Text key={i} style={styles.gridLabel}>{h}</Text>
                ))}
            </View>
            
            {/* Grid Content */}
            <View style={styles.gridContent}>
                {days.map((d, dIndex) => (
                    <View key={dIndex} style={styles.gridColumn}>
                        {hours.map((_, hIndex) => {
                            const isActive = activeBlocks.some(([ad, ah]) => ad === dIndex && ah === hIndex);
                            const isSelected = selectedCell?.d === dIndex && selectedCell?.h === hIndex;
                            
                            return (
                                <Pressable 
                                    key={hIndex} 
                                    style={[
                                        styles.gridCell, 
                                        isActive && styles.activeGridCell,
                                        isSelected && styles.selectedGridCell
                                    ]}
                                    onPress={() => handleCellPress(dIndex, hIndex)}
                                />
                            );
                        })}
                         <Text style={[styles.gridLabel, { marginTop: 8 }]}>{d}</Text>
                    </View>
                ))}
            </View>
            
            {selectedCell && (
                 <View style={styles.gridTooltip}>
                     <Text style={styles.gridTooltipText}>
                         {days[selectedCell.d]} à {hours[selectedCell.h]}h: {activeBlocks.some(([ad, ah]) => ad === selectedCell.d && ah === selectedCell.h) ? 'Lecture active' : 'Aucune lecture'}
                     </Text>
                 </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  calendarContainer: {
    marginBottom: 20,
    paddingLeft: 10,
  },
  calendarScroll: {
    paddingRight: 20,
    alignItems: 'center', // Center vertically within the scroll content height
  },
  dayCard: {
    width: 60,
    height: 90,
    backgroundColor: '#fff', // Or faint purple
    borderRadius: 8,
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 10, // space for "Jour X" tag
  },
  activeDayCard: {
    backgroundColor: '#fff',
    height: 100, // Slightly taller
    shadowOpacity: 0.15,
    zIndex: 10,
    transform: [{ scale: 1.05 }],
  },
  activeTag: {
    position: 'absolute',
    top: -12,
    backgroundColor: '#670FA4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeTagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dayText: { fontSize: 10, color: '#ccc', marginBottom: 2 },
  dateText: { fontSize: 18, color: '#ccc', fontWeight: 'bold' },
  monthText: { fontSize: 10, color: '#ccc' },
  yearText: { fontSize: 8, color: '#ccc' },
  activeText: { color: '#000' },
  triangle: {
    position: 'absolute',
    bottom: -8,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#D4A84A', // Gold triangle
    transform: [{ rotate: '180deg' }]
  },

  encouragementCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  purpleBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#670FA4',
  },
  encouragementText: {
    flex: 1,
    fontSize: 12,
    color: '#333',
    marginRight: 10,
    paddingLeft: 8,
  },

  taskCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  orangeBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#D4A84A', // Orange/Gold
  },
  taskContent: {
    alignItems: 'center',
  },
  taskText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#333',
    lineHeight: 22,
  },
  bold: { fontWeight: 'bold' },
  orangeText: { color: '#D4A84A' },
  programTag: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#F3E5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopLeftRadius: 8,
  },
  programTagText: {
    fontSize: 10,
    color: '#670FA4',
  },

  objectiveContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  objectiveTitle: {
    fontSize: 14,
    color: '#670FA4',
    marginBottom: 8,
  },
  objectiveDesc: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    width: 80,
  },
  statLabel: {
    fontSize: 12,
    color: '#670FA4',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '300',
    color: '#333',
  },
  statUnit: {
    fontSize: 12,
    color: '#999',
  },
  centerProgress: {
      marginBottom: 20,
  },
  circleContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#670FA4',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#670FA4',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
  },
  circle: {
      width: 50,
      height: 50,
      borderRadius: 25,
      borderWidth: 2,
      borderColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
  },
  circleText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 14,
  },

  chartSection: {
      paddingHorizontal: 16,
      marginBottom: 30,
  },
  chartTooltip: {
      position: 'absolute',
      left: 80,
      top: 50,
      backgroundColor: '#fff',
      padding: 8,
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      elevation: 3,
      alignItems: 'center',
      zIndex: 10,
  },
  tooltipTitle: { fontWeight: 'bold', fontSize: 16 },
  tooltipSub: { fontSize: 10, color: '#999' },
  legendContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 10,
  },
  legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  legendDot: {
      width: 20,
      height: 4,
      borderRadius: 2,
      marginRight: 8,
  },
  legendText: {
      fontSize: 12,
      color: '#666',
  },

  donutSection: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      marginBottom: 30,
  },
  donutTitle: {
      fontSize: 14,
      color: '#670FA4',
      marginBottom: 8,
      textDecorationLine: 'underline',
  },
  donutDesc: {
      fontSize: 12,
      color: '#666',
      marginBottom: 16,
  },
  timeRow: {
      flexDirection: 'row',
      marginBottom: 4,
  },
  timeLabel: {
      fontSize: 12,
      color: '#D4A84A',
  },
  timeValue: {
      fontSize: 12,
      color: '#333',
  },

  trendsSection: {
      paddingHorizontal: 16,
      marginBottom: 20,
  },
  trendsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
  },
  trendsTitle: {
      fontSize: 14,
      color: '#670FA4',
  },
  trendsIcons: {
      flexDirection: 'row',
  },
  separator: {
      height: 1,
      backgroundColor: '#670FA4',
      marginBottom: 16,
  },
  gridContainer: {
      flexDirection: 'row',
  },
  gridYAxis: {
      width: 30,
      justifyContent: 'space-between',
      paddingBottom: 24, // Space for X axis labels
  },
  gridLabel: {
      fontSize: 10,
      color: '#ccc',
      textAlign: 'center',
  },
  gridContent: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
  },
  gridColumn: {
      flex: 1,
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  gridCell: {
      width: '80%',
      aspectRatio: 1, // square
      backgroundColor: '#f9f9f9',
      marginBottom: 2,
  },
  activeGridCell: {
    backgroundColor: '#D4A84A', // Active color
  },
  selectedGridCell: {
    backgroundColor: '#670FA4', // Selection color (purple)
    borderWidth: 2,
    borderColor: '#D4A84A',
  },
  gridTooltip: {
    position: 'absolute',
    bottom: -40,
    left: 0,
    right: 0,
    backgroundColor: '#333',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    zIndex: 20,
  },
  gridTooltipText: {
    color: '#fff',
    fontSize: 12,
  },
});

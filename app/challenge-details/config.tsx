import { Colors } from '@/config/colors';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { challengeDetailsService } from '@/services/challengeDetailsService';
import { useAppSelector } from '@/store/hooks';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChallengeConfigScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const fontBold = getFont(currentLanguage, 'bold');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontRegular = getFont(currentLanguage, 'regular');

  const levelId = useMemo(() => {
    const raw = (params as any)?.levelId ?? (params as any)?.id;
    return typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';
  }, [params]);

  const challengeSlug = useMemo(() => {
    const raw = (params as any)?.challengeSlug ?? (params as any)?.challengeId;
    return typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';
  }, [params]);

  // State
  const [daysCount, setDaysCount] = useState(9);
  const [exercisesCount, setExercisesCount] = useState(2);
  const [duration, setDuration] = useState(5);
  // Default selected days: none
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  
  const [notifications, setNotifications] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [arabic, setArabic] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        if (!levelId) return;

        const settings = await challengeDetailsService.getSettingsForLevel(levelId);
        if (!isActive) return;

        setDaysCount(settings.daysCount);
        setExercisesCount(settings.exercisesCount);
        setDuration(settings.durationMinutes);
        setSelectedDays(settings.selectedDays);
        setNotifications(settings.notifications);
        setReminders(settings.reminders);
        setArabic(settings.arabic);
      } catch (error) {
        console.error('Failed to load challenge settings:', error);
        if (!isActive) return;
        setLoadError('Unable to load settings');
      } finally {
        if (!isActive) return;
        setIsLoading(false);
      }
    };

    load();

    return () => {
      isActive = false;
    };
  }, [levelId]);

  // Helper for counters
  const Counter = ({ value, setValue, min = 1 }: any) => (
    <View style={styles.counterContainer}>
      <TouchableOpacity 
        style={styles.counterBtn} 
        onPress={() => setValue(Math.max(min, value - 1))}
      >
        <Text style={styles.counterBtnText}>-</Text>
      </TouchableOpacity>
      <Text style={[styles.counterValue, { fontFamily: fontBold }]}>{value}</Text>
      <TouchableOpacity 
        style={styles.counterBtn} 
        onPress={() => setValue(value + 1)}
      >
         <Text style={styles.counterBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );

  const handleStart = () => {
    (async () => {
      try {
        if (!levelId) return;
        setIsSaving(true);

        const level = await challengeDetailsService.getLevelById(levelId);
        if (!level) throw new Error('Level not found');

        await challengeDetailsService.saveSettingsForLevel({
          levelId,
          categoryId: level.categoryId,
          settings: {
            daysCount,
            exercisesCount,
            durationMinutes: duration,
            selectedDays,
            notifications,
            reminders,
            arabic,
          },
        });

        router.push({
          pathname: '/challenge-details/level/[id]',
          params: { id: levelId, challengeSlug },
        });
      } catch (error) {
        console.error('Failed to start challenge:', error);
      } finally {
        setIsSaving(false);
      }
    })();
  };

  const DAYS = [
    { key: 'L', label: 'L', full: 'Lundi' },
    { key: 'Ma', label: 'M', full: 'Mardi' },
    { key: 'Me', label: 'M', full: 'Mercredi' },
    { key: 'J', label: 'J', full: 'Jeudi' },
    { key: 'V', label: 'V', full: 'Vendredi' },
    { key: 'S', label: 'S', full: 'Samedi' },
    { key: 'D', label: 'D', full: 'Dimanche' },
  ];

  const toggleDay = (key: string) => {
    if (selectedDays.includes(key)) {
        setSelectedDays(selectedDays.filter(k => k !== key));
    } else {
        setSelectedDays([...selectedDays, key]);
    }
  };

  const getSelectedDaysString = () => {
    // Sort based on DAYS order to ensure consistent checking
    const sorted = DAYS.filter(d => selectedDays.includes(d.key));
    
    if (sorted.length === DAYS.length) return 'Tous les jours';
    if (sorted.length === 0) return 'Aucun jour';
    
    return sorted.map(d => d.full).join(', ');
  };

  return (
     <LinearGradient
        colors={[Colors.palette.purple.primary, '#E6B980', '#FDFBF7']}
        locations={[0, 0.6, 1]}
        style={[styles.container, { paddingTop: insets.top + 20 }]}
     >
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />
        {/* Header - Config Title */}
        <View style={styles.header}>
            <View style={{ flex: 1 }} />
            <Text style={[styles.title, { fontFamily: fontBold }]}>Quelques petits réglages</Text>
            <Pressable onPress={() => router.back()} style={styles.closeButton}>
                <Ionicons name="information-circle" size={24} color="rgba(255,255,255,0.3)" />
            </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {isLoading ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#FFF" />
                </View>
              ) : loadError ? (
                <View style={{ paddingVertical: 24 }}>
                  <Text style={[styles.label, { fontFamily: fontBold }]}>{loadError}</Text>
                </View>
              ) : null}

              {/* Days Count */}
              <View style={styles.row}>
                 <Text style={[styles.label, { fontFamily: fontMedium }]}>Sur combien de jour ?</Text>
                 <Counter value={daysCount} setValue={setDaysCount} />
              </View>
              <View style={styles.divider} />



              {/* Days Selector */}
              <View style={styles.daysContainer}>
                  <View style={styles.daysRow}>
                    {DAYS.map((day) => {
                        const isSelected = selectedDays.includes(day.key);
                        return (
                            <TouchableOpacity 
                                key={day.key} 
                                style={[
                                    styles.dayCircle, 
                                    { 
                                        backgroundColor: isSelected ? '#FFF' : 'rgba(255,255,255,0.1)',
                                        borderWidth: isSelected ? 0 : 1,
                                        borderColor: 'rgba(255,255,255,0.5)'
                                    }
                                ]} 
                                onPress={() => toggleDay(day.key)}
                            >
                                <Text style={[
                                    styles.dayText, 
                                    { 
                                        fontFamily: fontBold, 
                                        color: isSelected ? Colors.palette.purple.primary : '#FFF' 
                                    }
                                ]}>
                                    {day.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                  </View>
                 <Text style={[styles.daysLabel, { fontFamily: fontMedium, color: '#FFF' }]}>{getSelectedDaysString()}</Text>
              </View>
               <View style={styles.divider} />

               {/* Exercises Count */}
               <View style={styles.row}>
                 <Text style={[styles.label, { fontFamily: fontMedium }]}>Nombre d'exercice quotidien ?</Text>
                 <Counter value={exercisesCount} setValue={setExercisesCount} />
              </View>
              <View style={styles.divider} />

               {/* Duration */}
               <View style={styles.row}>
                 <Text style={[styles.label, { fontFamily: fontMedium }]}>Durée des exercices (en minute) ?</Text>
                 <Counter value={duration} setValue={setDuration} />
              </View>
              <View style={styles.divider} />

               {/* Toggles */}
                <View style={[styles.row, { alignItems: 'center' }]}>
                   <View style={{ flex: 1 }}>
                      <Text style={[styles.label, { fontFamily: fontBold }]}>Notification</Text>
                      <Text style={[styles.subLabel, { fontFamily: fontRegular }]}>Pastilles, Alarme, Bannière, Vibreur</Text>
                   </View>
                   <Switch 
                      value={notifications} 
                      onValueChange={setNotifications} 
                      trackColor={{ false: "#767577", true: "#FFD580" }}
                      thumbColor={notifications ? "#FFF" : "#f4f3f4"}
                   />
                </View>
                <View style={styles.divider} />
                
                <View style={[styles.row, { alignItems: 'center' }]}>
                   <View style={{ flex: 1 }}>
                      <Text style={[styles.label, { fontFamily: fontBold }]}>Rappel</Text>
                      <Text style={[styles.subLabel, { fontFamily: fontRegular }]}>Toutes les 5 minutes</Text>
                   </View>
                   <Switch 
                      value={reminders} 
                      onValueChange={setReminders} 
                      trackColor={{ false: "#767577", true: "#FFD580" }}
                      thumbColor={reminders ? "#FFF" : "#f4f3f4"}
                   />
                </View>
                <View style={styles.divider} />

                <View style={[styles.row, { alignItems: 'center' }]}>
                   <View style={{ flex: 1 }}>
                      <Text style={[styles.label, { fontFamily: fontBold }]}>Langue Arabe</Text>
                      <Text style={[styles.subLabel, { fontFamily: fontRegular }]}>Activé</Text>
                   </View>
                   <Switch 
                      value={arabic} 
                      onValueChange={setArabic} 
                      trackColor={{ false: "#767577", true: "#FFD580" }}
                      thumbColor={arabic ? "#FFF" : "#f4f3f4"}
                   />
                </View>
                <View style={[styles.divider, { marginBottom: 30 }]} />

           </ScrollView>

           <View style={{ padding: 20, alignItems: 'center', paddingBottom: insets.bottom + 20 }}>
               <TouchableOpacity style={[styles.startButton, isSaving && { opacity: 0.7 }]} onPress={handleStart} disabled={isSaving}>
                  <LinearGradient
                     colors={[Colors.palette.purple.primary, Colors.palette.purple.light]}
                     style={styles.startButtonGradient}
                     start={{ x: 0, y: 0 }}
                     end={{ x: 1, y: 0 }}
                  >
                     <Text style={[styles.startButtonText, { fontFamily: fontBold }]}>{isSaving ? '...' : 'Bismillah'}</Text>
                  </LinearGradient>
               </TouchableOpacity>
           </View>
     </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      marginBottom: 30,
  },
  closeButton: {
      flex: 1,
      alignItems: 'flex-end',
  },
  title: {
      fontSize: 18,
      color: '#FFF',
      textAlign: 'center',
      textDecorationLine: 'underline',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
      paddingHorizontal: 24,
  },
  row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
  },
  label: {
      color: '#FFF',
      fontSize: 16,
  },
  subLabel: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 12,
  },
  counterContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
  },
  counterBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#FFF',
      alignItems: 'center',
      justifyContent: 'center',
  },
  counterBtnText: {
      fontSize: 20,
      color: Colors.palette.purple.primary,
      fontWeight: 'bold',
      marginTop: -2,
  },
  counterValue: {
      fontSize: 18,
      color: '#FFF',
      width: 24,
      textAlign: 'center',
  },
  divider: {
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.2)',
      width: '100%',
  },
  dateDisplay: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
  },
  dateText: {
      color: Colors.palette.gold.primary,
      fontSize: 14,
  },
  daysContainer: {
      paddingVertical: 20,
      alignItems: 'center',
      gap: 12,
  },
  daysRow: {
      flexDirection: 'row',
      gap: 12,
  },
  dayCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
  },
  dayText: {
      fontSize: 16,
  },
  daysLabel: {
      color: Colors.palette.purple.primary, // Using purple as it seems readable on this background
      fontSize: 14,
      opacity: 0.8,
  },
  timeSlotRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
  },
  timeLabelContainer: {
      width: '30%',
  },
  dayName: {
      fontSize: 24,
      color: '#FFF',
  },
  timeValues: {
     alignItems: 'flex-end',
     gap: 4,
  },
  timeText: {
      fontSize: 32,
      color: '#FFF',
  },
  timeDivider: {
      width: 1,
      height: 10, // Not matching image exactly but simulates the separation
  },
  startButton: {
      width: '60%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
  },
  startButtonGradient: {
      paddingVertical: 16,
      borderRadius: 30,
      alignItems: 'center',
  },
  startButtonText: {
      color: '#FFF',
      fontSize: 18,
  },
});

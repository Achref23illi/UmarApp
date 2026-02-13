import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  
  // Mock state for toggles
  const [settings, setSettings] = useState({
      prayerTimes: true,
      adhan: true,
      janaza: true,
      likes: true,
      comments: true,
      updates: false,
  });

  const toggleSwitch = (key: keyof typeof settings) => {
      setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const NotificationItem = ({ label, description, value, onValueChange }: any) => (
      <View style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.itemTextContainer}>
              <Text style={[styles.itemLabel, { color: colors.text.primary }]}>{label}</Text>
              {description && (
                  <Text style={[styles.itemDescription, { color: colors.text.secondary }]}>{description}</Text>
              )}
          </View>
          <Switch
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={'#FFF'}
            ios_backgroundColor={colors.border}
            onValueChange={onValueChange}
            value={value}
          />
      </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text.primary }]}>Notifications</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Prières et Adhan</Text>
            <NotificationItem 
                label="Rappels de prière" 
                description="Recevoir une notification avant chaque prière"
                value={settings.prayerTimes}
                onValueChange={() => toggleSwitch('prayerTimes')}
            />
            <NotificationItem 
                label="Adhan sonore" 
                description="Jouer l'Adhan complet pour les notifications"
                value={settings.adhan}
                onValueChange={() => toggleSwitch('adhan')}
            />
        </View>

        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Communauté</Text>
            <NotificationItem 
                label="Alertes Janaza" 
                description="Être notifié des nouvelles prières funéraires"
                value={settings.janaza}
                onValueChange={() => toggleSwitch('janaza')}
            />
            <NotificationItem 
                label="J'aime" 
                value={settings.likes}
                onValueChange={() => toggleSwitch('likes')}
            />
             <NotificationItem 
                label="Commentaires" 
                value={settings.comments}
                onValueChange={() => toggleSwitch('comments')}
            />
        </View>

        <View style={styles.section}>
             <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Application</Text>
             <NotificationItem 
                label="Mises à jour et nouveautés" 
                value={settings.updates}
                onValueChange={() => toggleSwitch('updates')}
            />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 24,
    gap: 32,
  },
  section: {
      gap: 12,
  },
  sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      textTransform: 'uppercase',
      marginBottom: 4,
  },
  item: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
  },
  itemTextContainer: {
      flex: 1,
      paddingRight: 16,
  },
  itemLabel: {
      fontSize: 16,
      fontWeight: '500',
  },
  itemDescription: {
      fontSize: 13,
      marginTop: 4,
  }
});

/**
 * Quiz Invite Contacts Screen
 * ============================
 * Users can invite contacts to participate in a quiz
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QuizBottomNav } from '@/components/quiz/QuizBottomNav';
import { QuizHeader } from '@/components/quiz/QuizHeader';
import { getFont } from '@/hooks/use-fonts';
import { useAppSelector } from '@/store/hooks';

// Mock contact data
interface Contact {
  id: string;
  name: string;
  avatar?: string;
  lastConnection: string;
}

const RECENT_CONTACTS: Contact[] = [
  { id: '1', name: 'Mounir B.', lastConnection: '16 septembre 2019' },
  { id: '2', name: 'Mounir B.', lastConnection: '16 septembre 2019' },
  { id: '3', name: 'Mounir B.', lastConnection: '16 septembre 2019' },
  { id: '4', name: 'Mounir B.', lastConnection: '16 septembre 2019' },
];

const ALL_CONTACTS: Contact[] = [
  { id: '5', name: 'Mounir Benacer', lastConnection: '16 septembre 2019' },
  { id: '6', name: 'Mounir Benacer', lastConnection: '16 septembre 2019' },
  { id: '7', name: 'Mounir Benacer', lastConnection: '16 septembre 2019' },
  { id: '8', name: 'Mounir Benacer', lastConnection: '16 septembre 2019' },
  { id: '9', name: 'Mounir Benacer', lastConnection: '16 septembre 2019' },
  { id: '10', name: 'Mounir Benacer', lastConnection: '16 septembre 2019' },
];

export default function InviteContactsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);

  const fontBold = getFont(currentLanguage, 'bold');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontRegular = getFont(currentLanguage, 'regular');

  const [selectedRecentContacts, setSelectedRecentContacts] = useState<Set<string>>(new Set());
  const [invitedContacts, setInvitedContacts] = useState<Set<string>>(new Set());

  const toggleRecentContact = (id: string) => {
    const newSelected = new Set(selectedRecentContacts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRecentContacts(newSelected);
  };

  const toggleInvite = (id: string) => {
    const newInvited = new Set(invitedContacts);
    if (newInvited.has(id)) {
      newInvited.delete(id);
    } else {
      newInvited.add(id);
    }
    setInvitedContacts(newInvited);
  };

  const handleNext = () => {
    // Navigate to level/theme selection with selected contacts
    const totalSelected = selectedRecentContacts.size + invitedContacts.size;
    router.push({
      pathname: '/quiz/setup-game',
      params: { participantCount: totalSelected.toString() }
    });
  };

  return (
    <View style={styles.container}>
      {/* Background Pattern */}
      <Image
        source={require('@/assets/images/quizz_background.png')}
        style={styles.backgroundImage}
        contentFit="cover"
      />

      {/* Header */}
      <QuizHeader />

      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Add Button and Participants */}
        <View style={styles.topSection}>
          <Pressable
            style={styles.addButton}
            onPress={() => router.push('/quiz/add-participants')}
          >
            <Text style={[styles.addButtonText, { fontFamily: fontMedium }]}>
              Ajouter
            </Text>
          </Pressable>
          
          <View style={styles.participantsInfo}>
            <Text style={[styles.participantsText, { fontFamily: fontRegular }]}>
              Participants :
            </Text>
            <Text style={styles.participantsEmoji}>😊</Text>
          </View>
        </View>

        {/* Recent Contacts Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: fontRegular }]}>
            Contact recent :
          </Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.recentContactsScroll}
            contentContainerStyle={styles.recentContactsContainer}
          >
            {RECENT_CONTACTS.map((contact, index) => (
              <Animated.View
                key={contact.id}
                entering={FadeInDown.delay(index * 50).springify()}
              >
                <Pressable
                  style={styles.recentContactCard}
                  onPress={() => toggleRecentContact(contact.id)}
                >
                  {/* Checkbox */}
                  <View style={styles.checkboxContainer}>
                    <View style={[
                      styles.checkbox,
                      selectedRecentContacts.has(contact.id) && styles.checkboxSelected
                    ]}>
                      {selectedRecentContacts.has(contact.id) && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </View>
                  </View>
                  
                  {/* Avatar */}
                  <View style={styles.avatarCircle}>
                    <Ionicons name="person" size={32} color="#D1D5DB" />
                  </View>
                  
                  {/* Name */}
                  <Text style={[styles.recentContactName, { fontFamily: fontRegular }]}>
                    {contact.name}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </ScrollView>
        </View>

        {/* All Contacts Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: fontRegular }]}>
            Contact
          </Text>
          
          <View style={styles.contactsList}>
            {ALL_CONTACTS.map((contact, index) => (
              <Animated.View
                key={contact.id}
                entering={FadeInDown.delay(index * 30).springify()}
              >
                <View style={styles.contactCard}>
                  {/* Avatar */}
                  <View style={styles.contactAvatar}>
                    <Ionicons name="person" size={32} color="#D1D5DB" />
                  </View>
                  
                  {/* Info */}
                  <View style={styles.contactInfo}>
                    <Text style={[styles.contactName, { fontFamily: fontBold }]}>
                      {contact.name}
                    </Text>
                    <Text style={[styles.contactLastConnection, { fontFamily: fontRegular }]}>
                      Dernière connexion:
                    </Text>
                    <Text style={[styles.contactDate, { fontFamily: fontRegular }]}>
                      {contact.lastConnection}
                    </Text>
                  </View>
                  
                  {/* Invite Button */}
                  <Pressable
                    style={[
                      styles.inviteButton,
                      invitedContacts.has(contact.id) && styles.inviteButtonActive
                    ]}
                    onPress={() => toggleInvite(contact.id)}
                  >
                    <Text style={[
                      styles.inviteButtonText,
                      { fontFamily: fontMedium },
                      invitedContacts.has(contact.id) && styles.inviteButtonTextActive
                    ]}>
                      Inviter
                    </Text>
                  </Pressable>
                </View>
              </Animated.View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Custom Bottom Navigation */}
      <QuizBottomNav
        onBack={() => router.back()}
        onNext={handleNext}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  addButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    backgroundColor: 'transparent',
  },
  addButtonText: {
    fontSize: 16,
    color: '#8B5CF6',
  },
  participantsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  participantsText: {
    fontSize: 16,
    color: '#374151',
  },
  participantsEmoji: {
    fontSize: 24,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#374151',
    marginBottom: 16,
  },
  recentContactsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  recentContactsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  recentContactCard: {
    alignItems: 'center',
    width: 80,
  },
  checkboxContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentContactName: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
  },
  contactsList: {
    gap: 12,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 2,
  },
  contactLastConnection: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  contactDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  inviteButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    backgroundColor: 'transparent',
  },
  inviteButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  inviteButtonText: {
    fontSize: 14,
    color: '#8B5CF6',
  },
  inviteButtonTextActive: {
    color: '#FFFFFF',
  },
});

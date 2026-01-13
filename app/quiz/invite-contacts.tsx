/**
 * Quiz Invite Contacts Screen
 * ============================
 * Users can invite contacts to participate in a quiz
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QuizBottomNav } from '@/components/quiz/QuizBottomNav';
import { Colors } from '@/config/colors';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
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
  const { t } = useTranslation();
  const { colors } = useTheme();
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
    const totalSelected = selectedRecentContacts.size + invitedContacts.size;
    router.push({
      pathname: '/quiz/setup-game',
      params: { participantCount: totalSelected.toString() }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          onPress={() => router.back()} 
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
         <Text style={[styles.headerTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
            {t('quiz.invite.title')}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Add Button and Participants */}
        <View style={styles.topSection}>
          <Pressable
            style={[styles.addButton, { borderColor: Colors.palette.purple.primary }]}
            onPress={() => router.push('/quiz/add-participants')}
          >
            <Text style={[styles.addButtonText, { fontFamily: fontMedium, color: Colors.palette.purple.primary }]}>
              {t('quiz.invite.add_button')}
            </Text>
          </Pressable>
          
          <View style={styles.participantsInfo}>
            <Text style={[styles.participantsText, { fontFamily: fontRegular, color: colors.text.secondary }]}>
              {t('quiz.invite.participants_label')}
            </Text>
          </View>
        </View>

        {/* Recent Contacts Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: fontRegular, color: colors.text.primary }]}>
            {t('quiz.invite.recent_title')}
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
                      { borderColor: colors.border, backgroundColor: colors.surface },
                      selectedRecentContacts.has(contact.id) && { backgroundColor: Colors.palette.purple.primary, borderColor: Colors.palette.purple.primary }
                    ]}>
                      {selectedRecentContacts.has(contact.id) && (
                        <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                      )}
                    </View>
                  </View>
                  
                  {/* Avatar */}
                  <View style={[styles.avatarCircle, { backgroundColor: colors.surfaceHighlight || '#F3F4F6' }]}>
                    <Ionicons name="person" size={24} color={colors.text.secondary} />
                  </View>
                  
                  {/* Name */}
                  <Text style={[styles.recentContactName, { fontFamily: fontRegular, color: colors.text.primary }]} numberOfLines={1}>
                    {contact.name}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </ScrollView>
        </View>

        {/* All Contacts Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: fontRegular, color: colors.text.primary }]}>
            {t('quiz.invite.all_title')}
          </Text>
          
          <View style={styles.contactsList}>
            {ALL_CONTACTS.map((contact, index) => (
              <Animated.View
                key={contact.id}
                entering={FadeInDown.delay(index * 30).springify()}
              >
                <View style={[styles.contactCard, { backgroundColor: colors.surface, shadowColor: colors.text.primary }]}>
                  {/* Avatar */}
                  <View style={[styles.contactAvatar, { backgroundColor: colors.surfaceHighlight || '#F3F4F6' }]}>
                    <Ionicons name="person" size={24} color={colors.text.secondary} />
                  </View>
                  
                  {/* Info */}
                  <View style={styles.contactInfo}>
                    <Text style={[styles.contactName, { fontFamily: fontBold, color: colors.text.primary }]}>
                      {contact.name}
                    </Text>
                    <Text style={[styles.contactLastConnection, { fontFamily: fontRegular, color: colors.text.secondary }]}>
                      {t('quiz.invite.last_connection')}
                    </Text>
                    <Text style={[styles.contactDate, { fontFamily: fontRegular, color: colors.text.secondary }]}>
                      {contact.lastConnection}
                    </Text>
                  </View>
                  
                  {/* Invite Button */}
                  <Pressable
                    style={[
                      styles.inviteButton,
                      { borderColor: Colors.palette.purple.primary },
                      invitedContacts.has(contact.id) && { backgroundColor: Colors.palette.purple.primary }
                    ]}
                    onPress={() => toggleInvite(contact.id)}
                  >
                    <Text style={[
                      styles.inviteButtonText,
                      { fontFamily: fontMedium, color: Colors.palette.purple.primary },
                      invitedContacts.has(contact.id) && { color: '#FFFFFF' }
                    ]}>
                      {t('quiz.invite.invite_action')}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
      fontSize: 18,
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
    backgroundColor: 'transparent',
  },
  addButtonText: {
    fontSize: 14,
  },
  participantsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  participantsText: {
    fontSize: 16,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
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
    width: 70,
  },
  checkboxContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentContactName: {
    fontSize: 11,
    textAlign: 'center',
  },
  contactsList: {
    gap: 12,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    marginBottom: 2,
  },
  contactLastConnection: {
    fontSize: 11,
  },
  contactDate: {
    fontSize: 11,
  },
  inviteButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  inviteButtonText: {
    fontSize: 12,
  },
});

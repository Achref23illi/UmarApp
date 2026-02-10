/**
 * Quiz Invite Contacts Screen
 * ============================
 * Users can invite contacts to participate in a quiz
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QuizBottomNav } from '@/components/quiz/QuizBottomNav';
import { Colors } from '@/config/colors';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { contactsService, InviteContact } from '@/services/contactsService';
import { useAppSelector } from '@/store/hooks';

export default function InviteContactsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);

  const fontBold = getFont(currentLanguage, 'bold');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontRegular = getFont(currentLanguage, 'regular');

  const [recentContacts, setRecentContacts] = useState<InviteContact[]>([]);
  const [allContacts, setAllContacts] = useState<InviteContact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [selectedRecentContacts, setSelectedRecentContacts] = useState<Set<string>>(new Set());
  const [invitedContacts, setInvitedContacts] = useState<Set<string>>(new Set());

  useEffect(() => {
    let isActive = true;

    const loadContacts = async () => {
      try {
        setIsLoadingContacts(true);
        setContactsError(null);

        const { recent, all } = await contactsService.getInviteContacts({
          language: currentLanguage,
        });

        if (!isActive) return;
        setRecentContacts(recent);
        setAllContacts(all);
      } catch (error) {
        console.error('Failed to load contacts:', error);
        if (!isActive) return;
        setRecentContacts([]);
        setAllContacts([]);
        setContactsError(t('errors.networkError'));
      } finally {
        if (!isActive) return;
        setIsLoadingContacts(false);
      }
    };

    loadContacts();

    return () => {
      isActive = false;
    };
  }, [currentLanguage, t, reloadKey]);

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
        {isLoadingContacts && recentContacts.length === 0 && allContacts.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.palette.purple.primary} />
          </View>
        ) : contactsError ? (
          <View style={{ paddingVertical: 24, gap: 10 }}>
            <Text style={{ fontFamily: fontBold, color: colors.text.primary }}>{t('errors.somethingWentWrong')}</Text>
            <Text style={{ fontFamily: fontRegular, color: colors.text.secondary }}>{contactsError}</Text>
            <Pressable
              onPress={() => setReloadKey((k) => k + 1)}
              style={{
                marginTop: 8,
                alignSelf: 'flex-start',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: Colors.palette.purple.primary,
              }}
            >
              <Text style={{ fontFamily: fontMedium, color: '#fff' }}>{t('errors.tryAgain')}</Text>
            </Pressable>
          </View>
        ) : null}

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
            {recentContacts.map((contact, index) => (
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
                  {contact.avatarUrl ? (
                    <Image source={{ uri: contact.avatarUrl }} style={styles.avatarCircle} contentFit="cover" />
                  ) : (
                    <View style={[styles.avatarCircle, { backgroundColor: colors.surfaceHighlight || '#F3F4F6' }]}>
                      <Ionicons name="person" size={24} color={colors.text.secondary} />
                    </View>
                  )}
                  
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
            {allContacts.map((contact, index) => (
              <Animated.View
                key={contact.id}
                entering={FadeInDown.delay(index * 30).springify()}
              >
                <View style={[styles.contactCard, { backgroundColor: colors.surface, shadowColor: colors.text.primary }]}>
                  {/* Avatar */}
                  {contact.avatarUrl ? (
                    <Image source={{ uri: contact.avatarUrl }} style={styles.contactAvatar} contentFit="cover" />
                  ) : (
                    <View style={[styles.contactAvatar, { backgroundColor: colors.surfaceHighlight || '#F3F4F6' }]}>
                      <Ionicons name="person" size={24} color={colors.text.secondary} />
                    </View>
                  )}
                  
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

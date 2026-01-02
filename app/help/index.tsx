/**
 * Help Screen
 * ============
 * FAQ and support information for the app.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { useAppSelector } from '@/store/hooks';

const FAQ_ITEMS = [
  {
    question: 'How accurate are the prayer times?',
    answer: 'Prayer times are calculated using the AlAdhan API based on your exact GPS location. They use the Muslim World League calculation method which is widely accepted.',
  },
  {
    question: 'How does the Qibla finder work?',
    answer: 'The Qibla direction is calculated using your GPS coordinates and the coordinates of the Holy Kaaba in Mecca. Use a physical compass or your phone\'s compass app to align with the shown direction.',
  },
  {
    question: 'Can I use this app offline?',
    answer: 'Some features like the Tasbih counter and 99 Names of Allah work offline. However, prayer times, Qibla direction, and calendar features require an internet connection.',
  },
  {
    question: 'How do I add a new Dua or Challenge?',
    answer: 'Currently, Duas and Challenges are managed by administrators. Please contact support if you have suggestions for new content.',
  },
  {
    question: 'Is my data private?',
    answer: 'Yes, we only collect essential data for app functionality (like location for prayer times). Your personal information is never shared with third parties.',
  },
];

const CONTACT_OPTIONS = [
  { id: 'email', icon: 'mail-outline', label: 'Email Support', action: 'mailto:support@umarapp.com' },
  { id: 'website', icon: 'globe-outline', label: 'Visit Website', action: 'https://umarapp.com' },
];

export default function HelpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  
  const fontRegular = getFont(currentLanguage, 'regular');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontSemiBold = getFont(currentLanguage, 'semiBold');
  const fontBold = getFont(currentLanguage, 'bold');

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndex(prev => prev === index ? null : index);
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
          Help & Support
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
            Frequently Asked Questions
          </Text>
          
          {FAQ_ITEMS.map((item, index) => (
            <Animated.View 
              key={index}
              entering={FadeInDown.delay(index * 100).springify()}
            >
              <Pressable 
                onPress={() => toggleExpand(index)}
                style={[styles.faqCard, { backgroundColor: colors.surface }]}
              >
                <View style={styles.faqHeader}>
                  <Text style={[styles.faqQuestion, { fontFamily: fontSemiBold, color: colors.text.primary }]}>
                    {item.question}
                  </Text>
                  <Ionicons 
                    name={expandedIndex === index ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color={colors.text.secondary} 
                  />
                </View>
                {expandedIndex === index && (
                  <Text style={[styles.faqAnswer, { fontFamily: fontRegular, color: colors.text.secondary }]}>
                    {item.answer}
                  </Text>
                )}
              </Pressable>
            </Animated.View>
          ))}
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
            Contact Us
          </Text>
          
          {CONTACT_OPTIONS.map((option) => (
            <Pressable 
              key={option.id}
              onPress={() => Linking.openURL(option.action)}
              style={[styles.contactCard, { backgroundColor: colors.surface }]}
            >
              <View style={[styles.contactIcon, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
                <Ionicons name={option.icon as any} size={24} color={colors.primary} />
              </View>
              <Text style={[styles.contactLabel, { fontFamily: fontMedium, color: colors.text.primary }]}>
                {option.label}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
            </Pressable>
          ))}
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appName, { fontFamily: fontBold, color: colors.text.primary }]}>
            UmarApp
          </Text>
          <Text style={[styles.appVersion, { fontFamily: fontMedium, color: colors.text.secondary }]}>
            Version 1.0.0
          </Text>
          <Text style={[styles.copyright, { fontFamily: fontRegular, color: colors.text.disabled }]}>
            © 2025 UmarApp. All rights reserved.
          </Text>
        </View>
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  faqCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 15,
    flex: 1,
    paddingRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 16,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {
    flex: 1,
    fontSize: 15,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  appName: {
    fontSize: 20,
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    marginBottom: 8,
  },
  copyright: {
    fontSize: 12,
  },
});

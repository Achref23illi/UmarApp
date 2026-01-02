/**
 * Jeneza Announcements Screen (Placeholder)
 * ==========================================
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';

export default function JenezaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

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
        <Text style={[styles.headerTitle, { fontFamily: Fonts.semiBold, color: colors.text.primary }]}>
          Jeneza
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(21, 101, 192, 0.2)' : 'rgba(21, 101, 192, 0.1)' }]}>
          <Ionicons name="heart" size={60} color="#1565C0" />
        </View>
        <Text style={[styles.title, { fontFamily: Fonts.bold, color: colors.text.primary }]}>
          Jeneza Announcements
        </Text>
        <Text style={[styles.subtitle, { fontFamily: Fonts.medium, color: '#1565C0' }]}>
          Coming soon...
        </Text>
        <Text style={[styles.description, { fontFamily: Fonts.regular, color: colors.text.secondary }]}>
          Share and view funeral announcements{'\n'}
          in your community. Express condolences{'\n'}
          and support bereaved families.
        </Text>
      </View>
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
  },
  headerTitle: {
    fontSize: 18,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { userStatsService } from '@/services/userStatsService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setLanguage } from '@/store/slices/languageSlice';
import { logoutUser, setTheme } from '@/store/slices/userSlice';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, theme } = useTheme();
  const dispatch = useAppDispatch();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const userData = useAppSelector((state) => state.user);
  const isRTL = currentLanguage === 'ar';
  const themePreference = useAppSelector((state) => state.user.preferences.theme);

  const fontRegular = getFont(currentLanguage, 'regular');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontSemiBold = getFont(currentLanguage, 'semiBold');
  const fontBold = getFont(currentLanguage, 'bold');

  const [points, setPoints] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadStats = async () => {
        try {
          if (!userData.isAuthenticated) {
            if (isActive) {
              setPoints(0);
              setBadges([]);
            }
            return;
          }

          const stats = await userStatsService.getUserStats();
          if (!isActive) return;

          setPoints(stats.points);
          setBadges(stats.badges);
        } catch (error) {
          console.error('Failed to load user stats:', error);
          if (isActive) {
            setPoints(0);
            setBadges([]);
          }
        }
      };

      loadStats();

      return () => {
        isActive = false;
      };
    }, [userData.isAuthenticated])
  );

  const user = {
    name: userData.name || 'User',
    email: userData.email || '',
    isPremium: false,
    points,
    badges,
    avatar: userData.avatar_url,
  };

  const handleSignOut = async () => {
    await dispatch(logoutUser());
    router.replace('/welcome');
  };

  const menuItems = [
    { icon: 'person-outline', labelKey: 'profile.editProfile', route: '/profile/edit' },
    { icon: 'notifications-outline', labelKey: 'profile.notifications', route: '/profile/notifications' },
    // { icon: 'moon-outline', labelKey: 'profile.prayerSettings', route: '/profile/prayer-settings' }, // Moved to generic settings
    { icon: 'diamond-outline', labelKey: 'profile.goPremium', route: '/profile/premium', highlight: true },
    { icon: 'help-circle-outline', labelKey: 'profile.helpSupport', route: '/profile/help' },
    { icon: 'information-circle-outline', labelKey: 'profile.about', route: '/profile/about' },
  ];

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'ar', label: 'العربية' },
  ];

  const themes = [
    { code: 'light', labelKey: 'settings.theme.light', icon: 'sunny-outline' },
    { code: 'dark', labelKey: 'settings.theme.dark', icon: 'moon-outline' },
    { code: 'system', labelKey: 'settings.theme.system', icon: 'phone-portrait-outline' },
  ] as const;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { fontFamily: fontBold, color: colors.text.primary }]}>Settings</Text>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
          <View style={styles.avatarContainer}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surfaceHighlight }]}>
                <Ionicons name="person" size={40} color={colors.text.secondary} />
              </View>
            )}
            {user.isPremium && (
              <View style={[styles.premiumBadge, { backgroundColor: colors.secondary, borderColor: colors.surface }]}>
                <Ionicons name="diamond" size={14} color={colors.text.inverse} />
              </View>
            )}
          </View>

          <Text style={[styles.userName, { fontFamily: fontSemiBold, color: colors.text.primary }]}>{user.name}</Text>
          <Text style={[styles.userEmail, { fontFamily: fontRegular, color: colors.text.secondary }]}>{user.email}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { fontFamily: fontBold, color: colors.primary }]}>{user.points}</Text>
              <Text style={[styles.statLabel, { fontFamily: fontRegular, color: colors.text.secondary }]}>{t('common.points')}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { fontFamily: fontBold, color: colors.primary }]}>{user.badges.length}</Text>
              <Text style={[styles.statLabel, { fontFamily: fontRegular, color: colors.text.secondary }]}>{t('common.badges')}</Text>
            </View>
             <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { fontFamily: fontBold, color: colors.primary }]}>
                {user.isPremium ? '✓' : '−'}
              </Text>
              <Text style={[styles.statLabel, { fontFamily: fontRegular, color: colors.text.secondary }]}>{t('common.premium')}</Text>
            </View>
          </View>
        </View>
        
        {/* Menu Items */}
        <View style={[styles.menuContainer, { backgroundColor: colors.surface }]}>
          {menuItems.map((item, index) => (
            <Pressable
              key={index}
              style={[
                styles.menuItem,
                { borderBottomColor: colors.border },
                item.highlight && { backgroundColor: colors.primary }
              ]}
              onPress={() => router.push(item.route as never)}
            >
              <View style={styles.menuItemLeft}>
                 <View
                  style={[
                    styles.menuIconContainer,
                    { backgroundColor: colors.surfaceHighlight },
                    item.highlight && { backgroundColor: 'rgba(255,255,255,0.2)' },
                  ]}
                >
                  <Ionicons
                    name={item.icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={item.highlight ? colors.text.inverse : colors.primary}
                  />
                </View>
                <Text
                  style={[
                    styles.menuItemLabel,
                    { fontFamily: fontMedium, color: colors.text.primary },
                    item.highlight && { color: colors.text.inverse },
                  ]}
                >
                  {t(item.labelKey)}
                </Text>
              </View>
               <Ionicons
                name={isRTL ? 'chevron-back' : 'chevron-forward'}
                size={20}
                color={item.highlight ? colors.secondary : colors.text.disabled}
              />
            </Pressable>
          ))}
        </View>

        {/* Appearance Settings */}
        <Text style={[styles.sectionTitle, { fontFamily: fontBold, color: colors.text.secondary }]}>{t('settings.appearance')}</Text>
         <View style={[styles.settingsCard, { backgroundColor: colors.surface }]}>
           <View style={styles.themeRow}>
            {themes.map((item) => {
                const isActive = themePreference === item.code;
                return (
                  <Pressable
                    key={item.code}
                    onPress={() => dispatch(setTheme(item.code))}
                    style={[
                      styles.themeOption,
                      { 
                        backgroundColor: isActive ? colors.primary : 'transparent',
                        borderColor: colors.border,
                      }
                    ]}
                  >
                    <Ionicons 
                      name={item.icon as any} 
                      size={24} 
                      color={isActive ? colors.text.inverse : colors.text.primary} 
                    />
                    <Text style={[
                      styles.themeLabel, 
                      { fontFamily: fontMedium, color: isActive ? colors.text.inverse : colors.text.primary }
                    ]}>
                      {t(item.labelKey)}
                    </Text>
                  </Pressable>
                );
              })}
           </View>
         </View>

         {/* Language Settings */}
        <Text style={[styles.sectionTitle, { fontFamily: fontBold, color: colors.text.secondary, marginTop: 24 }]}>{t('settings.language')}</Text>
        <View style={[styles.settingsCard, { backgroundColor: colors.surface }]}>
            {languages.map((item, index) => (
                <Pressable
                    key={item.code}
                    onPress={() => dispatch(setLanguage(item.code as any))}
                    style={[styles.languageItem, { borderBottomColor: index === languages.length - 1 ? 'transparent' : colors.divider }]}
                >
                    <Text style={[styles.languageLabel, { fontFamily: fontMedium, color: colors.text.primary }]}>
                    {item.label}
                    </Text>
                    {currentLanguage === item.code && (
                    <Ionicons name="checkmark" size={24} color={colors.primary} />
                    )}
                </Pressable>
            ))}
        </View>

        {/* Logout Button */}
        <Pressable 
          style={({ pressed }) => [
            styles.logoutButton,
            { opacity: pressed ? 0.6 : 1 }
          ]} 
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={20} color="#E53935" />
          <Text style={[styles.logoutText, { fontFamily: fontMedium, color: '#E53935' }]}>{t('profile.signOut')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
  },
  profileCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  userName: {
    fontSize: 22,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statValue: {
    fontSize: 20,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  menuContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuItemLabel: {
    fontSize: 15,
  },
  settingsCard: {
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.05)',
  },
  sectionTitle: {
      fontSize: 14,
      marginBottom: 12,
      textTransform: 'uppercase',
  },
  themeRow: {
      flexDirection: 'row',
      gap: 8,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  themeLabel: {
    fontSize: 12,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  languageLabel: {
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    marginTop: 20,
  },
  logoutText: {
    fontSize: 15,
  },
});

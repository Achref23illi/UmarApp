import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setLanguage } from '@/store/slices/languageSlice'; // Assuming this exists or will need to create
import { setTheme } from '@/store/slices/userSlice';

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const themePreference = useAppSelector((state) => state.user.preferences.theme);
  const userData = useAppSelector((state) => state.user);

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

  const MenuLink = ({ title, icon, href, showNewBadge = false, color }: any) => (
      <Pressable 
        onPress={() => router.push(href)}
        style={({ pressed }) => [
            styles.menuLink,
            { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }
        ]}
      >
          <View style={[styles.iconContainer, { backgroundColor: color ? color + '15' : colors.primary + '15' }]}>
            <Ionicons name={icon} size={22} color={color || colors.primary} />
          </View>
          <Text style={[styles.menuLinkText, { color: colors.text.primary }]}>{title}</Text>
          {showNewBadge && (
            <View style={[styles.badge, { backgroundColor: '#8B3DB8' }]}>
                <Text style={styles.badgeText}>NEW</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
      </Pressable>
  );

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
    >
      {/* Back Button */}
      <Pressable 
        onPress={() => router.back()}
        style={[styles.backButton, { backgroundColor: colors.surface }]}
      >
        <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
      </Pressable>

      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
            {userData.avatar_url ? (
                <Image source={{ uri: userData.avatar_url }} style={styles.avatar} contentFit="cover" />
            ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface }]}>
                    <Ionicons name="person" size={40} color={colors.text.secondary} />
                </View>
            )}
        </View>
        <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text.primary }]}>
                {userData.name || 'Umar User'}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.text.secondary }]}>
                {userData.email || 'user@example.com'}
            </Text>
            {/* Added small edit button purely visual or redirects to a specific safe edit page if needed, currently just display */}
        </View>
      </View>

      {/* Premium Banner */}
      <Pressable 
        onPress={() => router.push('/settings/subscription')}
        style={[styles.premiumBanner, { marginHorizontal: 16, marginBottom: 8 }]} // Added marginHorizontal
      >
        <LinearGradient
            colors={['#8B3DB8', '#5D2E86']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.premiumGradient}
        >
            <View style={styles.premiumContent}>
                <View style={styles.premiumIconContainer}>
                    <Ionicons name="star" size={24} color="#FFD700" />
                </View>
                <View style={styles.premiumTextContainer}>
                    <Text style={styles.premiumTitle}>Umar Premium</Text>
                    <Text style={styles.premiumSubtitle}>Débloquez tout le potentiel</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#FFF" />
            </View>
        </LinearGradient>
      </Pressable>

      <View style={styles.sectionHeader}>
         <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Général</Text>
      </View>

      <View style={styles.menuGroup}>
          <MenuLink 
            title="Notifications" 
            icon="notifications-outline" 
            href="/settings/notifications" 
          />
          <MenuLink 
            title="Aide & Support" 
            icon="help-circle-outline" 
            href="/settings/help" 
          />
          <MenuLink 
            title="À propos" 
            icon="information-circle-outline" 
            href="/settings/about" 
          />
      </View>
      
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>
          {t('settings.appearance')}
        </Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.optionsRow}>
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
                  { color: isActive ? colors.text.inverse : colors.text.primary }
                ]}>
                  {t(item.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>
          {t('settings.language')}
        </Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {languages.map((item, index) => (
          <Pressable
            key={item.code}
            onPress={() => dispatch(setLanguage(item.code as any))}
            style={[
                styles.languageItem, 
                { borderBottomColor: colors.divider },
                index === languages.length - 1 && { borderBottomWidth: 0 }
            ]}
          >
             <Text style={[styles.languageLabel, { color: colors.text.primary }]}>
               {item.label}
             </Text>
             {currentLanguage === item.code && (
               <Ionicons name="checkmark" size={24} color={colors.primary} />
             )}
          </Pressable>
        ))}
      </View>
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: 16, // Changed padding to vertical only
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      marginBottom: 12,
      gap: 16,
  },
  avatarContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
  },
  avatar: {
      width: '100%',
      height: '100%',
      borderRadius: 32,
  },
  avatarPlaceholder: {
      width: '100%',
      height: '100%',
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
  },
  profileInfo: {
      flex: 1,
      justifyContent: 'center',
  },
  profileName: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 2,
  },
  profileEmail: {
      fontSize: 14,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginHorizontal: 16, // Added marginHorizontal
  },
  sectionHeader: {
      paddingHorizontal: 24,
      marginTop: 8,
      marginBottom: -8,
      zIndex: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  menuGroup: {
      gap: 12,
      paddingHorizontal: 16,
  },
  menuLink: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      gap: 12,
  },
  iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
  },
  menuLinkText: {
      flex: 1,
      fontSize: 16,
      fontWeight: '500',
  },
  badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      marginRight: 4,
  },
  badgeText: {
      color: '#FFF',
      fontSize: 10,
      fontWeight: 'bold',
  },
  premiumBanner: {
      shadowColor: "#8B3DB8",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.30,
      shadowRadius: 8,
      elevation: 8,
  },
  premiumGradient: {
      borderRadius: 20,
      padding: 2,
  },
  premiumContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      gap: 12,
  },
  premiumIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
  },
  premiumTextContainer: {
      flex: 1,
  },
  premiumTitle: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: 'bold',
  },
  premiumSubtitle: {
      color: 'rgba(255,255,255,0.9)',
      fontSize: 13,
  },
  optionsRow: {
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
    fontSize: 14,
    fontWeight: '500',
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
});

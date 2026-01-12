import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dimensions,
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InfiniteFeed } from '@/components/feed/InfiniteFeed';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logoutUser } from '@/store/slices/userSlice';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const dispatch = useAppDispatch();
    const userData = useAppSelector((state) => state.user);
    const currentLanguage = useAppSelector((state) => state.language.currentLanguage);

    const fontRegular = getFont(currentLanguage, 'regular');
    const fontMedium = getFont(currentLanguage, 'medium');
    const fontBold = getFont(currentLanguage, 'bold');
    const fontSemiBold = getFont(currentLanguage, 'semiBold');

    // Default cover image if none provided
    const coverImage = "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=2070&auto=format&fit=crop";

    const handleSignOut = async () => {
        await dispatch(logoutUser());
        router.replace('/welcome');
    };

    // Header Component for the Feed
    const ProfileHeader = () => (
        <View style={styles.headerContainer}>
            {/* Cover Image */}
            <View style={styles.coverContainer}>
                <Image 
                    source={{ uri: coverImage }} 
                    style={styles.coverImage} 
                    contentFit="cover"
                />
            </View>

            {/* Profile Info */}
            <View style={styles.profileInfoContainer}>
                <View style={[styles.avatarContainer, { borderColor: colors.background }]}>
                    {userData.avatar_url ? (
                        <Image source={{ uri: userData.avatar_url }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surfaceHighlight }]}>
                           <Ionicons name="person" size={50} color={colors.text.secondary} />
                        </View>
                    )}
                </View>

                <View style={styles.nameSection}>
                    <Text style={[styles.userName, { fontFamily: fontBold, color: colors.text.primary }]}>
                        {userData.name || 'User'}
                    </Text>
                    {/* Placeholder bio for now */}
                    <Text style={[styles.userBio, { fontFamily: fontRegular, color: colors.text.secondary }]}>
                        Software Engineer @ Tech • Islamic Studies Enthusiast
                    </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtonsRow}>
                    <Pressable 
                        style={[styles.editProfileButton, { backgroundColor: colors.surfaceHighlight }]}
                        onPress={() => router.push('/profile/edit')}
                    >
                         <Ionicons name="pencil-outline" size={16} color={colors.text.primary} />
                         <Text style={[styles.buttonText, { fontFamily: fontMedium, color: colors.text.primary }]}>
                             {t('profile.editProfile')}
                         </Text>
                    </Pressable>
                     <Pressable 
                        style={[styles.settingsButton, { backgroundColor: colors.surfaceHighlight }]}
                        onPress={() => router.push('/settings')}
                    >
                         <Ionicons name="settings-outline" size={20} color={colors.text.primary} />
                    </Pressable>
                </View>

                {/* Logout Button */}
                <Pressable 
                    style={({ pressed }) => [
                        styles.logoutButton,
                        { 
                            backgroundColor: colors.surfaceHighlight,
                            opacity: pressed ? 0.6 : 1 
                        }
                    ]} 
                    onPress={handleSignOut}
                >
                    <Ionicons name="log-out-outline" size={18} color="#E53935" />
                    <Text style={[styles.logoutText, { fontFamily: fontMedium, color: '#E53935' }]}>
                        {t('profile.signOut')}
                    </Text>
                </Pressable>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                
                <Text style={[styles.postsLabel, { fontFamily: fontBold, color: colors.text.primary }]}>Posts</Text>
            </View>
        </View>
    );

    // If no user ID, standard error or generic feed (should be authenticated though)
    if (!userData.id) {
         return (
             <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
                 <Text style={{ color: colors.text.primary, textAlign: 'center', marginTop: 20 }}>
                     Please log in to view profile.
                 </Text>
             </View>
         );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Using InfiniteFeed with filtered user ID */}
            {/* We pass a custom header containing the profile details */}
            <InfiniteFeed 
                userId={userData.id}
                ListHeaderComponent={<ProfileHeader />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        marginBottom: 10,
        backgroundColor: 'transparent',
    },
    coverContainer: {
        height: 180,
        width: '100%',
        backgroundColor: '#E5E7EB',
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    profileInfoContainer: {
        paddingHorizontal: 20,
        marginTop: -50, // Move up to overlap cover
        paddingBottom: 10,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nameSection: {
        marginBottom: 16,
    },
    userName: {
        fontSize: 24,
        marginBottom: 4,
    },
    userBio: {
        fontSize: 14,
        lineHeight: 20,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    editProfileButton: {
        flex: 1,
        height: 40,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    settingsButton: {
        width: 44,
        height: 40,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 14,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 13,
    },
    divider: {
        height: 1,
        width: '100%',
        marginVertical: 10,
        marginBottom: 20,
    },
    postsLabel: {
        fontSize: 18,
        marginBottom: 10,
    },
    logoutButton: {
        height: 40,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 20,
    },
    logoutText: {
        fontSize: 14,
    }
});

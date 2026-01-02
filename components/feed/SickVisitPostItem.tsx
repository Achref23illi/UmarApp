import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { Post, socialService } from '@/services/socialService';
import { useAppSelector } from '@/store/hooks';

interface SickVisitPostItemProps {
  post: Post;
  onDelete?: () => void;
}

export function SickVisitPostItem({ post, onDelete }: SickVisitPostItemProps) {
  const router = useRouter(); // Added router
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  
  const [currentUser, setCurrentUser] = React.useState<any>(null);

  React.useEffect(() => {
    socialService.getUser().then(setCurrentUser);
  }, []);

  const fontRegular = getFont(currentLanguage, 'regular');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontBold = getFont(currentLanguage, 'bold');

  if (!post.sickVisitData) return null;

  const { patientName, hospitalName, hospitalLocation, visitingHours, ward, roomNumber } = post.sickVisitData;

  const handleShare = () => {
    socialService.sharePost(`Visit ${patientName} at ${hospitalName}. Hours: ${visitingHours}`);
  };

  const openDirections = () => {
      const { lat, lng } = hospitalLocation;
      const url = Platform.select({
        ios: `maps:?daddr=${lat},${lng}&dirflg=d`,
        android: `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(hospitalName)})`,
      });
      if (url) Linking.openURL(url);
  };

  const handleMore = () => {
    if (currentUser?.id === post.user.id || currentUser?.isAdmin) {
        Alert.alert(
            t('common.options'),
            undefined,
            [
                { text: t('common.cancel'), style: 'cancel' },
                { 
                    text: t('common.delete'), 
                    style: 'destructive', 
                    onPress: async () => {
                        const success = await socialService.deletePost(post.id);
                        if (success && onDelete) onDelete();
                    }
                }
            ]
        );
    }
  };

  const addToAgenda = () => {
      // TODO: Implement actual calendar integration using expo-calendar
      Alert.alert(t('common.success'), t('feed.addedToAgenda'));
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;
    if (diff < 3600) return `${Math.floor(diff / 60)}${t('time.m')} ${t('time.ago')}`;
    return `${Math.floor(diff / 3600)}${t('time.h')} ${t('time.ago')}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Sick Visit Header Banner */}
      <LinearGradient
        colors={['#7C3AED', '#6D28D9']} // Purple theme for sick visits
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.banner}
      >
        <View style={styles.bannerContent}>
            <View style={styles.bannerIconBg}>
                <Ionicons name="medkit" size={16} color="#FFF" />
            </View>
            <Text style={[styles.bannerText, { fontFamily: fontMedium }]}>Visites aux malades</Text>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            <Text style={[styles.bannerTime, { fontFamily: fontRegular }]}>{formatTime(post.timestamp)}</Text>
            {(currentUser?.id === post.user.id || currentUser?.isAdmin) && (
                <Pressable onPress={handleMore}>
                    <Ionicons name="ellipsis-horizontal" size={20} color="rgba(255,255,255,0.7)" />
                </Pressable>
            )}
        </View>
      </LinearGradient>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <View style={styles.userRow}>
             <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
             <Text style={[styles.userName, { fontFamily: fontMedium, color: colors.text.secondary }]}>
                 {post.user.name}
             </Text>
        </View>
        
        <Text style={[styles.patientName, { fontFamily: fontBold, color: colors.text.primary }]}>
            {patientName || 'Un frère/Une soeur'}
        </Text>

        {/* Info Grid */}
        <View style={[styles.infoGrid, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB' }]}>
            <Pressable onPress={openDirections} style={({pressed}) => [styles.infoRow, { opacity: pressed ? 0.7 : 1 }]}>
                <Ionicons name="location" size={20} color={colors.primary} />
                <View style={styles.infoTextContainer}>
                    <Text style={[styles.infoLabel, { fontFamily: fontRegular, color: colors.text.secondary }]}>{t('feed.hospital')}</Text>
                    <Text style={[styles.infoValue, { fontFamily: fontMedium, color: colors.text.primary }]}>
                        {hospitalName}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} style={{opacity: 0.5}} />
            </Pressable>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
                <Ionicons name="time" size={20} color={colors.primary} />
                <View style={styles.infoTextContainer}>
                    <Text style={[styles.infoLabel, { fontFamily: fontRegular, color: colors.text.secondary }]}>Contrainte horaire</Text>
                    <Text style={[styles.infoValue, { fontFamily: fontMedium, color: colors.text.primary }]}>
                        {visitingHours || 'N/A'}
                    </Text>
                </View>
            </View>
            {(ward || roomNumber) && (
                <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                    <Ionicons name="bed" size={20} color={colors.primary} />
                    <View style={styles.infoTextContainer}>
                        <Text style={[styles.infoLabel, { fontFamily: fontRegular, color: colors.text.secondary }]}>Service / Chambre</Text>
                        <Text style={[styles.infoValue, { fontFamily: fontMedium, color: colors.text.primary }]}>
                            {ward ? `${ward}, ` : ''}{roomNumber ? `Ch. ${roomNumber}` : ''}
                        </Text>
                    </View>
                </View>
                </>
            )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
            <Pressable 
                onPress={addToAgenda} // Agenda Button
                style={[styles.secondaryButton, { borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#E5E7EB' }]}
            >
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            </Pressable>

            <Pressable 
                onPress={openDirections}
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            >
                <Ionicons name="navigate" size={18} color="#FFF" />
                <Text style={[styles.buttonText, { fontFamily: fontMedium }]}>{t('mosques.directions')}</Text>
            </Pressable>
            
            <Pressable 
                onPress={handleShare}
                style={[styles.secondaryButton, { borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#E5E7EB' }]}
            >
                <Ionicons name="share-social-outline" size={20} color={colors.text.primary} />
            </Pressable>

        </View>
      </View>

      {/* Social Footer */}
      <View style={[styles.footer, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
          <Pressable onPress={() => {}} style={styles.footerButton}> 
             {/* TODO: Sick Visit Likes? Reusing janaza/post logic if needed, but for now just placeholder or remove if not in design. 
                 Design usually implies standard social actions. Adding standard footer. */}
            <Ionicons name="heart-outline" size={22} color={colors.text.secondary} />
            <Text style={[styles.footerButtonText, { fontFamily: fontMedium, color: colors.text.secondary }]}>
                {post.likes > 0 ? post.likes : t('feed.like')}
            </Text>
          </Pressable>

          <Pressable onPress={() => router.push({ pathname: '/feed/comments/[id]', params: { id: post.id, type: post.type } })} style={styles.footerButton}>
            <Ionicons name="chatbubble-outline" size={20} color={colors.text.secondary} />
            <Text style={[styles.footerButtonText, { fontFamily: fontMedium, color: colors.text.secondary }]}>
                {post.comments > 0 ? post.comments : t('feed.comment')}
            </Text>
          </Pressable>

          <Pressable onPress={handleShare} style={styles.footerButton}>
            <Ionicons name="share-social-outline" size={20} color={colors.text.secondary} />
            <Text style={[styles.footerButtonText, { fontFamily: fontMedium, color: colors.text.secondary }]}>
                {t('feed.share')}
            </Text>
          </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  footer: {
      flexDirection: 'row',
      borderTopWidth: 1,
      paddingVertical: 12,
  },
  footerButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
  },
  footerButtonText: {
      fontSize: 13,
  },
  banner: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  bannerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
  },
  bannerIconBg: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      padding: 4,
      borderRadius: 6,
  },
  bannerText: {
      color: '#FFF',
      fontSize: 13,
      letterSpacing: 0.5,
  },
  bannerTime: {
      color: 'rgba(255,255,255,0.6)',
      fontSize: 12,
  },
  mainContent: {
      padding: 16,
  },
  userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 8,
  },
  avatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
  },
  userName: {
      fontSize: 13,
  },
  patientName: {
      fontSize: 18,
      marginBottom: 16,
  },
  infoGrid: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
  },
  infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
  },
  infoTextContainer: {
      flex: 1,
  },
  infoLabel: {
      fontSize: 12,
      marginBottom: 2,
  },
  infoValue: {
      fontSize: 14,
  },
  divider: {
      height: 1,
      backgroundColor: 'rgba(0,0,0,0.05)',
      marginVertical: 12,
  },
  actionButtons: {
      flexDirection: 'row',
      gap: 12,
  },
  primaryButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: 12,
  },
  buttonText: {
      color: '#FFF',
      fontSize: 15,
  },
  secondaryButton: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      borderWidth: 1,
  },
});

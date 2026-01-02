import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';

import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { Post, socialService } from '@/services/socialService';
import { useAppSelector } from '@/store/hooks';

interface JanazaPostItemProps {
  post: Post;
  onPressLocation?: () => void;
  onDelete?: () => void;
}

export function JanazaPostItem({ post, onDelete }: JanazaPostItemProps) {
  const router = useRouter();
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

  if (!post.janazaData) return null;

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

  const { deceasedName, prayerTime, mosqueName, mosqueLocation, cemeteryName } = post.janazaData;

  const handleShare = () => {
    socialService.sharePost(`${t('feed.janaza')}: ${deceasedName}. ${prayerTime} ${t('common.at')} ${mosqueName}.`); 
  };

  const openDirections = () => {
      const { lat, lng } = mosqueLocation;
      const url = Platform.select({
        ios: `maps:?daddr=${lat},${lng}&dirflg=d`,
        android: `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(mosqueName)})`,
      });
      if (url) Linking.openURL(url);
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;
    if (diff < 3600) return `${Math.floor(diff / 60)}${t('time.m')} ${t('time.ago')}`;
    return `${Math.floor(diff / 3600)}${t('time.h')} ${t('time.ago')}`;
  };

  /* Animation */
  const [isLiked, setIsLiked] = React.useState(post.isLiked);
  const [likesCount, setLikesCount] = React.useState(post.likes);
  const scale = useSharedValue(1);

  const handleLike = () => {
    const newState = !isLiked;
    setIsLiked(newState);
    setLikesCount(prev => newState ? prev + 1 : prev - 1);
    
    scale.value = withSequence(
      withSpring(1.2),
      withSpring(1)
    );

    socialService.likePost(post.id);
  };

  const handleComment = () => {
      // Navigate to comments
      router.push({
        pathname: '/feed/comments/[id]',
        params: { id: post.id, type: post.type }
      });
  };

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));


  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Janaza Header Banner */}
      <LinearGradient
        colors={['#1F2937', '#111827']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.banner}
      >
        <View style={styles.bannerContent}>
            <View style={styles.bannerIconBg}>
                <Ionicons name="moon" size={16} color="#FFF" />
            </View>
            <Text style={[styles.bannerText, { fontFamily: fontMedium }]}>{t('feed.janazaAlert')}</Text>
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
                 {t('feed.postedBy')} {post.user.name}
             </Text>
        </View>

        <Text style={[styles.introText, { fontFamily: fontRegular, color: colors.text.secondary }]}>
            Inna lillahi wa inna ilayhi raji'un
        </Text>
        
        {/* User Content / Instructions */}
        {post.content && (
            <Text style={[styles.userContent, { fontFamily: fontRegular, color: colors.text.primary }]}>
                {post.content}
            </Text>
        )}

        <Text style={[styles.deceasedName, { fontFamily: fontBold, color: colors.text.primary }]}>
            {post.janazaData.deceasedGender === 'male' ? t('common.brother') : t('common.sister')} {deceasedName}
        </Text>

        {/* Info Grid */}
        <View style={[styles.infoGrid, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB' }]}>
            <View style={styles.infoRow}>
                <Ionicons name="time" size={20} color={colors.primary} />
                <View style={styles.infoTextContainer}>
                    <Text style={[styles.infoLabel, { fontFamily: fontRegular, color: colors.text.secondary }]}>{t('feed.prayerTime')}</Text>
                    <Text style={[styles.infoValue, { fontFamily: fontMedium, color: colors.text.primary }]}>{prayerTime}</Text>
                </View>
            </View>
            <View style={styles.divider} />
            <Pressable onPress={openDirections} style={({pressed}) => [styles.infoRow, { opacity: pressed ? 0.7 : 1 }]}>
                <Ionicons name="location" size={20} color={colors.primary} />
                <View style={styles.infoTextContainer}>
                    <Text style={[styles.infoLabel, { fontFamily: fontRegular, color: colors.text.secondary }]}>{t('feed.location')}</Text>
                    <Text style={[styles.infoValue, { fontFamily: fontMedium, color: colors.text.primary }]}>{mosqueName}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} style={{opacity: 0.5}} />
            </Pressable>
            {cemeteryName && (
                <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                    <Ionicons name="leaf" size={20} color={colors.primary} />
                    <View style={styles.infoTextContainer}>
                        <Text style={[styles.infoLabel, { fontFamily: fontRegular, color: colors.text.secondary }]}>{t('feed.burial')}</Text>
                        <Text style={[styles.infoValue, { fontFamily: fontMedium, color: colors.text.primary }]}>{cemeteryName}</Text>
                    </View>
                </View>
                </>
            )}

        </View>

        {/* Action Buttons (Utility) */}
        <View style={styles.actionButtons}>
            <Pressable 
                onPress={() => Alert.alert(t('common.success'), t('feed.addedToAgenda'))}
                style={[styles.secondaryButton, { borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#E5E7EB', flex: 1 }]}
            >
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                <Text style={[styles.secondaryButtonText, { fontFamily: fontMedium, color: colors.text.primary }]}>Agenda</Text>
            </Pressable>

            <Pressable 
                onPress={openDirections}
                style={[styles.primaryButton, { backgroundColor: colors.primary, flex: 2 }]}
            >
                <Ionicons name="navigate" size={18} color="#FFF" />
                <Text style={[styles.buttonText, { fontFamily: fontMedium }]}>{t('mosques.directions')}</Text>
            </Pressable>
        </View>
      </View>

      {/* Social Footer */}
      <View style={[styles.footer, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
          <Pressable onPress={handleLike} style={styles.footerButton}>
            <Animated.View style={heartStyle}>
                <Ionicons 
                    name={isLiked ? "heart" : "heart-outline"} 
                    size={22} 
                    color={isLiked ? "#F87171" : colors.text.secondary} 
                />
            </Animated.View>
            <Text style={[styles.footerButtonText, { fontFamily: fontMedium, color: colors.text.secondary }]}>
                {likesCount > 0 ? likesCount : t('feed.like')}
            </Text>
          </Pressable>

          <Pressable onPress={handleComment} style={styles.footerButton}>
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
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerIconBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    color: '#FFF',
    fontSize: 14,
  },
  bannerTime: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  mainContent: {
    padding: 16,
    paddingBottom: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#EEE',
  },
  userName: {
    fontSize: 14,
  },
  introText: {
    fontSize: 14,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  userContent: {
      fontSize: 15,
      marginBottom: 12,
      lineHeight: 22,
  },
  deceasedName: {
    fontSize: 20,
    marginBottom: 16,
  },
  infoGrid: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoTextContainer: {
    marginLeft: 12,
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
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  primaryButton: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
  },
  secondaryButtonText: {
      fontSize: 14,
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
  }
});

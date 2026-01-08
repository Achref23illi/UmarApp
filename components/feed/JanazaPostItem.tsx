import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';

import { Images } from '@/config/assets';
import { Colors } from '@/config/colors';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { Post, socialService } from '@/services/socialService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setInAgenda, setPinned as setPinnedAction } from '@/store/slices/agendaSlice';
import { toast } from '@/components/ui/Toast';

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
  const dispatch = useAppDispatch();
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [meritVisible, setMeritVisible] = React.useState(false);
  const [isPinned, setIsPinned] = React.useState(!!post.pinned);
  const [inAgenda, setInAgendaState] = React.useState(!!post.inAgenda);

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

  const { deceasedName, prayerTime, mosqueName, mosqueLocation, mosqueAddress, cemeteryName, cemeteryAddress, prayerDate, isRepatriation } = post.janazaData;
  const tags = Array.isArray(post.tags) ? post.tags : [];

  const handleShare = () => {
    socialService.sharePost(`${t('feed.janaza')}: ${deceasedName}. ${prayerTime} ${t('common.at')} ${mosqueName}. ${tags.join(' ')}`); 
  };

  const openDirections = () => {
      if (!mosqueLocation) {
        toast.show({ type: 'info', message: t('feed.locationNotAvailable') });
        return;
      }
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

  const formatJanazaDate = (isoString: string) => {
    const date = new Date(isoString);
    const locale = currentLanguage === 'ar' ? 'ar' : currentLanguage === 'fr' ? 'fr-FR' : 'en-US';
    return date.toLocaleDateString(locale, { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const extractTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString(currentLanguage === 'ar' ? 'ar' : currentLanguage === 'fr' ? 'fr-FR' : 'en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const addToAgenda = async () => {
    const ok = await socialService.saveToAgenda(post.id, isPinned);
    if (ok) {
      setInAgendaState(true);
      dispatch(setInAgenda({ postId: post.id, pinned: isPinned }));
      toast.show({ type: 'success', message: t('feed.addedToAgenda') });
    } else {
      toast.show({ type: 'error', message: t('common.error') });
    }
  };

  const togglePin = async () => {
    const next = !isPinned;
    const ok = await socialService.setPinned(post.id, next);
    if (ok) {
      setIsPinned(next);
      setInAgendaState(true);
      dispatch(setPinnedAction({ postId: post.id, pinned: next }));
      toast.show({ type: 'success', message: next ? t('feed.pinned') : t('feed.unpinned') });
    } else {
      toast.show({ type: 'error', message: t('common.error') });
    }
  };

  const handleComment = () => {
      router.push({
        pathname: '/feed/comments/[id]',
        params: { id: post.id, type: post.type }
      });
  };


  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Janaza Header Banner */}
      <LinearGradient
        colors={['#192236', '#0E1626']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.banner}
      >
        <View style={styles.bannerContent}>
            <Image source={Images.death} style={styles.bannerIcon} contentFit="contain" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerText, { fontFamily: fontMedium }]}>ALERTE JANAZA</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                <Text style={[styles.bannerTime, { fontFamily: fontRegular }]}>{formatTime(post.timestamp)}</Text>
                <Pressable style={styles.pinButton} onPress={togglePin}>
                  <Ionicons name={isPinned ? 'pin' : 'pin-outline'} size={16} color="#FFF" />
                </Pressable>
              </View>
            </View>
        </View>
        {(currentUser?.id === post.user.id || currentUser?.isAdmin) && (
          <Pressable onPress={handleMore}>
            <Ionicons name="ellipsis-horizontal" size={20} color="rgba(255,255,255,0.7)" />
          </Pressable>
        )}
      </LinearGradient>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <View style={styles.userRow}>
             <Image source={Images.death} style={styles.avatar} contentFit="contain" />
             <View>
               <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.userName, { fontFamily: fontBold, color: colors.text.primary }]}>
                      Umar
                  </Text>
                  <Text style={[styles.tagNearName, { fontFamily: fontMedium, color: colors.primary }]}>
                      {tags.length ? tags[0] : '#salatjanaza'}
                  </Text>
               </View>
               <Text style={[styles.timeNearName, { fontFamily: fontRegular, color: colors.text.secondary }]}>
                 {formatTime(post.timestamp)}
               </Text>
             </View>
        </View>
        {tags.length > 0 && (
          <Text style={[styles.tags, { fontFamily: fontMedium, color: colors.primary }]}>
            {tags.join(' ')}
          </Text>
        )}

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
            {/* Mosque Location */}
            <Pressable onPress={openDirections} style={({pressed}) => [styles.infoRow, { opacity: pressed ? 0.7 : 1 }]}>
                <Ionicons name="location" size={20} color={colors.text.secondary} style={styles.infoIcon} />
                <View style={styles.infoTextContainer}>
                    <Text style={[styles.infoValue, { fontFamily: fontMedium, color: colors.text.primary }]}>{mosqueName}</Text>
                    {mosqueAddress && (
                        <Text style={[styles.infoAddress, { fontFamily: fontRegular, color: colors.text.secondary }]}>{mosqueAddress}</Text>
                    )}
                </View>
            </Pressable>
            
            {/* Cemetery or Repatriation */}
            {(cemeteryName || isRepatriation) && (
                <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                    <Ionicons name="construct-outline" size={20} color={colors.text.secondary} style={styles.infoIcon} />
                    <View style={styles.infoTextContainer}>
                        <Text style={[styles.infoValue, { fontFamily: fontMedium, color: colors.text.primary }]}>
                            {isRepatriation ? t('feed.repatriation') : `${cemeteryName}${cemeteryAddress ? ` ${cemeteryAddress}` : ''}`}
                        </Text>
                    </View>
                </View>
                </>
            )}

            {/* Date and Time */}
            <View style={styles.divider} />
            <View style={styles.infoRow}>
                <Ionicons name="calendar" size={20} color={colors.text.secondary} style={styles.infoIcon} />
                <View style={styles.infoTextContainer}>
                    <Text style={[styles.infoValue, { fontFamily: fontBold, color: colors.text.primary }]}>
                        {prayerDate ? formatJanazaDate(prayerDate) : formatJanazaDate(post.timestamp)}
                    </Text>
                </View>
                <Ionicons name="time" size={20} color={colors.text.secondary} style={[styles.infoIcon, { marginLeft: 8 }]} />
                <Text style={[styles.infoTime, { fontFamily: fontMedium, color: colors.text.primary }]}>
                    {prayerTime || extractTime(post.timestamp)}
                </Text>
            </View>
        </View>

        {/* Action Buttons - icons only */}
        <View style={styles.actionRowSingle}>
          <Pressable onPress={handleComment} style={styles.iconButton}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
          </Pressable>
          <Pressable onPress={() => setMeritVisible(true)} style={styles.iconButton}>
            <Ionicons name="flower-outline" size={18} color={colors.primary} />
          </Pressable>
          <Pressable 
              onPress={addToAgenda}
              style={styles.iconButton}
          >
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          </Pressable>
          <Pressable 
              onPress={openDirections}
              style={styles.iconButton}
          >
              <Ionicons name="navigate" size={18} color={colors.primary} />
          </Pressable>
          <Pressable onPress={handleShare} style={styles.iconButton}>
            <Ionicons name="share-social-outline" size={18} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      {/* Merit Modal */}
      <Modal
        visible={meritVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMeritVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setMeritVisible(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
            <Pressable style={styles.modalClose} onPress={() => setMeritVisible(false)}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </Pressable>
            
            {/* Floral Icon */}
            <View style={styles.modalIconContainer}>
              <Ionicons name="flower" size={32} color={colors.primary} />
            </View>
            
            {/* Title */}
            <Text style={[styles.modalTitle, { fontFamily: fontBold, color: colors.primary }]}>
              {t('feed.meritTitle')}
            </Text>
            
            {/* Bismillah */}
            <Text style={[styles.modalBismillah, { fontFamily: fontRegular, color: colors.text.primary }]}>
              {t('feed.meritBismillah')}
            </Text>
            
            {/* Hadith Text */}
            <Text style={[styles.modalText, { fontFamily: fontRegular, color: colors.text.primary }]}>
              {t('feed.meritContent')}
            </Text>
            
            {/* Source */}
            <Text style={[styles.modalSource, { fontFamily: fontRegular, color: colors.text.secondary }]}>
              {t('feed.meritSource')}
            </Text>
            
            {/* Footnote */}
            <Text style={[styles.modalFootnote, { fontFamily: fontRegular, color: colors.text.secondary }]}>
              {t('feed.meritFootnote')}
            </Text>
          </Pressable>
        </Pressable>
      </Modal>
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
  pinButton: {
    backgroundColor: Colors.palette.purple.primary,
    padding: 6,
    borderRadius: 16,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
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
  tags: {
    marginTop: 4,
    marginBottom: 8,
    fontSize: 12,
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
    paddingVertical: 12,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoValue: {
    fontSize: 15,
    lineHeight: 20,
  },
  infoAddress: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  infoTime: {
    fontSize: 15,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 4,
  },
  actionRowSingle: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    marginBottom: 4,
    justifyContent: 'space-between',
  },
  actionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionPillText: {
    fontSize: 13,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    padding: 24,
    paddingTop: 40,
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 10,
  },
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  modalBismillah: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
    textAlign: 'left',
  },
  modalSource: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  modalFootnote: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'left',
  },
});



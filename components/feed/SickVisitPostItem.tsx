import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Images } from '@/config/assets';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { Post, socialService } from '@/services/socialService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setInAgenda, setPinned as setPinnedAction } from '@/store/slices/agendaSlice';
import { toast } from '@/components/ui/Toast';

interface SickVisitPostItemProps {
  post: Post;
  onDelete?: () => void;
}

export function SickVisitPostItem({ post, onDelete }: SickVisitPostItemProps) {
  const router = useRouter(); // Added router
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const dispatch = useAppDispatch();
  
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [isPinned, setIsPinned] = React.useState(!!post.pinned);
  const [inAgenda, setInAgendaState] = React.useState(!!post.inAgenda);

  React.useEffect(() => {
    socialService.getUser().then(setCurrentUser);
  }, []);

  const fontRegular = getFont(currentLanguage, 'regular');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontBold = getFont(currentLanguage, 'bold');

  if (!post.sickVisitData) return null;

  const { patientName, hospitalName, hospitalLocation, visitingHours, ward, roomNumber } = post.sickVisitData;
  const tags = Array.isArray(post.tags) ? post.tags : [];

  const handleShare = () => {
    socialService.sharePost(`Visit ${patientName} at ${hospitalName}. Hours: ${visitingHours || ''} ${tags.join(' ')}`);
  };

  const openDirections = () => {
      if (!hospitalLocation) {
        toast.show({ type: 'info', message: t('feed.locationNotAvailable') });
        return;
      }
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

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;
    if (diff < 3600) return `${Math.floor(diff / 60)}${t('time.m')} ${t('time.ago')}`;
    return `${Math.floor(diff / 3600)}${t('time.h')} ${t('time.ago')}`;
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: colors.surface, borderColor: colors.primary, borderWidth: 1.2 }
    ]}>
      {/* Header */}
      <LinearGradient
        colors={['#F8F9FF', '#F8F9FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.banner}
      >
        <View style={styles.bannerContent}>
            <Image source={Images.sick} style={styles.bannerIcon} contentFit="contain" />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.bannerTitle, { fontFamily: fontBold, color: colors.text.primary }]}>Umar</Text>
                <Text style={[styles.bannerTag, { fontFamily: fontMedium, color: colors.primary }]}>
                  {tags.length ? tags[0] : '#visitesauxmalades'}
                </Text>
                <View style={{ flex: 1 }} />
                <Pressable style={[styles.pinButton, { backgroundColor: colors.primary }]} onPress={togglePin}>
                  <Ionicons name={isPinned ? 'pin' : 'pin-outline'} size={16} color="#FFF" />
                </Pressable>
              </View>
              <Text style={[styles.bannerTimeLight, { fontFamily: fontRegular, color: colors.text.secondary }]}>
                {formatTime(post.timestamp)}
              </Text>
            </View>
        </View>
        {(currentUser?.id === post.user.id || currentUser?.isAdmin) && (
            <Pressable onPress={handleMore} style={{ padding: 4 }}>
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.text.secondary} />
            </Pressable>
        )}
      </LinearGradient>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <Text style={[styles.patientName, { fontFamily: fontBold, color: colors.text.primary }]}>
            {patientName || 'Un frère/Une soeur'}
        </Text>

        {/* Info Grid */}
        <View style={[styles.infoGrid, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB', borderColor: '#E5E7EB', borderWidth: 1 }]}>
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
                            {ward ? `${ward}, ` : ''}{roomNumber ? `${roomNumber}` : ''}
                        </Text>
                    </View>
                </View>
                </>
            )}
        </View>

        {/* Action Buttons - icons only */}
        <View style={styles.actionRowSingle}>
          <Pressable onPress={() => router.push({ pathname: '/feed/comments/[id]', params: { id: post.id, type: post.type } })} style={styles.iconButton}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
          </Pressable>
          <Pressable onPress={addToAgenda} style={styles.iconButton}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          </Pressable>
          <Pressable onPress={openDirections} style={styles.iconButton}>
            <Ionicons name="navigate" size={18} color={colors.primary} />
          </Pressable>
          <Pressable onPress={handleShare} style={styles.iconButton}>
            <Ionicons name="share-social-outline" size={18} color={colors.primary} />
          </Pressable>
        </View>
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
  pinButton: {
    padding: 6,
    borderRadius: 16,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: 10,
  },
  bannerIcon: {
    width: 36,
    height: 36,
  },
  bannerTitle: {
    fontSize: 15,
  },
  bannerTag: {
    fontSize: 12,
  },
  bannerTimeLight: {
    fontSize: 12,
    marginTop: 2,
  },
  mainContent: {
      padding: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  actionRowSingle: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    justifyContent: 'space-between',
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
});

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';

import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { Post, socialService } from '@/services/socialService';
import { useAppSelector } from '@/store/hooks';

interface PostItemProps {
  post: Post;
}

import { useRouter } from 'expo-router';
// ... imports

import { JanazaPostItem } from '@/components/feed/JanazaPostItem';
import { SickVisitPostItem } from '@/components/feed/SickVisitPostItem';

export function PostItem({ post }: PostItemProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  useEffect(() => {
    socialService.getUser().then((u) => setCurrentUser(u));
  }, []);
  const [currentUser, setCurrentUser] = useState<any>(null); // Simplified checking

  const fontRegular = getFont(currentLanguage, 'regular');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontBold = getFont(currentLanguage, 'bold');

  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [isVisible, setIsVisible] = useState(true);
  const scale = useSharedValue(1);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  if (!isVisible) return null;

  if (post.type === 'janaza') {
    return <JanazaPostItem post={post} onDelete={() => setIsVisible(false)} />;
  }

  if (post.type === 'sick_visit') {
    return <SickVisitPostItem post={post} onDelete={() => setIsVisible(false)} />;
  }

  const handleLike = () => {
    const newState = !isLiked;
    setIsLiked(newState);
    setLikesCount(prev => newState ? prev + 1 : prev - 1);
    
    // Animation
    scale.value = withSequence(
      withSpring(1.2),
      withSpring(1)
    );

    socialService.likePost(post.id);
  };

  const handleShare = () => {
    socialService.sharePost(post.content);
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
                          if (success) setIsVisible(false);
                      }
                  }
              ]
          );
      }
  };

  // Format time relative (simple mock)
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;
    
    if (diff < 60) return t('time.justNow');
    if (diff < 3600) return `${Math.floor(diff / 60)}${t('time.m')} ${t('time.ago')}`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}${t('time.h')} ${t('time.ago')}`;
    return `${Math.floor(diff / 86400)}${t('time.d')} ${t('time.ago')}`;
  };

  const isEvent = post.type === 'event';
  
  return (
    <View style={[
        styles.container, 
        { 
            backgroundColor: colors.surface,
            borderColor: isEvent ? colors.primary : 'rgba(0,0,0,0.05)',
            borderWidth: isEvent ? 1.5 : 1
        }
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <Image 
          source={isEvent ? require('@/assets/images/logo.png') : { uri: post.user.avatar }} 
          style={[styles.avatar, isEvent && styles.eventAvatar]}
          contentFit="cover"
        />
        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { fontFamily: fontBold, color: colors.text.primary }]}>
              {isEvent ? 'UmarApp' : post.user.name}
            </Text>
            {(post.user.isVerified || isEvent) && (
              <Ionicons name="checkmark-circle" size={14} color={colors.primary} style={styles.verifiedIcon} />
            )}
            {isEvent && (
                <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.badgeText, { color: colors.primary, fontFamily: fontMedium }]}>{t('feed.official')}</Text>
                </View>
            )}
          </View>
          <Text style={[styles.time, { fontFamily: fontRegular, color: colors.text.secondary }]}>
            {formatTime(post.timestamp)}
          </Text>
        </View>
        {(currentUser?.id === post.user.id || currentUser?.isAdmin) && (
            <Pressable style={styles.moreButton} onPress={handleMore}>
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.text.secondary} />
            </Pressable>
        )}
      </View>

      {/* Content */}
      <Text style={[styles.content, { fontFamily: fontRegular, color: colors.text.primary }]}>
        {post.content}
      </Text>

      {/* Media Image */}
      {post.image && (
        <Image
          source={{ uri: post.image }}
          style={styles.postImage}
          contentFit="cover"
        />
      )}

      {/* Actions */}
      <View style={[styles.actions, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
        <Pressable onPress={handleLike} style={styles.actionButton}>
          <Animated.View style={heartStyle}>
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={22} 
              color={isLiked ? "#F87171" : colors.text.secondary} 
            />
          </Animated.View>
          <Text style={[styles.actionText, { fontFamily: fontMedium, color: colors.text.secondary }]}>
            {likesCount}
          </Text>
        </Pressable>



        <Pressable onPress={handleShare} style={styles.actionButton}>
          <Ionicons name="share-social-outline" size={20} color={colors.text.secondary} />
          <Text style={[styles.actionText, { fontFamily: fontMedium, color: colors.text.secondary }]}>
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
    borderColor: 'rgba(0,0,0,0.05)', // Subtle border
  },
  header: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEE',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 15,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  time: {
    fontSize: 12,
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    fontSize: 15,
    lineHeight: 22,
  },
  postImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#F3F4F6',
  },
  actions: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 4,
  },
  actionText: {
    fontSize: 13,
  },
  eventAvatar: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  badge: {
     paddingHorizontal: 8,
     paddingVertical: 2,
     borderRadius: 8,
     marginLeft: 8,
  },
  badgeText: {
      fontSize: 10,
      fontWeight: '600',
  }
});

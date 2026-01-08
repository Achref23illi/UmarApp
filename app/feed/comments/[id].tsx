import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { Comment, socialService } from '@/services/socialService';
import { toast } from '@/components/ui/Toast';

// Localization
import i18n from '@/locales/i18n';
import { useAppSelector } from '@/store/hooks';

export default function CommentsScreen() {
  const router = useRouter();
  const { id, type } = useLocalSearchParams<{ id: string, type: string }>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  // Localization
  const currentLanguage = useAppSelector(state => state.language.currentLanguage);
  const t = (key: string) => i18n.t(key, { locale: currentLanguage });

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    socialService.getUser().then(setCurrentUser);
  }, []);

  useEffect(() => {
    if (id) fetchComments();
  }, [id]);

  const fetchComments = async () => {
    if (!id) return;
    setLoading(true);
    const data = await socialService.getComments(id);
    // Sort: approved first, then pending, both by created_at ascending
    const sorted = [...data].sort((a, b) => {
      if (a.is_approved && !b.is_approved) return -1;
      if (!a.is_approved && b.is_approved) return 1;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
    setComments(sorted);
    setLoading(false);
  };

  const handleSend = async () => {
    if (!newComment.trim() || !id) return;

    setSubmitting(true);
    // Pass postType to determine initial approval status
    const addedComment = await socialService.addComment(id, newComment, type);
    if (addedComment) {
      setComments(prev => [...prev, addedComment]);
      setNewComment('');
      
      // If pending, show toast notification
      if (!addedComment.is_approved) {
          toast.show({ type: 'info', message: t('comments.pendingAlert') });
      } else {
          toast.show({ type: 'success', message: t('comments.commentPosted') || 'Comment posted' });
      }
    } else {
      toast.show({ type: 'error', message: t('comments.errorAlert') });
    }
    setSubmitting(false);
  };

  const handleApprove = async (commentId: string) => {
      const success = await socialService.approveComment(commentId);
      if (success) {
          setComments(prev => prev.map(c => c.id === commentId ? { ...c, is_approved: true } : c));
      }
  };

  const handleDelete = async (commentId: string) => {
      const success = await socialService.deleteComment(commentId);
      if (success) {
          setComments(prev => prev.filter(c => c.id !== commentId));
      }
  };

  const renderItem = ({ item }: { item: Comment }) => {
    const isPending = item.is_approved === false;
    const canModerate = currentUser?.isAdmin;
    const isMyComment = currentUser?.id === item.user.id;

    // Filter logic: Only show if approved OR (isPending AND (myComment OR admin))
    // Note: Ideally filtered in backend, but doing client-side filter for robustness here too
    if (isPending && !canModerate && !isMyComment) return null;

    return (
      <View style={[
          styles.commentItem, 
          { borderBottomColor: colors.border },
          isPending && { opacity: 0.7, backgroundColor: isDark ? 'rgba(255,255,0,0.05)' : 'rgba(255,255,0,0.1)' }
      ]}>
         <Image source={{ uri: item.user.avatar }} style={styles.avatar} contentFit="cover" />
         <View style={styles.commentContent}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <Text style={[styles.username, { fontFamily: Fonts.semiBold, color: colors.text.primary }]}>
                  {item.user.name}
                </Text>
                {isPending && (
                    <View style={styles.pendingBadge}>
                        <Text style={styles.pendingText}>{t('comments.pending')}</Text>
                    </View>
                )}
            </View>
            <Text style={[styles.commentText, { fontFamily: Fonts.regular, color: colors.text.primary }]}>
              {item.content}
            </Text>
            
            {/* Admin Controls */}
            {canModerate && isPending && (
                <View style={styles.adminControls}>
                    <Pressable onPress={() => handleApprove(item.id)} style={[styles.adminBtn, { backgroundColor: '#10B981' }]}>
                        <Ionicons name="checkmark" size={16} color="white" />
                        <Text style={styles.adminBtnText}>{t('comments.approve')}</Text>
                    </Pressable>
                    <Pressable onPress={() => handleDelete(item.id)} style={[styles.adminBtn, { backgroundColor: '#EF4444' }]}>
                        <Ionicons name="trash" size={16} color="white" />
                        <Text style={styles.adminBtnText}>{t('comments.delete')}</Text>
                    </Pressable>
                </View>
            )}
         </View>
      </View>
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.surface }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
           <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { fontFamily: Fonts.bold, color: colors.text.primary }]}>
           {type === 'janaza' || type === 'sick_visit' ? t('comments.moderatedTitle') : t('comments.pageTitle')}
        </Text>
        <View style={{ width: 40 }} /> 
      </View>

      {/* Admin Verification Banner */}
      {(type === 'janaza' || type === 'sick_visit') && (
        <View style={[styles.adminBanner, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)' }]}>
          <Ionicons name="information-circle" size={18} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.adminBannerText, { fontFamily: Fonts.regular, color: colors.text.primary }]}>
            {t('feed.commentsReviewedByAdmin')}
          </Text>
        </View>
      )}

      <FlatList
        data={comments}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
            !loading ? (
                <Text style={{ textAlign: 'center', marginTop: 40, color: colors.text.secondary, fontFamily: Fonts.regular }}>
                    {t('comments.emptyState')}
                </Text>
            ) : null
        }
        ListFooterComponent={loading ? <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} /> : null}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 10 }]}>
           <TextInput
              style={[styles.input, { backgroundColor: colors.input.background, color: colors.text.primary, borderColor: colors.input.border }]}
              placeholder={t('comments.placeholder')}
              placeholderTextColor={colors.input.placeholder}
              value={newComment}
              onChangeText={setNewComment}
           />
           <Pressable onPress={handleSend} disabled={submitting || !newComment.trim()} style={styles.sendButton}>
              {submitting ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="send" size={24} color={newComment.trim() ? colors.primary : colors.text.disabled} />
              )}
           </Pressable>
        </View>
      </KeyboardAvoidingView>
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  adminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  adminBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    backgroundColor: '#EEE',
  },
  commentContent: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    marginBottom: 4,
  },
  commentText: {
    fontSize: 15,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  sendButton: {
    padding: 8,
  },
  pendingBadge: {
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: '#F59E0B',
  },
  pendingText: {
      fontSize: 10,
      color: '#D97706',
      fontWeight: '600',
  },
  adminControls: {
      flexDirection: 'row',
      marginTop: 8,
      gap: 8,
  },
  adminBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      gap: 4,
  },
  adminBtnText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
  }
});

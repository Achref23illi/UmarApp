import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  type AppNotification,
} from '@/store/slices/notificationsSlice';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'À l\'instant';
  if (minutes < 60) return `Il y a ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

function NotificationItem({
  item,
  onPress,
  colors,
}: {
  item: AppNotification;
  onPress: () => void;
  colors: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.notifItem,
        {
          backgroundColor: item.is_read
            ? 'transparent'
            : colors.primary + '08',
          borderBottomColor: colors.border || 'rgba(0,0,0,0.06)',
        },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: colors.primary + '15' },
        ]}
      >
        <Ionicons
          name="notifications"
          size={20}
          color={colors.primary}
        />
      </View>
      <View style={styles.notifContent}>
        <View style={styles.notifHeader}>
          <Text
            style={[
              styles.notifTitle,
              { color: colors.text.primary },
              !item.is_read && styles.unreadTitle,
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {!item.is_read && (
            <View
              style={[styles.unreadDot, { backgroundColor: colors.primary }]}
            />
          )}
        </View>
        <Text
          style={[styles.notifBody, { color: colors.text.secondary }]}
          numberOfLines={2}
        >
          {item.body}
        </Text>
        <Text style={[styles.notifTime, { color: colors.text.tertiary || colors.text.secondary }]}>
          {timeAgo(item.created_at)}
        </Text>
      </View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const { items, isLoading, unreadCount } = useAppSelector(
    (s) => s.notifications
  );

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleRefresh = useCallback(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleMarkAsRead = useCallback(
    (id: string) => {
      dispatch(markAsRead(id));
    },
    [dispatch]
  );

  const handleMarkAllRead = useCallback(() => {
    dispatch(markAllAsRead());
  }, [dispatch]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border || 'rgba(0,0,0,0.05)' }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Notifications
        </Text>
        <View style={{ flex: 1 }} />
        {unreadCount > 0 && (
          <Pressable onPress={handleMarkAllRead} style={styles.markAllBtn}>
            <Text style={[styles.markAllText, { color: colors.primary }]}>
              Tout lire
            </Text>
          </Pressable>
        )}
      </View>

      {isLoading && items.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons
            name="notifications-off-outline"
            size={64}
            color={colors.text.secondary}
          />
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            Aucune notification
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem
              item={item}
              onPress={() => handleMarkAsRead(item.id)}
              colors={colors}
            />
          )}
          onRefresh={handleRefresh}
          refreshing={isLoading}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  markAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
  },
  notifItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: {
    flex: 1,
    gap: 4,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifTitle: {
    fontSize: 15,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  notifBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  notifTime: {
    fontSize: 12,
    marginTop: 2,
  },
});

import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type AdminScreenProps = {
  title: string;
  right?: React.ReactNode;
  scroll?: boolean;
  children: React.ReactNode;
};

export function AdminScreen({ title, right, scroll = true, children }: AdminScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const content = scroll ? (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, { paddingBottom: insets.bottom + 24 }]}>{children}</View>
  );

  return (
    <View style={[styles.container, { backgroundColor: '#F6F8FB' }]}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 12, backgroundColor: '#FFFFFF', borderBottomColor: '#E7ECF3' },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text.primary }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.right}>{right || <View style={{ width: 44 }} />}</View>
      </View>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    marginHorizontal: 10,
  },
  right: {
    minWidth: 44,
    alignItems: 'flex-end',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 12,
  },
});

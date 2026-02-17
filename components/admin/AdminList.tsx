import { useTheme } from '@/hooks/use-theme';
import React from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

type AdminListProps<T> = {
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactElement;
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  emptyText?: string;
};

export function AdminList<T>({
  data,
  keyExtractor,
  renderItem,
  loading = false,
  refreshing = false,
  onRefresh,
  emptyText = 'No data',
}: AdminListProps<T>) {
  const { colors } = useTheme();

  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentContainerStyle={[styles.content, !data.length && styles.emptyContent]}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        ) : undefined
      }
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
        ) : (
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>{emptyText}</Text>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 16,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
  },
});

import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

type FilterOption = {
  key: string;
  label: string;
};

type AdminFiltersProps = {
  search?: string;
  onChangeSearch?: (value: string) => void;
  options?: FilterOption[];
  activeKey?: string;
  onChangeOption?: (key: string) => void;
};

export function AdminFilters({
  search,
  onChangeSearch,
  options = [],
  activeKey,
  onChangeOption,
}: AdminFiltersProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {onChangeSearch ? (
        <View style={[styles.searchWrap, { backgroundColor: '#FFFFFF', borderColor: '#E4E9F1' }]}>
          <Ionicons name="search" size={18} color={colors.text.secondary} />
          <TextInput
            value={search}
            onChangeText={onChangeSearch}
            placeholder="Search"
            placeholderTextColor={colors.text.secondary}
            style={[styles.searchInput, { color: colors.text.primary }]}
          />
        </View>
      ) : null}

      {options.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsWrap}
        >
          {options.map((option) => {
            const active = activeKey === option.key;
            return (
              <Pressable
                key={option.key}
                onPress={() => onChangeOption?.(option.key)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.primary : '#FFFFFF',
                    borderColor: active ? colors.primary : '#E4E9F1',
                  },
                ]}
              >
                <Text
                  style={{
                    color: active ? '#FFFFFF' : colors.text.primary,
                    fontWeight: '600',
                    fontSize: 13,
                  }}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  chipsWrap: {
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 14,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

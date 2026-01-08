import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/config/colors';
import { Fonts } from '@/hooks/use-fonts';
import { useAppSelector } from '@/store/hooks';

export type AuthTabKey = 'register' | 'login';

type Props = {
  active: AuthTabKey;
  onChange: (tab: AuthTabKey) => void;
  labels: { register: string; login: string };
};

const WHITE = Colors.palette.neutral.white;

export function AuthTabs({ active, onChange, labels }: Props) {
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const isRTL = currentLanguage === 'ar';
  const fontSemiBold = isRTL ? Fonts.arabicSemiBold : Fonts.semiBold;
  const fontMedium = isRTL ? Fonts.arabicMedium : Fonts.medium;

  return (
    <View style={[styles.container, isRTL && styles.containerRtl]}>
      <Pressable
        onPress={() => onChange('register')}
        style={({ pressed }) => [
          styles.tab,
          active === 'register' && styles.tabActive,
          pressed && styles.tabPressed,
        ]}
      >
        <Text
          style={[
            styles.tabText,
            { fontFamily: active === 'register' ? fontSemiBold : fontMedium },
            active === 'register' ? styles.tabTextActive : styles.tabTextInactive,
          ]}
        >
          {labels.register}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => onChange('login')}
        style={({ pressed }) => [
          styles.tab,
          active === 'login' && styles.tabActive,
          pressed && styles.tabPressed,
        ]}
      >
        <Text
          style={[
            styles.tabText,
            { fontFamily: active === 'login' ? fontSemiBold : fontMedium },
            active === 'login' ? styles.tabTextActive : styles.tabTextInactive,
          ]}
        >
          {labels.login}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    padding: 6,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  containerRtl: {
    flexDirection: 'row-reverse',
  },
  tab: {
    flex: 1,
    height: 44,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  tabPressed: {
    opacity: 0.92,
  },
  tabText: {
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  tabTextActive: {
    color: WHITE,
  },
  tabTextInactive: {
    color: 'rgba(255,255,255,0.70)',
  },
});


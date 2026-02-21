import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import Animated, {
  Extrapolation,
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Images } from '@/config/assets';
import { Colors } from '@/config/colors';
import { Fonts } from '@/hooks/use-fonts';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { LanguageCode, setLanguage } from '@/store/slices/languageSlice';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// App colors
const PRIMARY = Colors.palette.purple.primary; // #670FA4
const GOLD = Colors.palette.gold.primary; // #F5C661
const GRAY_TEXT = Colors.palette.neutral.gray700;
const GRAY_LIGHT = Colors.palette.neutral.gray400;
const WHITE = '#FFFFFF';

interface Slide {
  id: string;
  illustration: any;
  translationKey: string;
}

export default function WelcomeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const isRTL = currentLanguage === 'ar';

  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useSharedValue(0);

  // Fonts
  const fontRegular = isRTL ? Fonts.arabicRegular : Fonts.regular;
  const fontMedium = isRTL ? Fonts.arabicMedium : Fonts.medium;
  const fontSemiBold = isRTL ? Fonts.arabicSemiBold : Fonts.semiBold;
  const fontBold = isRTL ? Fonts.arabicBold : Fonts.bold;

  const slides: Slide[] = [
    { id: '1', illustration: Images.illustration1, translationKey: '1' },
    { id: '2', illustration: Images.illustration2, translationKey: '2' },
    { id: '3', illustration: Images.illustration3, translationKey: '3' },
  ];

  // Language cycling
  const languages: LanguageCode[] = ['en', 'fr', 'ar'];
  const languageLabels: Record<string, string> = { en: 'EN', fr: 'FR', ar: 'ع' };

  const cycleLanguage = () => {
    const currentIdx = languages.indexOf(currentLanguage);
    const nextIdx = (currentIdx + 1) % languages.length;
    const nextLang = languages[nextIdx];
    dispatch(setLanguage(nextLang));
    i18n.changeLanguage(nextLang);
  };

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      router.push('/auth/register');
    }
  };

  const handleSkip = () => {
    router.push('/auth/login');
  };

  // Pagination Dot Component
  const PaginationDot = ({ index }: { index: number }) => {
    const animatedStyle = useAnimatedStyle(() => {
      const width = interpolate(
        scrollX.value,
        [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
        [8, 24, 8],
        Extrapolation.CLAMP
      );
      const opacity = interpolate(
        scrollX.value,
        [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
        [0.4, 1, 0.4],
        Extrapolation.CLAMP
      );
      return { width, opacity };
    });
    return <Animated.View style={[styles.dot, animatedStyle]} />;
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        {/* Placeholder for balance */}
        <View style={{ width: 60 }} />

        {/* Centered Logo */}
        <Image
          source={Images.logo}
          style={styles.logoTop}
          contentFit="contain"
        />

        {/* Skip Button */}
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Text style={[styles.skipText, { fontFamily: fontMedium, color: GRAY_TEXT }]}>
            {t('welcome.skip')}
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      <View style={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        {/* Slides */}
        <Animated.FlatList
          ref={flatListRef}
          data={slides}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          bounces={false}
          style={styles.flatList}
          contentContainerStyle={styles.flatListContent}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
              <View style={styles.slideContent}>
                {/* Illustration */}
                <View style={styles.illustrationContainer}>
                  <Image source={item.illustration} style={styles.illustration} contentFit="contain" />
                </View>
                {/* Text */}
                <Text style={[styles.title, { fontFamily: fontBold, color: GRAY_TEXT }]} adjustsFontSizeToFit numberOfLines={2}>
                  {t(`welcome.slides.${item.translationKey}.title`)}
                </Text>
                <Text style={[styles.subtitle, { fontFamily: fontRegular, color: GRAY_LIGHT }]} adjustsFontSizeToFit numberOfLines={3}>
                  {t(`welcome.slides.${item.translationKey}.subtitle`)}
                </Text>
              </View>
            </View>
          )}
        />

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {/* Pagination */}
          <View style={styles.pagination}>
            {slides.map((_, idx) => (
              <PaginationDot key={idx.toString()} index={idx} />
            ))}
          </View>

          {/* Next/Get Started Button */}
          <Pressable onPress={handleNext} style={styles.nextButton}>
            <Text style={[styles.nextButtonText, { fontFamily: fontSemiBold }]} adjustsFontSizeToFit numberOfLines={1}>
              {currentIndex === slides.length - 1 ? t('welcome.getStarted') : t('welcome.next')}
            </Text>
            <Ionicons
              name={currentIndex === slides.length - 1 ? 'rocket-outline' : 'arrow-forward'}
              size={22}
              color={WHITE}
            />
          </Pressable>

          {/* Login Link */}
          <Animated.View entering={FadeInDown.delay(500)}>
            <Pressable onPress={() => router.push('/auth/login')} style={styles.loginLink}>
              <Text style={[styles.loginText, { fontFamily: fontRegular, color: PRIMARY }]} adjustsFontSizeToFit numberOfLines={1}>
                {t('welcome.alreadyHaveAccount')}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 100,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(103, 15, 164, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  langText: {
    fontSize: 14,
  },
  logoTop: {
    width: 60,
    height: 60,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingTop: 110,
  },
  flatList: {
    flex: 1,
    zIndex: 10,
  },
  flatListContent: {
    paddingBottom: 12,
  },
  slide: {
    flex: 1,
    paddingTop: 20,
  },
  slideContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  illustrationContainer: {
    flex: 1,
    width: '100%',
    maxHeight: SCREEN_WIDTH * 0.85,
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  bottomControls: {
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: WHITE,
    paddingTop: 16,
    paddingBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  pagination: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: PRIMARY,
  },
  nextButton: {
    backgroundColor: PRIMARY,
    width: '100%',
    height: 56,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextButtonText: {
    color: WHITE,
    fontSize: 17,
    fontWeight: '600',
  },
  loginLink: {
    paddingVertical: 10,
  },
  loginText: {
    fontSize: 15,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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
import { Fonts } from '@/hooks/use-fonts';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { LanguageCode, setLanguage } from '@/store/slices/languageSlice';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Gold and Black colors
const GOLD = '#F5C661';
const BLACK = '#000000';
const WHITE = '#FFFFFF';

interface Slide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
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
    { id: '1', icon: 'time-outline', translationKey: '1' },
    { id: '2', icon: 'book-outline', translationKey: '2' },
    { id: '3', icon: 'people-outline', translationKey: '3' },
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
      {/* Background Image */}
      <Image source={Images.welcomeBackground} style={styles.backgroundImage} contentFit="cover" />

      {/* Gradient Overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.85)', BLACK]}
        locations={[0, 0.35, 0.65, 1]}
        style={styles.gradient}
        pointerEvents="none"
      />

      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        {/* Language Switcher */}
        <Pressable onPress={cycleLanguage} style={styles.langButton}>
          <Ionicons name="globe-outline" size={20} color={WHITE} />
          <Text style={[styles.langText, { fontFamily: fontMedium }]}>
            {languageLabels[currentLanguage]}
          </Text>
        </Pressable>

        {/* Centered Logo */}
        <Image 
          source={Images.logoWhite} 
          style={styles.logoTop} 
          contentFit="contain" 
        />

        {/* Skip Button */}
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Text style={[styles.skipText, { fontFamily: fontMedium }]}>
            {t('welcome.skip')}
          </Text>
        </Pressable>
      </View>

      {/* Calligraphy */}
      <View style={styles.calligraphyContainer} pointerEvents="none">
        <Text style={[styles.calligraphy, { fontFamily: Fonts.arabicBold }]}>بِسْمِ اللَّهِ</Text>
      </View>

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
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <View style={styles.slideContent}>
              {/* Icon with glow */}
              <View style={styles.iconWrapper}>
                <View style={styles.iconGlow} />
                <Ionicons name={item.icon} size={80} color={GOLD} />
              </View>
              {/* Text */}
              <Text style={[styles.title, { fontFamily: fontBold }]}>
                {t(`welcome.slides.${item.translationKey}.title`)}
              </Text>
              <Text style={[styles.subtitle, { fontFamily: fontRegular }]}>
                {t(`welcome.slides.${item.translationKey}.subtitle`)}
              </Text>
            </View>
          </View>
        )}
      />

      {/* Bottom Controls */}
      <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 24 }]}>
        {/* Pagination */}
        <View style={styles.pagination}>
          {slides.map((_, idx) => (
            <PaginationDot key={idx.toString()} index={idx} />
          ))}
        </View>

        {/* Next/Get Started Button */}
        <Pressable onPress={handleNext} style={styles.nextButton}>
          <Text style={[styles.nextButtonText, { fontFamily: fontSemiBold }]}>
            {currentIndex === slides.length - 1 ? t('welcome.getStarted') : t('welcome.next')}
          </Text>
          <Ionicons
            name={currentIndex === slides.length - 1 ? 'rocket-outline' : 'arrow-forward'}
            size={22}
            color={BLACK}
          />
        </Pressable>

        {/* Login Link */}
        {currentIndex === 0 && (
          <Animated.View entering={FadeInDown.delay(500)}>
            <Pressable onPress={() => router.push('/auth/login')} style={styles.loginLink}>
              <Text style={[styles.loginText, { fontFamily: fontRegular }]}>
                {t('welcome.alreadyHaveAccount')}
              </Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BLACK,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
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
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  langText: {
    color: WHITE,
    fontSize: 14,
  },
  logoTop: {
    width: 70,
    height: 70,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
  },
  calligraphyContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.18,
    left: 0,
    right: 0,
    alignItems: 'center',
    opacity: 0.5,
  },
  calligraphy: {
    fontSize: 30,
    color: GOLD,
  },
  flatList: {
    flex: 1,
    zIndex: 10,
  },
  slide: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  slideContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 200,
  },
  iconWrapper: {
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: GOLD,
    opacity: 0.15,
  },
  title: {
    fontSize: 26,
    color: WHITE,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: GOLD,
  },
  nextButton: {
    backgroundColor: GOLD,
    width: '100%',
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonText: {
    color: BLACK,
    fontSize: 18,
  },
  loginLink: {
    paddingVertical: 8,
  },
  loginText: {
    color: WHITE,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

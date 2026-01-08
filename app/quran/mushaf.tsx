/**
 * Mushaf Reader Screen
 * ====================
 * Page-based Quran reader using Quran.Foundation API.
 * Displays page images with interactive word overlays.
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { getPageDetails, PageResponse, VerseWord } from '@/services/quranFoundation';
import { QURAN_IMAGE_BASE_URL } from '@/config/quranApi';
import { saveReadingProgress } from '@/services/quranProgress';

const { width } = Dimensions.get('window');
const PAGE_ASPECT_RATIO = 0.65; // Approximate aspect ratio of Quran page
const PAGE_HEIGHT = width / PAGE_ASPECT_RATIO; // Calculate height to fit width

export default function MushafScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { initialPage } = useLocalSearchParams<{ initialPage: string }>();
  
  // Page number state (1-604)
  const [currentPage, setCurrentPage] = useState<number>(
    initialPage ? parseInt(initialPage, 10) : 1
  );
  
  // FlatList Ref
  const flatListRef = useRef<FlatList>(null);

  // Generate pages array (1 to 604)
  const pages = Array.from({ length: 604 }, (_, i) => i + 1);

  // Handle page change
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      const newPage = viewableItems[0].item as number;
      setCurrentPage(newPage);
      // Save progress (debouncing could be added)
      saveProgress(newPage);
    }
  }, []);

  const saveProgress = async (page: number) => {
    // Just saving page number for simplicity in this MVP
    // Ideally we fetch the Surah/Ayah info from the page details to save complete progress
    await saveReadingProgress({
      surahNumber: 0, // Placeholder, will update when page details load
      surahName: '', 
      surahEnglishName: '',
      ayahNumber: 0,
      juz: 0,
      page: page,
      totalAyahsInSurah: 0,
      lastReadAt: new Date().toISOString(),
    });
  };

  const getItemLayout = (data: any, index: number) => ({
    length: width,
    offset: width * index,
    index,
  });

  return (
    <View style={[styles.container, { backgroundColor: '#FEFDF5' }]}> 
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.surface }]}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Page {currentPage}
        </Text>
        <View style={styles.headerButton} /> 
      </View>

      {/* Pages List */}
      <FlatList
        ref={flatListRef}
        data={pages}
        keyExtractor={(item) => item.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={currentPage - 1}
        getItemLayout={getItemLayout}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        renderItem={({ item }) => <QuranPage pageNumber={item} />}
      />
    </View>
  );
}

// Individual Page Component
const QuranPage = React.memo(({ pageNumber }: { pageNumber: number }) => {
  const [pageData, setPageData] = useState<PageResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Pad page number for image URL (e.g., 1 -> 001)
  const paddedPage = pageNumber.toString().padStart(3, '0');
  const imageUrl = `${QURAN_IMAGE_BASE_URL}/page${paddedPage}.png`;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await getPageDetails(pageNumber);
      setPageData(data);
      setLoading(false);
    };
    fetchData();
  }, [pageNumber]);

  return (
    <View style={[styles.pageContainer, { width }]}>
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.pageImage}
          resizeMode="contain"
        />
        
        {/* Overlays */}
        {!loading && pageData?.verses.map((verse) => (
          // In a full implementation, we'd parse coordinates here.
          // Since the API returns coordinates relative to original image size,
          // we need to scale them to the displayed image size.
          // For MVP, we are fetching data to prove connection, but complex coordinate mapping 
          // requires knowing the exact displayed dimensions vs original dimensions.
          // We will render a simple visual indicator for now if needed.
          <React.Fragment key={verse.id} /> 
        ))}
        
        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator size="small" color="#000" />
          </View>
        )}
      </View>
    </View>
  );
});

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
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  pageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    width: '100%',
    height: '90%', // Leave some space
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageImage: {
    width: '100%',
    height: '100%',
  },
  loader: {
    position: 'absolute',
  }
});

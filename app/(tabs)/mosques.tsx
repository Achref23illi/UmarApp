/**
 * Mosques Screen
 * ===============
 * Full screen Mapbox map with mosque markers and search modal.
 */

import { Ionicons } from '@expo/vector-icons';
import Mapbox from '@rnmapbox/maps';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import Animated, { SlideInDown, SlideInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { socialService } from '@/services/socialService';
import { useAppSelector } from '@/store/hooks';

// Initialize Mapbox with public access token
Mapbox.setAccessToken('process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || ');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Mosque {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distance?: number;
  address?: string;
  hasWomenSection?: boolean;
  hasQuranSession?: boolean;
  capacity?: string;
  adminPinned?: boolean;
  images?: string[];
}

export default function MosquesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  
  const fontRegular = getFont(currentLanguage, 'regular');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontSemiBold = getFont(currentLanguage, 'semiBold');
  const fontBold = getFont(currentLanguage, 'bold');

  const [loading, setLoading] = useState(true);
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [filteredMosques, setFilteredMosques] = useState<Mosque[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedMosque, setSelectedMosque] = useState<Mosque | null>(null);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<Mapbox.MapView>(null);
  const cameraRef = useRef<Mapbox.Camera>(null);

  useEffect(() => {
    initializeMap();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = mosques.filter(m => 
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMosques(filtered);
    } else {
      setFilteredMosques(mosques);
    }
  }, [searchQuery, mosques]);

  const initializeMap = async () => {
    try {
      setLoading(true);
      setError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission is required');
        setLoading(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = position.coords;
      setUserLocation({ lat: latitude, lng: longitude });

      // Fetch mosques using Nominatim API (OpenStreetMap)
      await fetchMosquesNominatim(latitude, longitude);

    } catch (err) {
      console.error('Init error:', err);
      setError('Unable to initialize map');
    } finally {
      setLoading(false);
    }
  };

  const fetchMosquesNominatim = async (lat: number, lng: number) => {
    try {
      // Use Nominatim search API to find mosques
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=mosque&format=json&limit=50&` +
        `viewbox=${lng - 0.1},${lat + 0.1},${lng + 0.1},${lat - 0.1}&bounded=1`,
        {
          headers: {
            'User-Agent': 'UmarApp/1.0'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      
      const mosquesList: Mosque[] = data.map((item: any, index: number) => ({
        id: item.place_id?.toString() || `mosque-${index}`,
        name: item.display_name?.split(',')[0] || `Mosque ${index + 1}`,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        address: item.display_name,
        distance: calculateDistance(lat, lng, parseFloat(item.lat), parseFloat(item.lon)),
      })).sort((a: Mosque, b: Mosque) => (a.distance || 0) - (b.distance || 0));

      setMosques(mosquesList);
      setFilteredMosques(mosquesList);

      // Fetch curated mosques from backend
      try {
           const curated = await socialService.getMosques();
           const curatedWithDistance = curated.map((m: any) => ({
               ...m,
               distance: calculateDistance(lat, lng, m.latitude, m.longitude)
           }));

           // Combine: Curated FIRST, then generic
           const combined = [...curatedWithDistance, ...mosquesList].sort((a, b) => (a.distance || 0) - (b.distance || 0));
           setMosques(combined);
           setFilteredMosques(combined);
      } catch (e) {
          console.log("Failed to load curated mosques", e);
      }

    } catch (err) {
      console.error('Nominatim error:', err);
      // Fallback: show curated mosques only (no hardcoded samples)
      const curated = await socialService.getMosques();
      const curatedWithDistance = curated
        .map((m: any) => ({
          ...m,
          distance: calculateDistance(lat, lng, m.latitude, m.longitude),
        }))
        .sort((a: any, b: any) => (a.distance || 0) - (b.distance || 0));

      setMosques(curatedWithDistance);
      setFilteredMosques(curatedWithDistance);
      setError(curatedWithDistance.length > 0 ? null : 'Unable to load mosques');
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const formatDistance = (km: number) => {
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
  };

  const openNavigation = (mosque: Mosque) => {
    const url = Platform.select({
      ios: `maps:?daddr=${mosque.latitude},${mosque.longitude}&dirflg=d`,
      android: `geo:${mosque.latitude},${mosque.longitude}?q=${mosque.latitude},${mosque.longitude}(${encodeURIComponent(mosque.name)})`,
    });
    
    if (url) {
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${mosque.latitude},${mosque.longitude}`);
      });
    }
    setSelectedMosque(null);
  };

  const focusOnMosque = (mosque: Mosque) => {
    setSearchModalVisible(false);
    cameraRef.current?.setCamera({
      centerCoordinate: [mosque.longitude, mosque.latitude],
      zoomLevel: 16,
      animationDuration: 1000,
    });
    setTimeout(() => setSelectedMosque(mosque), 500);
  };

  const centerOnUser = () => {
    if (userLocation) {
      cameraRef.current?.setCamera({
        centerCoordinate: [userLocation.lng, userLocation.lat],
        zoomLevel: 14,
        animationDuration: 1000,
      });
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { fontFamily: fontMedium, color: colors.text.secondary }]}>
          Finding nearby mosques...
        </Text>
      </View>
    );
  }

  if (error && !userLocation) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle" size={64} color={colors.text.disabled} />
        <Text style={[styles.errorText, { fontFamily: fontMedium, color: colors.text.primary }]}>
          {error}
        </Text>
        <Pressable onPress={initializeMap} style={[styles.retryButton, { backgroundColor: colors.primary }]}>
          <Text style={[styles.retryText, { fontFamily: fontSemiBold }]}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Full Screen Map */}
      {userLocation && (
        <Mapbox.MapView
          ref={mapRef}
          style={styles.map}
          styleURL={isDark ? Mapbox.StyleURL.Dark : Mapbox.StyleURL.Street}
          logoEnabled={false}
          attributionEnabled={false}
          compassEnabled={true}
          compassPosition={{ top: insets.top + 60, right: 16 }}
        >
          <Mapbox.Camera
            ref={cameraRef}
            zoomLevel={14}
            centerCoordinate={[userLocation.lng, userLocation.lat]}
            animationMode="flyTo"
          />
          
          {/* User Location */}
          <Mapbox.UserLocation 
            visible={true}
            showsUserHeadingIndicator={true}
          />
          
          {/* Mosque Markers */}
          {mosques.map((mosque) => (
            <Mapbox.MarkerView
              key={mosque.id}
              id={mosque.id}
              coordinate={[mosque.longitude, mosque.latitude]}
              anchor={{ x: 0.5, y: 1 }}
            >
              <Pressable 
                onPress={() => setSelectedMosque(mosque)}
                style={styles.markerTouchable}
              >
                {mosque.adminPinned && (
                    <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark" size={12} color="#FFF" />
                    </View>
                )}
                <Image
                  source={require('@/assets/images/mosque-marker.png')}
                  style={[
                    styles.mosqueMarkerImage,
                    selectedMosque?.id === mosque.id && styles.mosqueMarkerSelected
                  ]}
                  resizeMode="contain"
                />
              </Pressable>
            </Mapbox.MarkerView>
          ))}
        </Mapbox.MapView>
      )}

      {/* Header Overlay */}
      <View style={[styles.headerOverlay, { paddingTop: insets.top + 8 }]}>
        <Pressable 
          onPress={() => router.back()} 
          style={[styles.headerButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        
        <Pressable 
          onPress={() => setSearchModalVisible(true)}
          style={[styles.searchBar, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="search" size={20} color={colors.text.secondary} />
          <Text style={[styles.searchPlaceholder, { fontFamily: fontRegular, color: colors.text.secondary }]}>
            Search mosques...
          </Text>
        </Pressable>
      </View>

      {/* Floating Action Buttons */}
      <View style={[styles.fabContainer, { bottom: insets.bottom + 100 }]}>
        <Pressable 
          onPress={centerOnUser}
          style={[styles.fab, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="locate" size={24} color={colors.primary} />
        </Pressable>
      </View>

      {/* Bottom Info Card */}
      <Animated.View 
        entering={SlideInUp}
        style={[styles.bottomCard, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}
      >
        <Text style={[styles.bottomCardTitle, { fontFamily: fontSemiBold, color: colors.text.primary }]}>
          {mosques.length} Mosques Nearby
        </Text>
        <Text style={[styles.bottomCardSubtitle, { fontFamily: fontRegular, color: colors.text.secondary }]}>
          Tap a marker to see details
        </Text>
      </Animated.View>

      {/* Selected Mosque Modal */}
      <Modal
        visible={selectedMosque !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedMosque(null)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setSelectedMosque(null)}
        >
          <Pressable style={[styles.detailModal, { backgroundColor: colors.background, paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />
            
            {selectedMosque && (
              <>
                <LinearGradient
                  colors={['#E65100', '#F57C00']}
                  style={styles.modalIcon}
                >
                  <Ionicons name="location" size={32} color="#FFF" />
                </LinearGradient>
                
                <View style={styles.modalTitleContainer}>
                    <Text style={[styles.modalName, { fontFamily: fontBold, color: colors.text.primary }]}>
                    {selectedMosque.name}
                    </Text>
                    {selectedMosque.adminPinned && (
                        <View style={styles.verifiedRow}>
                            <Ionicons name="checkmark-circle" size={14} color="#4ade80" />
                            <Text style={[styles.verifiedText, { fontFamily: fontMedium, color: colors.text.secondary }]}>Verified</Text>
                        </View>
                    )}
                </View>

                {/* Extended Details */}
                {selectedMosque.adminPinned && (
                    <View style={styles.modalDetails}>
                        <View style={styles.badgesRow}>
                             {selectedMosque.hasWomenSection && (
                                 <View style={[styles.badge, { backgroundColor: colors.surfaceHighlight }]}>
                                     <Ionicons name="woman" size={14} color={colors.primary} />
                                     <Text style={[styles.badgeText, { color: colors.text.primary, fontFamily: fontMedium }]}>Women's Area</Text>
                                 </View>
                             )}
                             {selectedMosque.hasQuranSession && (
                                 <View style={[styles.badge, { backgroundColor: colors.surfaceHighlight }]}>
                                     <Ionicons name="book" size={14} color={colors.primary} />
                                     <Text style={[styles.badgeText, { color: colors.text.primary, fontFamily: fontMedium }]}>Quran Classes</Text>
                                 </View>
                             )}
                        </View>
                        <View style={styles.divider} />
                         {selectedMosque.images && selectedMosque.images[0] && (
                             <Image 
                                source={{ uri: selectedMosque.images[0] }} 
                                style={{ width: '100%', height: 180, borderRadius: 16, marginBottom: 20 }}
                                resizeMode="cover"
                             />
                         )}
                    </View>
                )}
                
                <View style={styles.modalDistance}>
                  <Ionicons name="navigate" size={18} color={colors.secondary} />
                  <Text style={[styles.modalDistanceText, { fontFamily: fontMedium, color: colors.text.secondary }]}>
                    {selectedMosque.distance ? formatDistance(selectedMosque.distance) : '--'} away
                  </Text>
                </View>
                
                <View style={styles.modalActions}>
                  <Pressable 
                    onPress={() => openNavigation(selectedMosque)}
                    style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                  >
                    <Ionicons name="navigate" size={20} color="#FFF" />
                    <Text style={[styles.primaryButtonText, { fontFamily: fontSemiBold }]}>
                      Get Directions
                    </Text>
                  </Pressable>
                  
                  <Pressable 
                    onPress={() => setSelectedMosque(null)}
                    style={[styles.secondaryButton, { backgroundColor: colors.surface, borderColor: isDark ? '#374151' : '#E5E7EB' }]}
                  >
                    <Text style={[styles.secondaryButtonText, { fontFamily: fontMedium, color: colors.text.primary }]}>
                      Close
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Search Modal */}
      <Modal
        visible={searchModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSearchModalVisible(false)}
      >
        <View style={[styles.searchModalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <Animated.View 
            entering={SlideInDown.springify()}
            style={[styles.searchModal, { backgroundColor: colors.background, paddingTop: insets.top + 20 }]}
          >
            {/* Search Header */}
            <View style={styles.searchHeader}>
              <View style={[styles.searchInputContainer, { backgroundColor: colors.surface }]}>
                <Ionicons name="search" size={20} color={colors.text.secondary} />
                <TextInput
                  style={[styles.searchInput, { fontFamily: fontRegular, color: colors.text.primary }]}
                  placeholder="Search mosques..."
                  placeholderTextColor={colors.text.disabled}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
                  </Pressable>
                )}
              </View>
              <Pressable 
                onPress={() => setSearchModalVisible(false)}
                style={styles.cancelButton}
              >
                <Text style={[styles.cancelText, { fontFamily: fontMedium, color: colors.primary }]}>
                  Cancel
                </Text>
              </Pressable>
            </View>

            {/* Search Results */}
            <FlatList
              data={filteredMosques}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.searchResultsContent}
              renderItem={({ item }) => (
                <Pressable 
                  onPress={() => focusOnMosque(item)}
                  style={[styles.searchResultItem, { backgroundColor: colors.surface }]}
                >
                  <View style={styles.searchResultIcon}>
                    <Ionicons name="location" size={20} color="#E65100" />
                  </View>
                  <View style={styles.searchResultInfo}>
                    <Text style={[styles.searchResultName, { fontFamily: fontSemiBold, color: colors.text.primary }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.searchResultDistance, { fontFamily: fontRegular, color: colors.text.secondary }]}>
                      {item.distance ? formatDistance(item.distance) : '--'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.text.disabled} />
                </Pressable>
              )}
              ListEmptyComponent={
                <View style={styles.emptyResults}>
                  <Ionicons name="search" size={48} color={colors.text.disabled} />
                  <Text style={[styles.emptyText, { fontFamily: fontMedium, color: colors.text.secondary }]}>
                    No mosques found
                  </Text>
                </View>
              }
            />
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  errorText: {
    fontSize: 15,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginTop: 8,
  },
  retryText: {
    color: '#FFF',
    fontSize: 15,
  },
  map: {
    flex: 1,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    zIndex: 10,
  },
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchPlaceholder: {
    fontSize: 15,
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    gap: 12,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 20,
    paddingHorizontal: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  bottomCardTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  bottomCardSubtitle: {
    fontSize: 13,
  },
  markerTouchable: {
    alignItems: 'center',
  },
  mosqueMarkerImage: {
    width: 48,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  mosqueMarkerSelected: {
    width: 60,
    height: 60,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  detailModal: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    alignItems: 'center',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 2,
    marginBottom: 24,
  },
  modalIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalName: {
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalDistance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 28,
  },
  modalDistanceText: {
    fontSize: 15,
  },
  modalActions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 15,
  },
  verifiedBadge: {
      position: 'absolute',
      top: -6,
      right: -6,
      backgroundColor: '#4ade80',
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
      borderWidth: 2,
      borderColor: '#FFF',
  },
  modalHeaderRow: {
      alignItems: 'center',
      marginBottom: 16,
  },
  modalIconSmall: {
      width: 56,
      height: 56,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
  },
  modalTitleContainer: {
      alignItems: 'center',
  },
  verifiedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
      backgroundColor: 'rgba(74, 222, 128, 0.1)',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
  },
  verifiedText: {
      fontSize: 11,
  },
  badgesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 20,
  },
  badge: {
     flexDirection: 'row',
     alignItems: 'center',
     gap: 6,
     paddingHorizontal: 12,
     paddingVertical: 8,
     borderRadius: 12,
  },
  badgeText: {
      fontSize: 12,
  },
  divider: {
      width: '100%',
      height: 1,
      backgroundColor: 'rgba(0,0,0,0.05)',
      marginBottom: 20,
  },
  modalDetails: {
      width: '100%',
      gap: 12,
      marginBottom: 24,
  },
  detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
  },
  detailText: {
      fontSize: 15,
  },
  searchModalContainer: {
    flex: 1,
  },
  searchModal: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: 60,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  cancelButton: {
    paddingHorizontal: 8,
  },
  cancelText: {
    fontSize: 15,
  },
  searchResultsContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 10,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 14,
  },
  searchResultIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(230, 81, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 15,
    marginBottom: 2,
  },
  searchResultDistance: {
    fontSize: 13,
  },
  emptyResults: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
});

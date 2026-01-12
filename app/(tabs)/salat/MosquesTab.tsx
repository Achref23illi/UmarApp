/**
 * Mosques Tab
 * ============
 * List of nearby mosques with detailed cards
 */

import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Linking from 'expo-linking';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { socialService, Mosque } from '@/services/socialService';
import { useAppSelector } from '@/store/hooks';

export function MosquesTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  
  const fontRegular = getFont(currentLanguage, 'regular');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontSemiBold = getFont(currentLanguage, 'semiBold');
  const fontBold = getFont(currentLanguage, 'bold');

  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedMosque, setSelectedMosque] = useState<Mosque | null>(null);

  useEffect(() => {
    fetchMosques();
  }, []);

  const fetchMosques = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoading(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = position.coords;
      setUserLocation({ lat: latitude, lng: longitude });

      // Fetch mosques from service
      const mosquesList = await socialService.getMosques();
      
      // Calculate distances
      const mosquesWithDistance = mosquesList.map((mosque) => ({
        ...mosque,
        distance: calculateDistance(latitude, longitude, mosque.latitude, mosque.longitude),
      })).sort((a, b) => (a.distance || 0) - (b.distance || 0));

      setMosques(mosquesWithDistance);
    } catch (error) {
      console.error('Error fetching mosques:', error);
    } finally {
      setLoading(false);
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
  };

  const shareMosque = async (mosque: Mosque) => {
    try {
      const message = `${mosque.name}\n${mosque.address}\n\n${mosque.latitude}, ${mosque.longitude}`;
      await Share.share({
        message,
      });
    } catch (error) {
      console.error('Error sharing mosque:', error);
    }
  };

  const getNextPrayerTime = () => {
    // This would typically come from prayer times API
    // For now, return a placeholder
    const now = new Date();
    const hours = now.getHours();
    if (hours < 12) return 'Dhor 13h55';
    if (hours < 15) return 'Asr 16h30';
    if (hours < 18) return 'Maghreb 19h00';
    return 'Isha 20h30';
  };

  const renderMosqueCard = ({ item: mosque }: { item: Mosque }) => {
    // If hasWomenSection is true, both men and women can pray
    // If false, assume men only (or we don't have info about women's section)
    const hasMen = true; // Always show men icon (mosques typically have men's section)
    const hasWomen = mosque.hasWomenSection; // Show women icon only if there's a women's section

    return (
      <View style={[styles.mosqueCard, { backgroundColor: colors.surface }]}>
        {/* Header Row */}
        <View style={styles.cardHeader}>
          <View style={styles.mosqueInfo}>
            <Ionicons name="business" size={24} color={colors.primary} />
            <View style={styles.mosqueNameContainer}>
              <Text style={[styles.mosqueName, { fontFamily: fontBold, color: colors.text.primary }]}>
                {mosque.name}
              </Text>
              {mosque.adminPinned && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={12} color="#4ade80" />
                  <Text style={[styles.verifiedText, { fontFamily: fontMedium, color: '#4ade80', fontSize: 10 }]}>
                    Verified
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.distanceContainer}>
            <Text style={[styles.distance, { fontFamily: fontSemiBold, color: colors.primary }]}>
              {mosque.distance ? formatDistance(mosque.distance) : '--'}
            </Text>
            {/* Gender Icons */}
            <View style={styles.genderIcons}>
              {hasMen && (
                <View style={[styles.genderIcon, { backgroundColor: '#FFF' }]}>
                  <Image 
                    source={require('@/assets/images/man.png')} 
                    style={styles.genderImage}
                    resizeMode="contain"
                  />
                </View>
              )}
              {hasWomen && (
                <View style={[styles.genderIcon, { backgroundColor: '#000' }]}>
                  <Image 
                    source={require('@/assets/images/woman.png')} 
                    style={styles.genderImage}
                    resizeMode="contain"
                  />
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Address */}
        <View style={styles.addressRow}>
          <Ionicons name="location" size={16} color={colors.text.secondary} />
          <Text style={[styles.address, { fontFamily: fontRegular, color: colors.text.secondary }]}>
            {mosque.address}
          </Text>
        </View>

        {/* Prayer Times */}
        <View style={styles.prayerTimesRow}>
          <Ionicons name="time" size={16} color={colors.text.secondary} />
          <Text style={[styles.prayerTime, { fontFamily: fontMedium, color: colors.primary }]}>
            Salat al Jumu3a {mosque.jummahTime || '14h00'}
          </Text>
        </View>
        <View style={styles.prayerTimesRow}>
          <Ionicons name="person" size={16} color={colors.text.secondary} />
          <Text style={[styles.nextPrayer, { fontFamily: fontRegular, color: colors.text.secondary }]}>
            Prochaine Salat, {getNextPrayerTime()}
          </Text>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />

        {/* Action Icons */}
        <View style={styles.actionIcons}>
          <Pressable 
            style={styles.actionIcon}
            onPress={() => setSelectedMosque(mosque)}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.surfaceHighlight }]}>
              <Ionicons name="information-circle" size={20} color={colors.primary} />
            </View>
          </Pressable>

          {mosque.wheelchairAccess && (
            <Pressable style={styles.actionIcon}>
              <View style={[styles.iconContainer, { backgroundColor: colors.surfaceHighlight }]}>
                <Ionicons name="accessibility" size={20} color={colors.primary} />
              </View>
            </Pressable>
          )}

          {mosque.parkingAvailable && (
            <Pressable style={styles.actionIcon}>
              <View style={[styles.iconContainer, { backgroundColor: colors.surfaceHighlight }]}>
                <Text style={[styles.parkingIcon, { fontFamily: fontBold, color: colors.primary }]}>P</Text>
              </View>
            </Pressable>
          )}

          <Pressable 
            style={styles.actionIcon}
            onPress={() => openNavigation(mosque)}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.surfaceHighlight }]}>
              <Ionicons name="navigate" size={20} color={colors.primary} />
            </View>
          </Pressable>

          <Pressable 
            style={styles.actionIcon}
            onPress={() => shareMosque(mosque)}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.surfaceHighlight }]}>
              <Ionicons name="share-social" size={20} color={colors.primary} />
            </View>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: 8 }]}>
        <Text style={[styles.headerTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
          Mosques Nearby
        </Text>
        <View style={styles.headerActions}>
          <Pressable 
            onPress={() => router.push('/(tabs)/mosques')}
            style={[styles.mapButton, { backgroundColor: colors.surface }]}
          >
            <Ionicons name="map" size={22} color={colors.text.primary} />
          </Pressable>
          <Pressable 
            onPress={fetchMosques}
            style={[styles.refreshButton, { backgroundColor: colors.surface }]}
          >
            <Ionicons name="refresh" size={22} color={colors.text.primary} />
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { fontFamily: fontMedium, color: colors.text.secondary }]}>
            Finding nearby mosques...
          </Text>
        </View>
      ) : (
        <FlatList
          data={mosques}
          keyExtractor={(item) => item.id}
          renderItem={renderMosqueCard}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="business-outline" size={64} color={colors.text.disabled} />
              <Text style={[styles.emptyText, { fontFamily: fontMedium, color: colors.text.secondary }]}>
                No mosques found nearby
              </Text>
            </View>
          }
        />
      )}

      {/* Mosque Info Modal */}
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
          <Pressable 
            style={[styles.modalContent, { backgroundColor: colors.background }]}
            onPress={(e) => e.stopPropagation()}
          >
            {selectedMosque && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
                    {selectedMosque.name}
                  </Text>
                  <Pressable onPress={() => setSelectedMosque(null)}>
                    <Ionicons name="close" size={24} color={colors.text.primary} />
                  </Pressable>
                </View>
                
                <View style={styles.modalBody}>
                  <View style={styles.modalRow}>
                    <Ionicons name="location" size={20} color={colors.text.secondary} />
                    <Text style={[styles.modalText, { fontFamily: fontRegular, color: colors.text.secondary }]}>
                      {selectedMosque.address}
                    </Text>
                  </View>
                  
                  {selectedMosque.capacity && (
                    <View style={styles.modalRow}>
                      <Ionicons name="people" size={20} color={colors.text.secondary} />
                      <Text style={[styles.modalText, { fontFamily: fontRegular, color: colors.text.secondary }]}>
                        Capacity: {selectedMosque.capacity}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.modalRow}>
                    <Ionicons name="checkmark-circle" size={20} color={selectedMosque.hasWomenSection ? '#4ade80' : colors.text.disabled} />
                    <Text style={[styles.modalText, { fontFamily: fontRegular, color: colors.text.secondary }]}>
                      Women's Section: {selectedMosque.hasWomenSection ? 'Yes' : 'No'}
                    </Text>
                  </View>
                  
                  <View style={styles.modalRow}>
                    <Ionicons name="car" size={20} color={selectedMosque.parkingAvailable ? '#4ade80' : colors.text.disabled} />
                    <Text style={[styles.modalText, { fontFamily: fontRegular, color: colors.text.secondary }]}>
                      Parking: {selectedMosque.parkingAvailable ? 'Available' : 'Not Available'}
                    </Text>
                  </View>
                  
                  {selectedMosque.wheelchairAccess && (
                    <View style={styles.modalRow}>
                      <Ionicons name="accessibility" size={20} color="#4ade80" />
                      <Text style={[styles.modalText, { fontFamily: fontRegular, color: colors.text.secondary }]}>
                        Wheelchair Accessible
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  mapButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 16,
  },
  mosqueCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  mosqueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  mosqueNameContainer: {
    flex: 1,
  },
  mosqueName: {
    fontSize: 18,
    marginBottom: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 10,
  },
  distanceContainer: {
    alignItems: 'flex-end',
    gap: 8,
  },
  distance: {
    fontSize: 16,
  },
  genderIcons: {
    flexDirection: 'row',
    gap: 4,
  },
  genderIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  genderImage: {
    width: 20,
    height: 20,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  address: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  prayerTimesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  prayerTime: {
    fontSize: 14,
  },
  nextPrayer: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  actionIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  parkingIcon: {
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    flex: 1,
  },
  modalBody: {
    gap: 16,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalText: {
    flex: 1,
    fontSize: 15,
  },
});

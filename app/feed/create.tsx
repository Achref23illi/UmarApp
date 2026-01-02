import { Ionicons } from '@expo/vector-icons';
import Mapbox from '@rnmapbox/maps';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import SuccessModal from '@/components/ui/SuccessModal';
import { Fonts } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { socialService } from '@/services/socialService';
import { useAppSelector } from '@/store/hooks';

// Initialize Mapbox (Using same token as mosques.tsx)
Mapbox.setAccessToken('process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || ');

const DEFAULT_JANAZA_IMAGE = "https://res.cloudinary.com/dnliu9fiu/image/upload/v1766255386/cebd1c5356fffd216f3b70fe188d4078_n9yv0p.jpg";

type PostType = 'standard' | 'janaza' | 'sick_visit' | 'general' | 'event';

export default function CreatePostScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  // Get User Role
  const isAdmin = useAppSelector(state => state.user.isAdmin);

  // Determine allowed types
  const allowedTypes: PostType[] = isAdmin 
    ? ['standard', 'janaza', 'sick_visit', 'event', 'general']
    : ['janaza', 'sick_visit'];

  const [postType, setPostType] = useState<PostType>(allowedTypes[0]); // Default to first allowed type
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Janaza Fields
  const [deceasedName, setDeceasedName] = useState('');
  const [deceasedGender, setDeceasedGender] = useState<'male' | 'female'>('male');
  const [mosqueName, setMosqueName] = useState('');
  
  // Sick Visit Fields
  const [patientName, setPatientName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [visitingHours, setVisitingHours] = useState('');
  const [wardRoom, setWardRoom] = useState('');

  // Shared Fields
  const [prayerTime, setPrayerTime] = useState(''); // Used for Janaza

  // Location Picker
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number, lng: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const fontRegular = Fonts.regular;
  const fontMedium = Fonts.medium;
  const fontSemiBold = Fonts.semiBold;
  const fontBold = Fonts.bold;

  // Search State for Map
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [mosques, setMosques] = useState<any[]>([]);
  const [selectedMosque, setSelectedMosque] = useState<any | null>(null);

  useEffect(() => {
    loadMosques();
  }, []);

  const loadMosques = async () => {
    try {
        const data = await socialService.getMosques();
        setMosques(data);
    } catch (e) {
        console.error("Failed to load mosques", e);
    }
  };

  // Effect to handle Janaza Image behavior
  useEffect(() => {
    if (postType === 'janaza') {
        setImage(DEFAULT_JANAZA_IMAGE);
    } else {
        if (image === DEFAULT_JANAZA_IMAGE) {
            setImage(null);
        }
    }
  }, [postType]);

  const searchPlaces = async () => {
    if (!searchQuery.trim()) return;
    Keyboard.dismiss();
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5`, {
            headers: { 'User-Agent': 'UmarApp/1.0' }
        });
        const data = await response.json();
        setSearchResults(data);
    } catch (error) {
        console.error("Search error:", error);
    }
  };

  const traverseToLocation = (lat: number, lng: number) => {
      setMapCenter({ lat, lng });
      setSearchResults([]); // clear results triggers close of list
      setSearchQuery(''); 
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const openLocationPicker = async () => {
      try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
              Alert.alert(t('common.error'), t('prayer.locationDenied'));
              return;
          }

          let initialLat = 0;
          let initialLng = 0;

          if (userLocation) {
              initialLat = userLocation.lat;
              initialLng = userLocation.lng;
          } else {
              const location = await Location.getCurrentPositionAsync({});
              initialLat = location.coords.latitude;
              initialLng = location.coords.longitude;
              setUserLocation({ lat: initialLat, lng: initialLng });
          }
          
          setMapCenter({ lat: initialLat, lng: initialLng });
          setLocationModalVisible(true);

      } catch (error) {
          console.error(error);
          Alert.alert(t('common.error'), t('prayer.unableToGetLocation'));
      }
  };

  const onRegionDidChange = async (feature: any) => {
      if (feature && feature.geometry && feature.geometry.coordinates) {
          const [lng, lat] = feature.geometry.coordinates;
          setMapCenter({ lat, lng });
      }
      else if (feature && feature.properties && feature.properties.center) {
           const [lng, lat] = feature.properties.center;
           setMapCenter({ lat, lng });   
      }
  };

  const confirmLocation = () => {
      if (mapCenter) {
          setSelectedLocation(mapCenter);
          setLocationModalVisible(false);
      }
  };

  const handlePost = async () => {
    const isJanaza = postType === 'janaza';
    const isSickVisit = postType === 'sick_visit';
    const isStandard = postType === 'standard' || postType === 'general' || postType === 'event';

    if (isStandard && !content.trim() && !image) {
      Alert.alert(t('common.error'), t('feed.createPostError')); 
      return;
    }

    if (isJanaza && (!deceasedName || !mosqueName)) {
        Alert.alert(t('common.error'), t('feed.janazaError')); 
        return;
    }

    if (isSickVisit && (!patientName || !hospitalName)) {
         Alert.alert(t('common.error'), "Please provide patient and hospital details."); 
         return;
    }
    
    if ((isJanaza || isSickVisit) && !selectedLocation) {
        Alert.alert(t('common.error'), t('feed.selectLocationError') || "Please select a location");
        return;
    }

    Keyboard.dismiss();
    setIsSubmitting(true);

    try {
      let uploadedImageUrl = undefined;

      if (image) {
          if (image === DEFAULT_JANAZA_IMAGE) {
              uploadedImageUrl = DEFAULT_JANAZA_IMAGE;
          } else {
              uploadedImageUrl = await socialService.uploadImage(image);
              if (!uploadedImageUrl) {
                  Alert.alert(t('common.error'), 'Failed to upload image. Please try again.');
                  setIsSubmitting(false);
                  return;
              }
          }
      } 

      let metadata = {};
      if (isJanaza) {
          metadata = {
            deceasedName,
            deceasedGender,
            mosqueName,
            prayerTime: prayerTime || 'After Prayer',
            location: selectedLocation 
          };
      } else if (isSickVisit) {
          metadata = {
              patientName,
              hospitalName,
              visitingHours: visitingHours || 'Checking with family',
              ward: wardRoom,
              hospitalLocation: selectedLocation
          };
      }

      const success = await socialService.createPost(content, postType, metadata, uploadedImageUrl, selectedLocation || undefined);

      if (success) {
        setSuccessModalVisible(true);
      } else {
        Alert.alert(t('common.error'), t('feed.postFailed'));
      }
    } catch (error) {
      console.error(error);
      Alert.alert(t('common.error'), t('errors.somethingWentWrong'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const TypeSelector = () => (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelectorContainer} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {allowedTypes.map((type) => (
              <Pressable
                key={type}
                onPress={() => setPostType(type)}
                style={[
                    styles.typeOption,
                    postType === type && styles.typeOptionSelected,
                    { backgroundColor: postType === type ? colors.primary : colors.surface, borderColor: colors.border }
                ]}
              >
                  <Text style={[
                      styles.typeOptionText,
                      postType === type && styles.typeOptionTextSelected,
                      { color: postType === type ? '#FFF' : colors.text.secondary, fontFamily: fontMedium }
                  ]}>
                      {type === 'sick_visit' ? t('feed.sickVisit') : type === 'janaza' ? t('feed.janaza').replace(' Announcement', '').replace('Annonce ', '') : type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
              </Pressable>
          ))}
      </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.surface }]}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={26} color={colors.text.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
          {t('feed.createPost')}
        </Text>
        <Pressable 
            onPress={handlePost} 
            disabled={isSubmitting}
            style={[styles.postButton, { opacity: isSubmitting ? 0.5 : 1 }]}
        >
          {isSubmitting ? (
             <ActivityIndicator size="small" color={colors.primary} />
          ) : (
             <Text style={[styles.postButtonText, { fontFamily: fontSemiBold, color: colors.primary }]}>{t('common.save')}</Text> 
          )}
        </Pressable>
      </View>

      <View style={{ height: 60, backgroundColor: colors.surface }}>
           <TypeSelector />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content}>
            
            {/* Input Area - Only for types that need generic text description, always shown but context differs */}
            <TextInput
                style={[styles.input, { fontFamily: fontRegular, color: colors.text.primary, minHeight: postType !== 'standard' ? 80 : 120 }]}
                placeholder={postType === 'janaza' 
                    ? t('feed.addSpecificInstructions')
                    : postType === 'sick_visit' 
                    ? t('feed.addMessageForCommunity')
                    : t('feed.whatsOnYourMind')}
                placeholderTextColor={colors.input.placeholder}
                multiline
                value={content}
                onChangeText={setContent}
                autoFocus={postType === 'standard'}
            />

            {/* Image Preview / Add Button logic */}
            {image ? (
                <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: image }} style={styles.previewImage} />
                    {postType !== 'janaza' && (
                        <Pressable onPress={() => setImage(null)} style={styles.removeImageButton}>
                            <Ionicons name="close" size={16} color="#FFF" />
                        </Pressable>
                    )}
                </View>
            ) : (
                postType !== 'janaza' && (
                    <Pressable onPress={pickImage} style={[styles.addImageButton, { borderColor: colors.border }]}>
                        <Ionicons name="image-outline" size={24} color={colors.primary} />
                        <Text style={[styles.addImageText, { fontFamily: fontMedium, color: colors.primary }]}>{t('feed.addPhoto')}</Text>
                    </Pressable>
                )
            )}

            {/* JANAZA FORM */}
            {postType === 'janaza' && (
                <Animated.View entering={FadeInDown} style={styles.formContainer}>
                    <Text style={[styles.sectionTitle, { fontFamily: fontBold, color: colors.text.primary }]}>{t('feed.janazaDetails')}</Text>
                    
                    <View style={styles.field}>
                        <Text style={[styles.label, { fontFamily: fontMedium, color: colors.text.secondary }]}>{t('feed.deceasedName')}</Text>
                        <TextInput
                            style={[styles.fieldInput, { backgroundColor: colors.input.background, color: colors.text.primary, borderColor: colors.input.border }]}
                            placeholder={t('feed.deceasedName')}
                            placeholderTextColor={colors.input.placeholder}
                            value={deceasedName}
                            onChangeText={setDeceasedName}
                        />
                    </View>

                    <View style={styles.field}>
                       <Text style={[styles.label, { fontFamily: fontMedium, color: colors.text.secondary }]}>{t('feed.gender')}</Text>
                       <View style={styles.genderRow}>
                           <Pressable 
                              onPress={() => setDeceasedGender('male')}
                              style={[styles.genderOption, deceasedGender === 'male' && styles.genderOptionSelected, { borderColor: deceasedGender === 'male' ? colors.primary : colors.input.border, backgroundColor: deceasedGender === 'male' ? 'rgba(139, 92, 246, 0.1)' : 'transparent' }]}
                           >
                              <Text style={[styles.genderText, { color: deceasedGender === 'male' ? colors.primary : colors.text.secondary, fontFamily: fontMedium }]}>{t('common.male')}</Text>
                           </Pressable>
                           <Pressable 
                              onPress={() => setDeceasedGender('female')}
                              style={[styles.genderOption, deceasedGender === 'female' && styles.genderOptionSelected, { borderColor: deceasedGender === 'female' ? colors.primary : colors.input.border, backgroundColor: deceasedGender === 'female' ? 'rgba(139, 92, 246, 0.1)' : 'transparent' }]}
                           >
                              <Text style={[styles.genderText, { color: deceasedGender === 'female' ? colors.primary : colors.text.secondary, fontFamily: fontMedium }]}>{t('common.female')}</Text>
                           </Pressable>
                       </View>
                    </View>

                    <View style={styles.field}>
                        <Text style={[styles.label, { fontFamily: fontMedium, color: colors.text.secondary }]}>{t('feed.mosqueName')}</Text>
                        <TextInput
                            style={[styles.fieldInput, { backgroundColor: colors.input.background, color: colors.text.primary, borderColor: colors.input.border }]}
                            placeholder={t('feed.mosqueName')}
                            placeholderTextColor={colors.input.placeholder}
                            value={mosqueName}
                            onChangeText={setMosqueName}
                        />
                    </View>

                     <View style={styles.field}>
                        <Text style={[styles.label, { fontFamily: fontMedium, color: colors.text.secondary }]}>{t('feed.prayerTime')}</Text>
                        <TextInput
                            style={[styles.fieldInput, { backgroundColor: colors.input.background, color: colors.text.primary, borderColor: colors.input.border }]}
                            placeholder={t('feed.prayerTime')}
                            placeholderTextColor={colors.input.placeholder}
                            value={prayerTime}
                            onChangeText={setPrayerTime}
                        />
                    </View>
                </Animated.View>
            )}

            {/* SICK VISIT FORM */}
            {postType === 'sick_visit' && (
                <Animated.View entering={FadeInDown} style={styles.formContainer}>
                    <Text style={[styles.sectionTitle, { fontFamily: fontBold, color: colors.text.primary }]}>{t('feed.sickVisitDetails')}</Text>
                    
                    <View style={styles.field}>
                        <Text style={[styles.label, { fontFamily: fontMedium, color: colors.text.secondary }]}>{t('feed.patientName')}</Text>
                        <TextInput
                            style={[styles.fieldInput, { backgroundColor: colors.input.background, color: colors.text.primary, borderColor: colors.input.border }]}
                            placeholder={t('feed.patientNamePlaceholder')}
                            placeholderTextColor={colors.input.placeholder}
                            value={patientName}
                            onChangeText={setPatientName}
                        />
                    </View>
                    
                    <View style={styles.field}>
                        <Text style={[styles.label, { fontFamily: fontMedium, color: colors.text.secondary }]}>{t('feed.hospital')}</Text>
                        <TextInput
                            style={[styles.fieldInput, { backgroundColor: colors.input.background, color: colors.text.primary, borderColor: colors.input.border }]}
                            placeholder={t('feed.hospitalPlaceholder')}
                            placeholderTextColor={colors.input.placeholder}
                            value={hospitalName}
                            onChangeText={setHospitalName}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={[styles.label, { fontFamily: fontMedium, color: colors.text.secondary }]}>{t('feed.visitingHours')}</Text>
                        <TextInput
                            style={[styles.fieldInput, { backgroundColor: colors.input.background, color: colors.text.primary, borderColor: colors.input.border }]}
                            placeholder={t('feed.visitingHoursPlaceholder')}
                            placeholderTextColor={colors.input.placeholder}
                            value={visitingHours}
                            onChangeText={setVisitingHours}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={[styles.label, { fontFamily: fontMedium, color: colors.text.secondary }]}>{t('feed.wardRoom')}</Text>
                        <TextInput
                            style={[styles.fieldInput, { backgroundColor: colors.input.background, color: colors.text.primary, borderColor: colors.input.border }]}
                            placeholder={t('feed.wardRoomPlaceholder')}
                            placeholderTextColor={colors.input.placeholder}
                            value={wardRoom}
                            onChangeText={setWardRoom}
                        />
                    </View>
                </Animated.View>
            )}

            {/* Shared Location Picker (Janaza or Sick Visit) */}
            {(postType === 'janaza' || postType === 'sick_visit') && (
                <View style={[styles.field, { marginTop: 16 }]}>
                    <Text style={[styles.label, { fontFamily: fontMedium, color: colors.text.secondary }]}>{t('feed.location')}</Text>
                        <Pressable 
                        onPress={openLocationPicker}
                        style={[styles.locationButton, { backgroundColor: colors.input.background, borderColor: colors.input.border }]}
                        >
                            <Ionicons name="location-outline" size={20} color={selectedLocation ? colors.primary : colors.text.secondary} />
                            <Text style={[styles.locationButtonText, { fontFamily: fontRegular, color: selectedLocation ? colors.text.primary : colors.input.placeholder }]}>
                                {selectedLocation ? t('feed.locationSelected') : t('feed.selectLocation')}
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color={colors.text.disabled} />
                        </Pressable>
                </View>
            )}
            
            {/* Disclaimer for Admin Only Types */}
            {isAdmin && (postType === 'general' || postType === 'event') && (
                 <View style={{ marginTop: 20 }}>
                     <Text style={{ color: colors.text.secondary, fontStyle: 'italic' }}>
                         Posting as Admin. This will be visible to everyone.
                     </Text>
                 </View>
            )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Location Picker Modal */}
      <Modal
        visible={locationModalVisible}
        animationType="slide"
        onRequestClose={() => setLocationModalVisible(false)}
      >
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
              {/* Modal Header */}
              <View style={[styles.modalHeader, { paddingTop: insets.top + 10, backgroundColor: colors.surface }]}>
                  <Pressable onPress={() => setLocationModalVisible(false)} style={styles.closeButton}>
                      <Ionicons name="close" size={26} color={colors.text.primary} />
                  </Pressable>
                  <Text style={[styles.headerTitle, { fontFamily: fontBold, color: colors.text.primary }]}>{t('feed.selectLocation')}</Text>
                  <Pressable onPress={confirmLocation} style={styles.postButton}>
                       <Text style={[styles.postButtonText, { fontFamily: fontSemiBold, color: colors.primary }]}>{t('common.confirm')}</Text>
                  </Pressable>
              </View>
              
              {/* Search Bar Overlay */}
              <View style={[styles.searchOverlay, { top: insets.top + 80 }]}>
                    <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
                         <Ionicons name="search" size={20} color={colors.text.secondary} />
                         <TextInput 
                             style={[styles.searchInput, { color: colors.text.primary }]}
                             placeholder="Search for a location..."
                             placeholderTextColor={colors.text.secondary}
                             value={searchQuery}
                             onChangeText={setSearchQuery}
                             onSubmitEditing={searchPlaces}
                             returnKeyType="search"
                         />
                         {searchQuery.length > 0 && (
                            <Pressable onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
                                <Ionicons name="close-circle" size={18} color={colors.text.secondary} />
                            </Pressable>
                         )}
                    </View>
                    {/* Search Results List */}
                    {searchResults.length > 0 && (
                        <View style={[styles.searchResultsContainer, { backgroundColor: colors.surface }]}>
                            {searchResults.map((result, index) => (
                                <Pressable 
                                    key={index} 
                                    style={[styles.searchResultItem, { borderBottomColor: colors.border }]}
                                    onPress={() => traverseToLocation(parseFloat(result.lat), parseFloat(result.lon))}
                                >
                                    <View style={styles.searchResultIcon}>
                                         <Ionicons name="location-outline" size={18} color={colors.text.secondary} />
                                    </View>
                                    <Text style={[styles.searchResultText, { color: colors.text.primary }]} numberOfLines={1}>
                                        {result.display_name}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    )}
              </View>

              <View style={styles.mapContainer}>
                  {mapCenter && (
                    <Mapbox.MapView
                        style={styles.map}
                        styleURL={isDark ? Mapbox.StyleURL.Dark : Mapbox.StyleURL.Street}
                        onRegionDidChange={onRegionDidChange}
                        onPress={() => setSelectedMosque(null)}
                    >
                        <Mapbox.Camera
                            zoomLevel={15}
                            centerCoordinate={[mapCenter.lng, mapCenter.lat]}
                            animationMode="flyTo"
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
                                    onPress={() => {
                                        setMapCenter({ lat: mosque.latitude, lng: mosque.longitude });
                                        setSelectedMosque(mosque);
                                        // Auto-Select Logic
                                        if (postType === 'janaza') {
                                            setMosqueName(mosque.name);
                                        }
                                        setSelectedLocation({ lat: mosque.latitude, lng: mosque.longitude });
                                    }}
                                    style={{ alignItems: 'center' }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 4, borderRadius: 8, marginBottom: 4, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 }}>
                                         <Text style={{ fontSize: 10, fontFamily: fontMedium, color: colors.text.primary }}>{mosque.name}</Text>
                                    </View>
                                    <Image
                                        source={require('@/assets/images/mosque-marker.png')}
                                        style={{ width: 40, height: 40 }}
                                        resizeMode="contain"
                                    />
                                </Pressable>
                            </Mapbox.MarkerView>
                        ))}
                    </Mapbox.MapView>
                  )}
                  {/* Fixed Center Pin */}
                  <View style={styles.centerPinContainer} pointerEvents="none">
                      <Ionicons name="location" size={40} color={colors.primary} />
                  </View>

                  {/* Selected Mosque Info Card */}
                  {selectedMosque && (
                      <Animated.View 
                        entering={FadeInDown.springify()} 
                        style={[styles.mosqueCard, { backgroundColor: colors.surface, bottom: insets.bottom + 20 }]}
                      >
                          <View style={styles.mosqueCardHeader}>
                              <Ionicons name="business" size={24} color={colors.primary} />
                              <View style={{ flex: 1, marginLeft: 12 }}>
                                  <Text style={[styles.mosqueCardTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
                                      {selectedMosque.name}
                                  </Text>
                                  <Text style={[styles.mosqueCardAddress, { fontFamily: fontRegular, color: colors.text.secondary }]} numberOfLines={1}>
                                      {selectedMosque.address || "Masjid Location"}
                                  </Text>
                              </View>
                          </View>
                          
                          <Pressable 
                              onPress={confirmLocation}
                              style={[styles.confirmMosqueButton, { backgroundColor: colors.primary }]}
                          >
                              <Text style={[styles.confirmMosqueText, { fontFamily: fontSemiBold }]}>
                                  Select {selectedMosque.name}
                              </Text>
                              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                          </Pressable>
                      </Animated.View>
                  )}
              </View>
          </View>
      </Modal>

      {/* Success Modal */}
      <SuccessModal
        visible={successModalVisible}
        title={t('common.success')}
        message={t('feed.postCreated')}
        onConfirm={() => {
            setSuccessModalVisible(false);
            router.back();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
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
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
  },
  postButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  postButtonText: {
    fontSize: 15,
  },
  typeSelectorContainer: {
      flexGrow: 0,
  },
  typeOption: {
      marginRight: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      height: 36,
      justifyContent: 'center',
      marginVertical: 12,
  },
  typeOptionSelected: {
      borderWidth: 0,
  },
  typeOptionText: {
      fontSize: 14,
  },
  typeOptionTextSelected: {
      fontWeight: '600',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  input: {
    fontSize: 18,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  imagePreviewContainer: {
     marginBottom: 20,
     borderRadius: 12,
     overflow: 'hidden',
  },
  previewImage: {
     width: '100%',
     height: 200,
     borderRadius: 12,
  },
  removeImageButton: {
     position: 'absolute',
     top: 10,
     right: 10,
     backgroundColor: 'rgba(0,0,0,0.5)',
     width: 28,
     height: 28,
     borderRadius: 14,
     alignItems: 'center',
     justifyContent: 'center',
  },
  addImageButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 20,
      borderStyle: 'dashed',
  },
  addImageText: {
      fontSize: 15,
  },
  formContainer: {
      gap: 16,
  },
  sectionTitle: {
      fontSize: 18,
      marginBottom: 8,
  },
  field: {
      gap: 8,
  },
  label: {
      fontSize: 14,
  },
  fieldInput: {
      height: 48,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 16,
      fontSize: 16,
  },
  locationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 48,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 16,
  },
  locationButtonText: {
      fontSize: 16,
      flex: 1,
      marginLeft: 10,
  },
  modalContainer: {
      flex: 1,
  },
  modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderColor: 'rgba(0,0,0,0.1)',
  },
  mapContainer: {
      flex: 1,
      position: 'relative',
  },
  map: {
      flex: 1,
  },
  centerPinContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 40, // Offset for pin point
  },
  searchOverlay: {
      position: 'absolute',
      left: 16,
      right: 16,
      zIndex: 100,
  },
  searchContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: 16,
     height: 50,
     borderRadius: 25,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.15,
     shadowRadius: 8,
     elevation: 5,
  },
  searchInput: {
      flex: 1,
      fontSize: 16,
      marginLeft: 10,
      height: '100%',
  },
  searchResultsContainer: {
      marginTop: 10,
      borderRadius: 12,
      maxHeight: 200,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
  },
  searchResultItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderBottomWidth: 1,
  },
  searchResultIcon: {
      marginRight: 10,
  },
  searchResultText: {
      fontSize: 14,
      flex: 1,
  },
  mosqueCard: {
      position: 'absolute',
      left: 20,
      right: 20,
      padding: 16,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
  },
  mosqueCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
  },
  mosqueCardTitle: {
      fontSize: 16,
      marginBottom: 2,
  },
  mosqueCardAddress: {
      fontSize: 13,
  },
  confirmMosqueButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 12,
      gap: 8,
  },
  confirmMosqueText: {
      color: '#FFF',
      fontSize: 15,
  },
  genderRow: {
      flexDirection: 'row',
      gap: 12,
  },
  genderOption: {
      flex: 1,
      height: 48,
      borderWidth: 1,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
  },
  genderOptionSelected: {
      borderWidth: 2,
  },
  genderText: {
      fontSize: 15,
  }
});

import { Ionicons } from '@expo/vector-icons';
import Mapbox from '@rnmapbox/maps';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Keyboard,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { socialService } from '@/services/socialService';

// Initialize Mapbox 
Mapbox.setAccessToken('process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || ');

export default function AddMosqueScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();

    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [capacity, setCapacity] = useState('');
    const [hasWomenSection, setHasWomenSection] = useState(false);
    const [hasQuranSession, setHasQuranSession] = useState(false);
    const [parkingAvailable, setParkingAvailable] = useState(false);
    const [wheelchairAccess, setWheelchairAccess] = useState(false);
    const [kidsArea, setKidsArea] = useState(false);
    const [wuduArea, setWuduArea] = useState(false);
    const [jummahTime, setJummahTime] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number } | null>(null);

    const [locationModalVisible, setLocationModalVisible] = useState(false);
    const [coordsModalVisible, setCoordsModalVisible] = useState(false);
    const [mapCenter, setMapCenter] = useState<{ lat: number, lng: number } | null>(null);
    const [loading, setLoading] = useState(false);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Manual Coords State
    const [manualLat, setManualLat] = useState('');
    const [manualLng, setManualLng] = useState('');

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
                Alert.alert('Error', 'Location permission denied');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            setMapCenter({ lat: location.coords.latitude, lng: location.coords.longitude });
            setLocationModalVisible(true);
        } catch (error) {
            Alert.alert('Error', 'Could not get location');
        }
    };

    // Debounced search as user types
    useEffect(() => {
        if (searchQuery.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(() => {
            searchPlaces();
        }, 300); // Reduced delay for faster response

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const searchPlaces = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        console.log('Searching for:', searchQuery);
        try {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5`;
            console.log('Fetch URL:', url);
            const response = await fetch(url, {
                headers: { 'User-Agent': 'UmarApp/1.0' }
            });
            const data = await response.json();
            console.log('Search results:', data.length, 'items');
            setSearchResults(data);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const selectSuggestion = (item: any) => {
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        setMapCenter({ lat, lng });
        setSearchResults([]);
        setSearchQuery('');
        Keyboard.dismiss();
        
        // Also set the address from suggestion
        if (item.display_name && !address) {
            setAddress(item.display_name.split(',').slice(0, 3).join(','));
        }
    };

    const confirmLocation = () => {
        if (mapCenter) {
            setSelectedLocation(mapCenter);
            setLocationModalVisible(false);
        }
    };

    const onRegionDidChange = (feature: any) => {
        if (feature?.properties?.center) {
            const [lng, lat] = feature.properties.center;
            setMapCenter({ lat, lng });
        } else if (feature?.geometry?.coordinates) {
             const [lng, lat] = feature.geometry.coordinates;
             setMapCenter({ lat, lng });
        }
    };

    const applyManualCoords = () => {
        const lat = parseFloat(manualLat);
        const lng = parseFloat(manualLng);
        
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            Alert.alert('Error', 'Please enter valid coordinates');
            return;
        }
        
        setSelectedLocation({ lat, lng });
        setCoordsModalVisible(false);
        setManualLat('');
        setManualLng('');
    };

    const handleSubmit = async () => {
        if (!name || !image || !selectedLocation) {
            Alert.alert('Error', 'Name, Location, and Image are required.');
            return;
        }

        setLoading(true);
        try {
            const result = await socialService.addMosque({
                name,
                address,
                capacity: capacity ? parseInt(capacity) : 0,
                hasWomenSection,
                hasQuranSession,
                parkingAvailable,
                wheelchairAccess,
                kidsArea,
                wuduArea,
                jummahTime,
                latitude: selectedLocation.lat,
                longitude: selectedLocation.lng
            }, image);

            if (result) {
                Alert.alert('Success', 'Mosque added successfully!', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                Alert.alert('Error', 'Failed to add mosque');
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.surface }]}>
                <Pressable onPress={() => router.back()}>
                    <Ionicons name="close" size={24} color={colors.text.primary} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: colors.text.primary, fontFamily: Fonts.bold }]}>Add Mosque</Text>
                <Pressable onPress={handleSubmit} disabled={loading}>
                    {loading ? <ActivityIndicator color={colors.primary} /> : <Text style={[styles.saveText, { color: colors.primary, fontFamily: Fonts.semiBold }]}>Save</Text>}
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                
                {/* Image Picker */}
                <Pressable onPress={pickImage} style={[styles.imagePicker, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                    {image ? (
                        <Image source={{ uri: image }} style={styles.image} />
                    ) : (
                        <View style={styles.placeholder}>
                            <Ionicons name="camera-outline" size={40} color={colors.text.secondary} />
                            <Text style={[styles.placeholderText, { color: colors.text.secondary }]}>Add Mosque Photo</Text>
                        </View>
                    )}
                </Pressable>

                {/* Form Fields */}
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text.secondary }]}>Mosque Name</Text>
                        <TextInput 
                            style={[styles.input, { backgroundColor: colors.surface, color: colors.text.primary, borderColor: colors.border }]}
                            placeholder="e.g. Masjid Al-Noor"
                            placeholderTextColor={colors.text.secondary}
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text.secondary }]}>Location</Text>
                        <View style={styles.locationOptions}>
                            <Pressable 
                                onPress={openLocationPicker}
                                style={[styles.locationButton, { backgroundColor: colors.surface, borderColor: colors.border, flex: 1 }]}
                            >
                                <Ionicons name="map-outline" size={20} color={selectedLocation ? colors.primary : colors.text.secondary} />
                                <Text style={[styles.locationText, { color: selectedLocation ? colors.text.primary : colors.text.secondary }]} numberOfLines={1}>
                                    {selectedLocation ? `${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}` : 'Select on Map'}
                                </Text>
                            </Pressable>
                            <Pressable 
                                onPress={() => setCoordsModalVisible(true)}
                                style={[styles.coordsButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            >
                                <Ionicons name="keypad-outline" size={20} color={colors.text.secondary} />
                            </Pressable>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text.secondary }]}>Address (Optional)</Text>
                         <TextInput 
                            style={[styles.input, { backgroundColor: colors.surface, color: colors.text.primary, borderColor: colors.border }]}
                            placeholder="Full address"
                            placeholderTextColor={colors.text.secondary}
                            value={address}
                            onChangeText={setAddress}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text.secondary }]}>Capacity (Est.)</Text>
                         <TextInput 
                            style={[styles.input, { backgroundColor: colors.surface, color: colors.text.primary, borderColor: colors.border }]}
                            placeholder="e.g. 500"
                            placeholderTextColor={colors.text.secondary}
                            value={capacity}
                            onChangeText={setCapacity}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
                        <View>
                            <Text style={[styles.toggleLabel, { color: colors.text.primary, fontFamily: Fonts.medium }]}>Women's Section</Text>
                            <Text style={[styles.toggleSub, { color: colors.text.secondary }]}>Is there a dedicated area?</Text>
                        </View>
                        <Switch 
                            value={hasWomenSection}
                            onValueChange={setHasWomenSection}
                            trackColor={{ false: colors.border, true: colors.primary }}
                        />
                    </View>

                    <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
                        <View>
                            <Text style={[styles.toggleLabel, { color: colors.text.primary, fontFamily: Fonts.medium }]}>Quran Education</Text>
                            <Text style={[styles.toggleSub, { color: colors.text.secondary }]}>Classes/Sessions available?</Text>
                        </View>
                         <Switch 
                            value={hasQuranSession}
                            onValueChange={setHasQuranSession}
                            trackColor={{ false: colors.border, true: colors.primary }}
                        />
                    </View>

                    <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
                        <View>
                             <Text style={[styles.toggleLabel, { color: colors.text.primary, fontFamily: Fonts.medium }]}>Parking</Text>
                             <Text style={[styles.toggleSub, { color: colors.text.secondary }]}>Is parking available?</Text>
                        </View>
                        <Switch 
                             value={parkingAvailable}
                             onValueChange={setParkingAvailable}
                             trackColor={{ false: colors.border, true: colors.primary }}
                        />
                    </View>

                    <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
                        <View>
                             <Text style={[styles.toggleLabel, { color: colors.text.primary, fontFamily: Fonts.medium }]}>Wheelchair Access</Text>
                             <Text style={[styles.toggleSub, { color: colors.text.secondary }]}>Is it accessible?</Text>
                        </View>
                         <Switch 
                             value={wheelchairAccess}
                             onValueChange={setWheelchairAccess}
                             trackColor={{ false: colors.border, true: colors.primary }}
                        />
                    </View>

                    <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
                        <View>
                             <Text style={[styles.toggleLabel, { color: colors.text.primary, fontFamily: Fonts.medium }]}>Kids Area</Text>
                             <Text style={[styles.toggleSub, { color: colors.text.secondary }]}>Safe space for children?</Text>
                        </View>
                         <Switch 
                             value={kidsArea}
                             onValueChange={setKidsArea}
                             trackColor={{ false: colors.border, true: colors.primary }}
                        />
                    </View>

                    <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
                        <View>
                             <Text style={[styles.toggleLabel, { color: colors.text.primary, fontFamily: Fonts.medium }]}>Wudu Area</Text>
                             <Text style={[styles.toggleSub, { color: colors.text.secondary }]}>Wudu facilities available?</Text>
                        </View>
                         <Switch 
                             value={wuduArea}
                             onValueChange={setWuduArea}
                             trackColor={{ false: colors.border, true: colors.primary }}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text.secondary }]}>Jummah Time (Optional)</Text>
                         <TextInput 
                            style={[styles.input, { backgroundColor: colors.surface, color: colors.text.primary, borderColor: colors.border }]}
                            placeholder="e.g. 1:15 PM"
                            placeholderTextColor={colors.text.secondary}
                            value={jummahTime}
                            onChangeText={setJummahTime}
                        />
                    </View>

                </View>
            </ScrollView>

            {/* Map Modal */}
            <Modal visible={locationModalVisible} animationType="slide">
                <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                     <View style={[styles.modalHeader, { paddingTop: insets.top + 10, backgroundColor: colors.surface }]}>
                        <Pressable onPress={() => setLocationModalVisible(false)} style={{ padding: 10 }}>
                             <Ionicons name="close" size={26} color={colors.text.primary} />
                        </Pressable>
                        <Text style={[styles.modalTitle, { color: colors.text.primary, fontFamily: Fonts.bold }]}>Select Location</Text>
                         <Pressable onPress={confirmLocation} style={{ padding: 10 }}>
                             <Text style={[styles.confirmText, { color: colors.primary, fontFamily: Fonts.semiBold }]}>Confirm</Text>
                        </Pressable>
                     </View>

                     {/* Search Bar - Positioned Lower */}
                     <View style={[styles.searchOverlay, { top: insets.top + 80 }]}>
                        <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
                            <Ionicons name="search" size={20} color={colors.text.secondary} />
                            <TextInput 
                                style={[styles.searchInput, { color: colors.text.primary }]}
                                placeholder="Search for a place..."
                                placeholderTextColor={colors.text.secondary}
                                value={searchQuery}
                                onChangeText={(text) => {
                                    console.log('Text changed:', text);
                                    setSearchQuery(text);
                                }}
                                returnKeyType="search"
                                autoCorrect={false}
                            />
                            {isSearching && <ActivityIndicator size="small" color={colors.primary} />}
                            {searchQuery.length > 0 && !isSearching && (
                                <Pressable onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
                                    <Ionicons name="close-circle" size={18} color={colors.text.secondary} />
                                </Pressable>
                            )}
                        </View>
                        
                        {/* Search Suggestions */}
                        {searchResults.length > 0 && (
                            <ScrollView 
                                style={[styles.searchResults, { backgroundColor: colors.surface, maxHeight: 250 }]}
                                keyboardShouldPersistTaps="handled"
                            >
                                {searchResults.map((item, idx) => (
                                    <Pressable 
                                        key={idx} 
                                        style={[styles.searchItem, idx === searchResults.length - 1 && { borderBottomWidth: 0 }]}
                                        onPress={() => selectSuggestion(item)}
                                    >
                                        <View style={[styles.suggestionIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                                            <Ionicons name="location" size={16} color={colors.primary} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.suggestionTitle, { color: colors.text.primary, fontFamily: Fonts.medium }]} numberOfLines={1}>
                                                {item.display_name?.split(',')[0]}
                                            </Text>
                                            <Text style={[styles.suggestionSub, { color: colors.text.secondary }]} numberOfLines={1}>
                                                {item.display_name?.split(',').slice(1, 3).join(',')}
                                            </Text>
                                        </View>
                                    </Pressable>
                                ))}
                            </ScrollView>
                        )}
                     </View>

                     {/* Coordinates Display */}
                     {mapCenter && (
                         <View style={[styles.coordsDisplay, { backgroundColor: colors.surface, bottom: insets.bottom + 20 }]}>
                             <Text style={[styles.coordsText, { color: colors.text.primary, fontFamily: Fonts.medium }]}>
                                 {mapCenter.lat.toFixed(6)}, {mapCenter.lng.toFixed(6)}
                             </Text>
                         </View>
                     )}
                     
                     <View style={{ flex: 1 }}>
                        {mapCenter && (
                            <Mapbox.MapView 
                                style={{ flex: 1 }} 
                                styleURL={isDark ? Mapbox.StyleURL.Dark : Mapbox.StyleURL.Street}
                                onRegionDidChange={onRegionDidChange}
                            >
                                <Mapbox.Camera
                                    zoomLevel={15}
                                    centerCoordinate={[mapCenter.lng, mapCenter.lat]}
                                    animationMode="flyTo"
                                />
                            </Mapbox.MapView>
                        )}
                        <View style={styles.centerPin} pointerEvents="none">
                            <Ionicons name="location" size={40} color={colors.primary} />
                        </View>
                     </View>
                </View>
            </Modal>

            {/* Manual Coordinates Modal */}
            <Modal visible={coordsModalVisible} transparent animationType="fade">
                <Pressable style={styles.coordsModalOverlay} onPress={() => setCoordsModalVisible(false)}>
                    <View style={[styles.coordsModal, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.coordsModalTitle, { color: colors.text.primary, fontFamily: Fonts.bold }]}>
                            Enter Coordinates
                        </Text>
                        
                        <View style={styles.coordsInputRow}>
                            <View style={styles.coordsInputGroup}>
                                <Text style={[styles.coordsInputLabel, { color: colors.text.secondary }]}>Latitude</Text>
                                <TextInput
                                    style={[styles.coordsInput, { backgroundColor: colors.background, color: colors.text.primary, borderColor: colors.border }]}
                                    placeholder="e.g. 33.5731"
                                    placeholderTextColor={colors.text.secondary}
                                    value={manualLat}
                                    onChangeText={setManualLat}
                                    keyboardType="decimal-pad"
                                />
                            </View>
                            <View style={styles.coordsInputGroup}>
                                <Text style={[styles.coordsInputLabel, { color: colors.text.secondary }]}>Longitude</Text>
                                <TextInput
                                    style={[styles.coordsInput, { backgroundColor: colors.background, color: colors.text.primary, borderColor: colors.border }]}
                                    placeholder="e.g. -7.5898"
                                    placeholderTextColor={colors.text.secondary}
                                    value={manualLng}
                                    onChangeText={setManualLng}
                                    keyboardType="decimal-pad"
                                />
                            </View>
                        </View>
                        
                        <Pressable 
                            style={[styles.coordsApplyButton, { backgroundColor: colors.primary }]}
                            onPress={applyManualCoords}
                        >
                            <Text style={[styles.coordsApplyText, { fontFamily: Fonts.semiBold }]}>Apply</Text>
                        </Pressable>
                    </View>
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
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    headerTitle: {
        fontSize: 18,
    },
    saveText: {
        fontSize: 16,
    },
    content: {
        padding: 20,
        paddingBottom: 100,
    },
    imagePicker: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
        marginBottom: 24,
        overflow: 'hidden',
    },
    placeholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    placeholderText: {
        fontSize: 16,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
    },
    input: {
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    locationOptions: {
        flexDirection: 'row',
        gap: 10,
    },
    locationButton: {
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 10,
    },
    coordsButton: {
        width: 50,
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    locationText: {
        fontSize: 14,
        flex: 1,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    toggleLabel: {
        fontSize: 16,
    },
    toggleSub: {
        fontSize: 13,
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
        zIndex: 10,
    },
    modalTitle: {
        fontSize: 18,
    },
    confirmText: {
        fontSize: 16,
    },
    centerPin: {
        position: 'absolute',
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        justifyContent: 'center', 
        alignItems: 'center',
        marginBottom: 40,
    },
    searchOverlay: {
        position: 'absolute',
        left: 16,
        right: 16,
        zIndex: 100,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        height: 50,
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        height: '100%',
        fontSize: 15,
    },
    searchResults: {
        marginTop: 10,
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
        overflow: 'hidden',
    },
    searchItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    suggestionIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    suggestionTitle: {
        fontSize: 15,
        marginBottom: 2,
    },
    suggestionSub: {
        fontSize: 12,
    },
    coordsDisplay: {
        position: 'absolute',
        left: 16,
        right: 16,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        zIndex: 100,
        alignItems: 'center',
    },
    coordsText: {
        fontSize: 14,
    },
    coordsModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    coordsModal: {
        width: '100%',
        borderRadius: 20,
        padding: 24,
    },
    coordsModalTitle: {
        fontSize: 20,
        textAlign: 'center',
        marginBottom: 24,
    },
    coordsInputRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    coordsInputGroup: {
        flex: 1,
        gap: 8,
    },
    coordsInputLabel: {
        fontSize: 13,
    },
    coordsInput: {
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 14,
        fontSize: 15,
    },
    coordsApplyButton: {
        height: 52,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    coordsApplyText: {
        color: '#FFF',
        fontSize: 16,
    },
});

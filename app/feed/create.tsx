import { Ionicons } from '@expo/vector-icons';
import Mapbox from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import SuccessModal from '@/components/ui/SuccessModal';
import { Fonts } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { socialService } from '@/services/socialService';
import { useAppSelector } from '@/store/hooks';

// Initialize Mapbox
<<<<<<< Updated upstream
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '');
=======
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '');
>>>>>>> Stashed changes

const DEFAULT_JANAZA_IMAGE = "https://res.cloudinary.com/dnliu9fiu/image/upload/v1766255386/cebd1c5356fffd216f3b70fe188d4078_n9yv0p.jpg";

type PostType = 'standard' | 'janaza' | 'sick_visit' | 'general' | 'event';

// Helper for step indicator
const StepIndicator = ({ currentStep, totalSteps = 3 }: { currentStep: number, totalSteps?: number }) => {
    const { colors } = useTheme();
    return (
        <View style={styles.stepIndicatorContainer}>
            {Array.from({ length: totalSteps }).map((_, index) => {
                const step = index + 1;
                const isActive = step === currentStep;
                const isCompleted = step < currentStep;

                return (
                    <View key={step} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={[
                            styles.stepBadge,
                            isActive ? { backgroundColor: '#FCD34D' } : { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
                            isCompleted && { backgroundColor: '#FCD34D', opacity: 0.5 }
                        ]}>
                            <Text style={[
                                styles.stepText,
                                isActive ? { color: '#FFF' } : { color: colors.text.secondary }
                            ]}>{step}</Text>
                        </View>
                        {step < totalSteps && (
                            <View style={{ width: 20, height: 2, backgroundColor: colors.border, marginHorizontal: 8 }} />
                        )}
                    </View>
                );
            })}
        </View>
    );
};

export default function CreatePostScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();

    // Get User Role
    const isAdmin = useAppSelector(state => state.user.isAdmin);

    // Flow State
    const [step, setStep] = useState(0); // 0 = Choice, 1-3 = Wizard
    const [postType, setPostType] = useState<PostType | null>(null);

    // Form State
    const [content, setContent] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Janaza Fields
    const [deceasedName, setDeceasedName] = useState('');
    const [deceasedFirstName, setDeceasedFirstName] = useState('');
    const [deceasedGender, setDeceasedGender] = useState<'male' | 'female'>('male');
    const [mosqueName, setMosqueName] = useState(''); // Derived from selection or manual
    const [janazaDate, setJanazaDate] = useState('');
    const [janazaTime, setJanazaTime] = useState('');
    const [isLocalBurial, setIsLocalBurial] = useState(true); // "Enterrement local"

    const [cemeteryName, setCemeteryName] = useState('');
    const [cemeteryAddress, setCemeteryAddress] = useState('');
    const [isRepatriation, setIsRepatriation] = useState(false); // Can be derived from !isLocalBurial if needed, or separate

    // Sick Visit Fields
    const [patientName, setPatientName] = useState('');
    const [hospitalName, setHospitalName] = useState('');
    const [visitingHours, setVisitingHours] = useState('');
    const [wardRoom, setWardRoom] = useState('');
    const [hasTimeConstraint, setHasTimeConstraint] = useState(false);
    const [timeConstraintStart, setTimeConstraintStart] = useState('00:00');
    const [timeConstraintEnd, setTimeConstraintEnd] = useState('00:00');
    const [comment, setComment] = useState('');

    // Time Picker Modal State
    const [showTimePicker, setShowTimePicker] = useState(false);


    // Shared Fields
    const [prayerTime, setPrayerTime] = useState(''); // Legacy, might merge with janazaTime

    // Location Picker
    const [locationModalVisible, setLocationModalVisible] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [locationAddress, setLocationAddress] = useState(''); // Store human readable address
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
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    const isRequestSubmission = !isAdmin && (postType === 'janaza' || postType === 'sick_visit');

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
        setSearchResults([]);
        setSearchQuery('');
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

    const confirmLocation = async () => {
        if (mapCenter) {
            setSelectedLocation(mapCenter);
            setLocationModalVisible(false);
            // Try to reverse geocode to get address for display
            try {
                // If a mosque was selected from marker, use its name
                if (selectedMosque) {
                    // Mosquename is already set in onMarkerPress if logic added there
                    // But let's ensure
                    setMosqueName(selectedMosque.name);
                    setLocationAddress(selectedMosque.address || "");
                } else {
                    // Reverse geocode
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${mapCenter.lat}&lon=${mapCenter.lng}&format=json`, {
                        headers: { 'User-Agent': 'UmarApp/1.0' }
                    });
                    const data = await response.json();
                    if (data && data.display_name) {
                        const city = data.address?.city || data.address?.town || data.address?.village || '';
                        const road = data.address?.road || '';
                        const postcode = data.address?.postcode || '';
                        setLocationAddress(`${road}, ${postcode} ${city}`);
                        if (!mosqueName) setMosqueName(`${road}, ${city}`); // Default if no mosque name
                    }
                }
            } catch (e) { console.log("Reverse geocode failed", e) }
        }
    };

    const handlePost = async () => {
        // Validation
        if (postType === 'sick_visit') {
            if (!patientName || !hospitalName) {
                Alert.alert(t('common.error'), "Please fill in all required fields.");
                return;
            }
        } else if (postType === 'janaza') {
            if (!deceasedName) { // relaxed validation for now, name is critical
                Alert.alert(t('common.error'), "Veuillez entrer le nom du défunt.");
                return;
            }
            if (!selectedLocation && !mosqueName) {
                Alert.alert(t('common.error'), "Veuillez sélectionner le lieu de la janaza.");
                return;
            }
        }

        if ((postType === 'janaza' || postType === 'sick_visit') && !selectedLocation) {
            // Fallback or warning could go here
        }

        Keyboard.dismiss();
        setIsSubmitting(true);

        try {
            let uploadedImageUrl = undefined;
            if (image && image !== DEFAULT_JANAZA_IMAGE) {
                uploadedImageUrl = await socialService.uploadImage(image);
            }

            let metadata = {};
            if (postType === 'janaza') {
                metadata = {
                    deceasedName: `${deceasedName} ${deceasedFirstName}`.trim(),
                    deceasedGender,
                    mosqueName: mosqueName || locationAddress,
                    prayerTime: janazaTime || 'After Prayer', // Use specific time or default
                    janazaDate: janazaDate,
                    mosqueLocation: selectedLocation,
                    cemeteryName: isLocalBurial ? cemeteryName : undefined, // If local, maybe send cemetery? Or handle logic.
                    isRepatriation: !isLocalBurial,
                    comment: comment,
                    locationAddress: locationAddress
                };
            } else if (postType === 'sick_visit') {
                metadata = {
                    patientName,
                    hospitalName,
                    visitingHours: hasTimeConstraint ? `${timeConstraintStart} - ${timeConstraintEnd}` : undefined,
                    ward: wardRoom,
                    hospitalLocation: selectedLocation,
                    comment: comment,
                    locationAddress: locationAddress
                };
            }

            const success = await socialService.createPost(content, postType!, metadata, uploadedImageUrl || undefined, selectedLocation || undefined);

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

    // Render Steps
    const renderStep0 = () => (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ fontSize: 24, fontFamily: fontBold, color: colors.text.primary, marginBottom: 40, textAlign: 'center' }}>
                Vous souhaitez ajouter ?
            </Text>
            <View style={{ flexDirection: 'row', gap: 40 }}>
                <Pressable
                    onPress={() => { setPostType('sick_visit'); setStep(1); }}
                    style={{ alignItems: 'center', gap: 10 }}
                >
                    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOpacity: 0.1, elevation: 5 }}>
                        <Image
                            source={require('@/assets/images/sick.png')}
                            style={{ width: 40, height: 40 }}
                            resizeMode="contain"
                        />
                    </View>
                </Pressable>

                <Pressable
                    onPress={() => { setPostType('janaza'); setStep(1); }}
                    style={{ alignItems: 'center', gap: 10 }}
                >
                    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOpacity: 0.1, elevation: 5 }}>
                        <Image
                            source={require('@/assets/images/death.png')}
                            style={{ width: 40, height: 40 }}
                            resizeMode="contain"
                        />
                    </View>
                </Pressable>
            </View>
        </View>
    );

    /**
     * JANAZA STEPS
     */
    const renderJanazaStep1 = () => (
        <ScrollView contentContainerStyle={styles.content}>
            <Animated.View entering={FadeInDown}>
                <StepIndicator currentStep={1} />

                {/* Gender Selection Avatars */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 40, marginVertical: 20 }}>
                    <Pressable onPress={() => setDeceasedGender('male')} style={{ alignItems: 'center', opacity: deceasedGender === 'male' ? 1 : 0.5 }}>
                        <Image source={require('@/assets/images/man.png')} style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#f0f0f0' }} resizeMode="cover" />
                    </Pressable>
                    <Pressable onPress={() => setDeceasedGender('female')} style={{ alignItems: 'center', opacity: deceasedGender === 'female' ? 1 : 0.5 }}>
                        <Image source={require('@/assets/images/woman.png')} style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#f0f0f0' }} resizeMode="cover" />
                    </Pressable>
                </View>

                <View style={styles.formContainer}>
                    <View style={[styles.inputRow, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                        <Ionicons name="person-outline" size={24} color={colors.text.primary} />
                        <TextInput
                            style={[styles.simpleInput, { color: colors.text.primary }]}
                            placeholder="Nom du défunt"
                            placeholderTextColor={colors.text.secondary}
                            value={deceasedName}
                            onChangeText={setDeceasedName}
                        />
                    </View>
                    <View style={[styles.inputRow, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                        <Ionicons name="person-outline" size={24} color={colors.text.primary} />
                        <TextInput
                            style={[styles.simpleInput, { color: colors.text.primary }]}
                            placeholder="Prénom du défunt"
                            placeholderTextColor={colors.text.secondary}
                            value={deceasedFirstName}
                            onChangeText={setDeceasedFirstName}
                        />
                    </View>

                    <View style={[styles.inputRow, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                        <Pressable onPress={openLocationPicker} style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingVertical: 8 }}>
                            <Ionicons name="location-outline" size={24} color={colors.text.primary} />
                            <Text style={{ marginLeft: 10, fontSize: 16, color: locationAddress ? colors.text.primary : colors.text.secondary, flex: 1 }}>
                                {locationAddress || "Lieu de la janaza"}
                            </Text>
                        </Pressable>
                    </View>

                    {/* Date Input - Simple Text for now */}
                    <View style={[styles.inputRow, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                        <Ionicons name="calendar-outline" size={24} color={colors.text.primary} />
                        <TextInput
                            style={[styles.simpleInput, { color: colors.text.primary }]}
                            placeholder="Date (DD/MM/YYYY)"
                            placeholderTextColor={colors.text.secondary}
                            value={janazaDate}
                            onChangeText={setJanazaDate}
                            keyboardType="numbers-and-punctuation"
                        />
                    </View>

                    {/* Time Input */}
                    <View style={[styles.inputRow, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                        <Ionicons name="time-outline" size={24} color={colors.text.primary} />
                        <TextInput
                            style={[styles.simpleInput, { color: colors.text.primary }]}
                            placeholder="Heure (HH:MM)"
                            placeholderTextColor={colors.text.secondary}
                            value={janazaTime}
                            onChangeText={setJanazaTime}
                            keyboardType="numbers-and-punctuation"
                        />
                    </View>

                </View>
            </Animated.View>
        </ScrollView>
    );

    const renderJanazaStep2 = () => (
        <ScrollView contentContainerStyle={styles.content}>
            <Animated.View entering={FadeInDown}>
                <StepIndicator currentStep={2} />

                <View style={{ marginTop: 20, gap: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Ionicons name="construct-outline" size={24} color={colors.text.primary} />
                            <Text style={{ fontSize: 16, fontFamily: fontMedium, color: colors.text.primary }}>Enterrement local</Text>
                        </View>
                        <Switch
                            value={isLocalBurial}
                            onValueChange={setIsLocalBurial}
                            trackColor={{ false: "#767577", true: "#FCD34D" }}
                            thumbColor={isLocalBurial ? "#f5dd4b" : "#f4f3f4"}
                        />
                    </View>

                    <View style={{ marginTop: 20 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <Ionicons name="location-outline" size={24} color={colors.text.primary} />
                            <Text style={{ fontSize: 16, fontFamily: fontMedium, color: colors.text.primary }}>Lieu de l&apos;enterrement</Text>
                        </View>
                        <TextInput
                            style={[styles.simpleInput, { color: colors.text.primary, borderBottomWidth: 1, borderBottomColor: colors.border }]}
                            placeholder="Nom du cimetière (facultatif)"
                            placeholderTextColor={colors.text.secondary}
                            value={cemeteryName}
                            onChangeText={setCemeteryName}
                        />
                    </View>

                    <View style={{ marginTop: 20 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <Ionicons name="chatbubble-outline" size={24} color={colors.text.primary} />
                            <Text style={{ fontSize: 16, fontFamily: fontMedium, color: colors.text.primary }}>Commentaire</Text>
                        </View>
                        <TextInput
                            style={{ minHeight: 100, backgroundColor: colors.input.background, borderRadius: 12, padding: 12, textAlignVertical: 'top', color: colors.text.primary }}
                            multiline
                            placeholder="Ajouter un commentaire..."
                            placeholderTextColor={colors.text.secondary}
                            value={comment}
                            onChangeText={setComment}
                        />
                    </View>
                </View>
            </Animated.View>
        </ScrollView>
    );

    const renderJanazaStep3 = () => (
        <ScrollView contentContainerStyle={styles.content}>
            <Animated.View entering={FadeInDown}>
                <StepIndicator currentStep={3} />

                <View style={{ marginTop: 20, backgroundColor: colors.surface, borderRadius: 16, padding: 16, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center' }}>
                            {/* Avatar or Icon */}
                            <Image source={require('@/assets/images/death.png')} style={{ width: 24, height: 24 }} resizeMode="contain" />
                        </View>
                        <Text style={{ marginLeft: 10, fontSize: 18, fontFamily: fontBold, color: '#8B5CF6' }}>
                            {deceasedName} {deceasedFirstName}
                        </Text>
                    </View>

                    <View style={{ gap: 15 }}>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <Ionicons name="location-outline" size={20} color={colors.text.secondary} />
                            <View>
                                <Text style={{ fontFamily: fontMedium, color: colors.text.primary }}>{mosqueName || "Lieu de prière"}</Text>
                                <Text style={{ color: colors.text.secondary, fontSize: 12 }}>{locationAddress}</Text>
                            </View>
                        </View>

                        {isLocalBurial && (
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <Ionicons name="leaf-outline" size={20} color={colors.text.secondary} />
                                <Text style={{ fontFamily: fontMedium, color: colors.text.primary }}>{cemeteryName || "Cimetière Local"}</Text>
                            </View>
                        )}

                        <View style={{ flexDirection: 'row', gap: 0, justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                                <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
                                <Text style={{ fontFamily: fontBold, color: colors.text.primary }}>{janazaDate}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                                <Ionicons name="time-outline" size={20} color={colors.text.secondary} />
                                <Text style={{ fontFamily: fontBold, color: colors.text.primary }}>{janazaTime}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </Animated.View>
        </ScrollView>
    );

    /**
     * SICK VISIT STEPS (Existing)
     */
    const renderSickStep1 = () => (
        <ScrollView contentContainerStyle={styles.content}>
            <Animated.View entering={FadeInDown}>
                <StepIndicator currentStep={1} />

                <View style={{ alignItems: 'center', marginVertical: 20 }}>
                </View>

                <View style={styles.formContainer}>
                    <View style={[styles.inputRow, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                        <Ionicons name="person-outline" size={24} color={colors.text.primary} />
                        <TextInput
                            style={[styles.simpleInput, { color: colors.text.primary }]}
                            placeholder="Nom du patient"
                            placeholderTextColor={colors.text.secondary}
                            value={patientName}
                            onChangeText={setPatientName}
                        />
                    </View>
                    <View style={[styles.inputRow, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                        <Ionicons name="business-outline" size={24} color={colors.text.primary} />
                        <TextInput
                            style={[styles.simpleInput, { color: colors.text.primary }]}
                            placeholder="Hôpital"
                            placeholderTextColor={colors.text.secondary}
                            value={hospitalName}
                            onChangeText={setHospitalName}
                        />
                    </View>
                    <View style={[styles.inputRow, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                        <Pressable onPress={openLocationPicker} style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingVertical: 8 }}>
                            <Ionicons name="location-outline" size={24} color={colors.text.primary} />
                            <Text style={{ marginLeft: 10, fontSize: 16, color: locationAddress ? colors.text.primary : colors.text.secondary, flex: 1 }}>
                                {locationAddress || "Lieu de l'hôpital"}
                            </Text>
                        </Pressable>
                    </View>
                    <View style={[styles.inputRow, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                        <Ionicons name="bed-outline" size={24} color={colors.text.primary} />
                        <TextInput
                            style={[styles.simpleInput, { color: colors.text.primary }]}
                            placeholder="Service / Etage / Chambre"
                            placeholderTextColor={colors.text.secondary}
                            value={wardRoom}
                            onChangeText={setWardRoom}
                        />
                    </View>
                </View>
            </Animated.View>
        </ScrollView>
    );

    const renderSickStep2 = () => (
        <ScrollView contentContainerStyle={styles.content}>
            <Animated.View entering={FadeInDown}>
                <StepIndicator currentStep={2} />

                <View style={{ marginTop: 20, gap: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Ionicons name="time-outline" size={24} color={colors.text.primary} />
                            <Text style={{ fontSize: 16, fontFamily: fontMedium, color: colors.text.primary }}>Contrainte horaire</Text>
                        </View>
                        <Switch
                            value={hasTimeConstraint}
                            onValueChange={(val) => {
                                setHasTimeConstraint(val);
                                if (val) setShowTimePicker(true);
                            }}
                            trackColor={{ false: "#767577", true: "#FCD34D" }}
                            thumbColor={hasTimeConstraint ? "#f5dd4b" : "#f4f3f4"}
                        />
                    </View>

                    {hasTimeConstraint && (
                        <Pressable onPress={() => setShowTimePicker(true)}>
                            <Text style={{ color: colors.primary, marginLeft: 34, fontSize: 18, fontFamily: fontMedium }}>
                                {timeConstraintStart} à {timeConstraintEnd}
                            </Text>
                        </Pressable>
                    )}

                    <View style={{ marginTop: 20 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <Ionicons name="chatbubble-outline" size={24} color={colors.text.primary} />
                            <Text style={{ fontSize: 16, fontFamily: fontMedium, color: colors.text.primary }}>Commentaire</Text>
                        </View>
                        <TextInput
                            style={{ minHeight: 100, backgroundColor: colors.input.background, borderRadius: 12, padding: 12, textAlignVertical: 'top', color: colors.text.primary }}
                            multiline
                            placeholder="Ajouter un commentaire..."
                            placeholderTextColor={colors.text.secondary}
                            value={comment}
                            onChangeText={setComment}
                        />
                    </View>
                </View>
            </Animated.View>
        </ScrollView>
    );

    const renderSickStep3 = () => (
        <ScrollView contentContainerStyle={styles.content}>
            <Animated.View entering={FadeInDown}>
                <StepIndicator currentStep={3} />

                <View style={{ marginTop: 20, backgroundColor: colors.surface, borderRadius: 16, padding: 16, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center' }}>
                            <Image source={require('@/assets/images/sick.png')} style={{ width: 24, height: 24 }} resizeMode="contain" />
                        </View>
                        <Text style={{ marginLeft: 10, fontSize: 18, fontFamily: fontBold, color: colors.primary }}>
                            {patientName || "Nom du Patient"}
                        </Text>
                    </View>

                    <View style={{ gap: 15 }}>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <Ionicons name="location-outline" size={20} color={colors.text.secondary} />
                            <View>
                                <Text style={{ fontFamily: fontMedium, color: colors.text.primary }}>{hospitalName}</Text>
                                <Text style={{ color: colors.text.secondary }}>{locationAddress}</Text>
                            </View>
                        </View>

                        {hasTimeConstraint && (
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <Ionicons name="time-outline" size={20} color={colors.text.secondary} />
                                <Text style={{ color: '#8B5CF6' }}>Contrainte horaire : {timeConstraintStart} - {timeConstraintEnd}</Text>
                            </View>
                        )}

                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <Ionicons name="business-outline" size={20} color={colors.text.secondary} />
                            <Text style={{ fontFamily: fontBold, color: colors.text.primary }}>{wardRoom}</Text>
                        </View>
                    </View>
                </View>
            </Animated.View>
        </ScrollView>
    );

    const TimePickerModal = () => (
        <Modal visible={showTimePicker} transparent animationType="fade" onRequestClose={() => setShowTimePicker(false)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ width: '80%', backgroundColor: colors.surface, borderRadius: 20, padding: 20, alignItems: 'center' }}>
                    <Pressable onPress={() => { setShowTimePicker(false); setHasTimeConstraint(false); }} style={{ position: 'absolute', top: 10, right: 10 }}>
                        <Ionicons name="close" size={24} color={colors.text.primary} />
                    </Pressable>
                    <Text style={{ fontSize: 16, fontFamily: fontMedium, textAlign: 'center', marginBottom: 10, marginTop: 10, color: colors.text.primary }}>
                        Indiquez le créneau à respecter
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 20 }}>
                        <TextInput
                            style={{ fontSize: 30, borderBottomWidth: 1, borderColor: colors.border, textAlign: 'center', width: 80, color: colors.text.primary }}
                            value={timeConstraintStart}
                            onChangeText={(text) => {
                                if (text.length <= 5) setTimeConstraintStart(text);
                            }}
                            placeholder="00:00"
                            keyboardType="numbers-and-punctuation"
                        />
                        <Text style={{ fontSize: 16, color: colors.text.primary }}>à</Text>
                        <TextInput
                            style={{ fontSize: 30, borderBottomWidth: 1, borderColor: colors.border, textAlign: 'center', width: 80, color: colors.text.primary }}
                            value={timeConstraintEnd}
                            onChangeText={(text) => {
                                if (text.length <= 5) setTimeConstraintEnd(text);
                            }}
                            placeholder="00:00"
                            keyboardType="numbers-and-punctuation"
                        />
                    </View>

                    <Pressable
                        onPress={() => setShowTimePicker(false)}
                        style={{ backgroundColor: '#FCD34D', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 10, marginTop: 10 }}
                    >
                        <Text style={{ fontFamily: fontBold, color: '#FFF' }}>Valider</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.surface }]}>
                <Pressable onPress={() => {
                    if (step > 0) {
                        if (step === 1) {
                            setStep(0);
                            setPostType(null);
                        }
                        else setStep(step - 1);
                    } else {
                        router.back();
                    }
                }} style={styles.closeButton}>
                    <Ionicons name={step > 0 ? "chevron-back" : "close"} size={26} color={colors.text.primary} />
                </Pressable>
                {step > 0 && <Text style={[styles.headerTitle, { fontFamily: fontRegular, color: colors.text.primary }]}>
                    {postType === 'sick_visit' ? 'Ajouter un malade à visiter' : 'Ajouter une salât janaza'}
                </Text>}
                <View style={{ width: 40 }} />
            </View>

            {step === 0 && renderStep0()}

            {/* SICK VISIT FLOW */}
            {postType === 'sick_visit' && step === 1 && renderSickStep1()}
            {postType === 'sick_visit' && step === 2 && renderSickStep2()}
            {postType === 'sick_visit' && step === 3 && renderSickStep3()}

            {/* JANAZA FLOW */}
            {postType === 'janaza' && step === 1 && renderJanazaStep1()}
            {postType === 'janaza' && step === 2 && renderJanazaStep2()}
            {postType === 'janaza' && step === 3 && renderJanazaStep3()}

            {/* Footer Buttons for Wizard */}
            {step > 0 && (
                <View style={[styles.footer, { paddingBottom: insets.bottom + 10, paddingTop: 10, backgroundColor: colors.background }]}>
                    {step === 1 && (
                        <Pressable style={[styles.mainButton, { backgroundColor: '#FCD34D' }]} onPress={() => setStep(2)}>
                            <Text style={styles.mainButtonText}>Suivant</Text>
                        </Pressable>
                    )}
                    {step === 2 && (
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <Pressable style={[styles.secondaryButton, { borderColor: colors.border }]} onPress={() => setStep(1)}>
                                <Text style={[styles.secondaryButtonText, { color: colors.text.secondary }]}>Revenir</Text>
                            </Pressable>
                            <Pressable style={[styles.mainButton, { backgroundColor: '#FCD34D', flex: 1 }]} onPress={() => setStep(3)}>
                                <Text style={styles.mainButtonText}>Suivant</Text>
                            </Pressable>
                        </View>
                    )}
                    {step === 3 && (
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <Pressable style={[styles.secondaryButton, { borderColor: colors.border }]} onPress={() => setStep(2)}>
                                <Text style={[styles.secondaryButtonText, { color: colors.text.secondary }]}>Revenir</Text>
                            </Pressable>
                            <Pressable style={[styles.mainButton, { backgroundColor: '#FCD34D', flex: 1 }]} onPress={handlePost} disabled={isSubmitting}>
                                {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.mainButtonText}>Valider</Text>}
                            </Pressable>
                        </View>
                    )}
                </View>
            )}

            {/* Time Picker Modal */}
            <TimePickerModal />

            {/* Location Modal */}
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
                        <View style={styles.centerPinContainer} pointerEvents="none">
                            <Ionicons name="location" size={40} color={colors.primary} />
                        </View>
                    </View>
                </View>
            </Modal>

            <SuccessModal
                visible={successModalVisible}
                title={
                    isRequestSubmission
                        ? t('feed.requestSubmittedTitle')
                        : t('common.success')
                }
                message={
                    isRequestSubmission
                        ? t('feed.requestSubmittedMessage')
                        : t('feed.postCreated')
                }
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    closeButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 17,
    },
    content: {
        padding: 20,
        paddingBottom: 100,
    },
    stepIndicatorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    stepBadge: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    formContainer: {
        gap: 20,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        paddingVertical: 10,
    },
    simpleInput: {
        flex: 1,
        fontSize: 16,
        borderBottomWidth: 0,
        paddingVertical: 8,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    mainButton: {
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        paddingHorizontal: 30,
        backgroundColor: 'transparent',
    },
    secondaryButtonText: {
        fontSize: 16,
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
        marginBottom: 40,
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
});

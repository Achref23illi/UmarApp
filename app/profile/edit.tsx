import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Images } from '@/config/assets';
import { Fonts } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { socialService } from '@/services/socialService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadUser } from '@/store/slices/userSlice';

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.user);

  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(user.name || '');
  const [age, setAge] = useState(user.age ? user.age.toString() : '');
  const [phone, setPhone] = useState(user.phone_number || '');
  const [gender, setGender] = useState<'male' | 'female' | null>(user.gender);
  const [coverUri, setCoverUri] = useState<string | null>(null);

  const fontRegular = Fonts.regular;
  const fontMedium = Fonts.medium;
  const fontSemiBold = Fonts.semiBold;
  const fontBold = Fonts.bold;

  const pickCover = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 1],
        quality: 0.85,
      });

      if (!result.canceled) {
        setCoverUri(result.assets[0].uri);
      }
    } catch (e) {
      console.error('pickCover error:', e);
      Alert.alert('Error', 'Unable to pick image');
    }
  };

  const handleSave = async () => {
    if (!name) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setIsLoading(true);
    try {
      let coverUrl = user.cover_url || null;
      if (coverUri) {
        const uploaded = await socialService.uploadImage(coverUri);
        if (!uploaded) {
          throw new Error('Cover upload failed');
        }
        coverUrl = uploaded;
      }

      const updates = {
        id: user.id,
        full_name: name,
        age: age ? parseInt(age) : null,
        phone_number: phone,
        gender: gender,
        cover_url: coverUrl,
        updated_at: new Date(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updates);

      if (error) throw error;

      // Reload user in Redux
      await dispatch(loadUser()).unwrap();

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: colors.surface }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={[styles.title, { fontFamily: fontBold, color: colors.text.primary }]}>
          Edit Profile
        </Text>
        <Pressable onPress={handleSave} disabled={isLoading} style={styles.saveButton}>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.saveText, { fontFamily: fontSemiBold, color: colors.primary }]}>
              Save
            </Text>
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { fontFamily: fontMedium, color: colors.text.secondary }]}>
              Cover Photo
            </Text>

            <Pressable onPress={pickCover} style={styles.coverWrapper}>
              <Image
                source={coverUri ? { uri: coverUri } : user.cover_url ? { uri: user.cover_url } : Images.welcomeBackground}
                style={styles.coverImage}
                contentFit="cover"
              />
              <View style={[styles.coverOverlay, { backgroundColor: 'rgba(0,0,0,0.35)' }]}>
                <Ionicons name="camera-outline" size={18} color="#fff" />
                <Text style={[styles.coverOverlayText, { fontFamily: fontMedium, color: '#fff' }]}>
                  Change
                </Text>
              </View>
            </Pressable>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { fontFamily: fontMedium, color: colors.text.secondary }]}>
              Full Name
            </Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.input.background, borderColor: colors.input.border }]}>
               <TextInput
                style={[styles.input, { fontFamily: fontRegular, color: colors.text.primary }]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={colors.input.placeholder}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { fontFamily: fontMedium, color: colors.text.secondary }]}>
              Gender
            </Text>
            <View style={styles.genderContainer}>
               <Pressable 
                  onPress={() => setGender('male')}
                  style={[
                      styles.genderButton, 
                      { 
                        backgroundColor: gender === 'male' ? colors.secondary + '20' : colors.input.background,
                        borderColor: gender === 'male' ? colors.secondary : colors.input.border 
                      }
                  ]}
                >
                   <Text style={{ fontSize: 24 }}>🧔‍♂️</Text>
                   <Text style={[styles.genderText, { fontFamily: fontMedium, color: gender === 'male' ? colors.text.primary : colors.text.secondary }]}>Akhi</Text>
                </Pressable>
                <Pressable 
                  onPress={() => setGender('female')}
                   style={[
                      styles.genderButton, 
                      { 
                        backgroundColor: gender === 'female' ? colors.secondary + '20' : colors.input.background,
                        borderColor: gender === 'female' ? colors.secondary : colors.input.border 
                      }
                  ]}
                >
                   <Text style={{ fontSize: 24 }}>🧕</Text>
                   <Text style={[styles.genderText, { fontFamily: fontMedium, color: gender === 'female' ? colors.text.primary : colors.text.secondary }]}>Okht</Text>
                </Pressable>
            </View>
          </View>

           <View style={styles.inputGroup}>
            <Text style={[styles.label, { fontFamily: fontMedium, color: colors.text.secondary }]}>
              Age
            </Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.input.background, borderColor: colors.input.border }]}>
               <TextInput
                style={[styles.input, { fontFamily: fontRegular, color: colors.text.primary }]}
                value={age}
                onChangeText={setAge}
                placeholder="Enter your age"
                placeholderTextColor={colors.input.placeholder}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { fontFamily: fontMedium, color: colors.text.secondary }]}>
              Phone Number
            </Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.input.background, borderColor: colors.input.border }]}>
               <TextInput
                style={[styles.input, { fontFamily: fontRegular, color: colors.text.primary }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                placeholderTextColor={colors.input.placeholder}
                keyboardType="phone-pad"
              />
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 17,
  },
  saveButton: {
    padding: 8,
  },
  saveText: {
    fontSize: 17,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  coverWrapper: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coverOverlayText: {
    fontSize: 13,
  },
  label: {
    fontSize: 15,
    marginLeft: 4,
  },
  inputContainer: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  genderText: {
    fontSize: 15,
  },
});

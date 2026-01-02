import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Keyboard,
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

import { Fonts } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { socialService } from '@/services/socialService';

export default function AdminCreatePostScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();

    const [content, setContent] = useState('');
    const [type, setType] = useState<'general' | 'event'>('general');
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

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

    const handlePost = async () => {
        if (!content.trim()) {
            Alert.alert('Error', 'Please enter some content');
            return;
        }

        setLoading(true);
        Keyboard.dismiss();

        try {
            let imageUrl = undefined;
            if (image) {
                const uploaded = await socialService.uploadImage(image);
                if (uploaded) imageUrl = uploaded;
            }

            const success = await socialService.createPost(
                content,
                type,
                {}, // metadata
                imageUrl
            );

            if (success) {
                Alert.alert('Success', 'Post published successfully', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                Alert.alert('Error', 'Failed to publish post');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.surface }]}>
                <Pressable onPress={() => router.back()} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={colors.text.primary} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: colors.text.primary, fontFamily: Fonts.bold }]}>
                    New {type === 'general' ? 'Post' : 'Event'}
                </Text>
                <Pressable onPress={handlePost} disabled={loading || !content.trim()}>
                    {loading ? (
                        <ActivityIndicator color={colors.primary} />
                    ) : (
                        <Text style={[styles.postButton, { color: content.trim() ? colors.primary : colors.text.disabled, fontFamily: Fonts.semiBold }]}>
                            Post
                        </Text>
                    )}
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                
                {/* Type Selector */}
                <View style={styles.typeContainer}>
                    <Pressable 
                        onPress={() => setType('general')}
                        style={[styles.typeButton, type === 'general' && { backgroundColor: colors.primary }]}
                    >
                        <Text style={[styles.typeText, { color: type === 'general' ? '#FFF' : colors.text.secondary, fontFamily: Fonts.medium }]}>
                            General
                        </Text>
                    </Pressable>
                    <Pressable 
                        onPress={() => setType('event')}
                        style={[styles.typeButton, type === 'event' && { backgroundColor: colors.primary }]}
                    >
                        <Text style={[styles.typeText, { color: type === 'event' ? '#FFF' : colors.text.secondary, fontFamily: Fonts.medium }]}>
                            Event
                        </Text>
                    </Pressable>
                </View>

                {/* Content Input */}
                <TextInput
                    style={[styles.input, { color: colors.text.primary, fontFamily: Fonts.regular }]}
                    placeholder="What's happening in the community?"
                    placeholderTextColor={colors.text.secondary}
                    multiline
                    value={content}
                    onChangeText={setContent}
                    textAlignVertical="top"
                />

                {/* Image Preview */}
                {image && (
                    <View style={styles.imagePreview}>
                        <Image source={{ uri: image }} style={styles.image} />
                        <Pressable onPress={() => setImage(null)} style={styles.removeImage}>
                            <Ionicons name="close-circle" size={24} color="#FFF" />
                        </Pressable>
                    </View>
                )}

            </ScrollView>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
            >
                <View style={[styles.toolbar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                    <Pressable onPress={pickImage} style={styles.toolbarButton}>
                        <Ionicons name="image-outline" size={24} color={colors.primary} />
                        <Text style={[styles.toolbarText, { color: colors.text.primary }]}>Add Photo</Text>
                    </Pressable>
                </View>
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
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    closeButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 17,
    },
    postButton: {
        fontSize: 16,
        padding: 8,
    },
    scrollContent: {
        padding: 20,
    },
    typeContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    typeButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    typeText: {
        fontSize: 14,
    },
    input: {
        fontSize: 16,
        lineHeight: 24,
        minHeight: 150,
    },
    imagePreview: {
        marginTop: 20,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: 250,
        backgroundColor: '#F3F4F6',
    },
    removeImage: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
    },
    toolbar: {
        padding: 16,
        borderTopWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    toolbarButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 8,
    },
    toolbarText: {
        fontSize: 15,
        fontWeight: '500',
    }
});

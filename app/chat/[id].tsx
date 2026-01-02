import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { Message, socialService } from '@/services/socialService';

export default function ChatRoomScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const otherUserId = Array.isArray(id) ? id[0] : id;
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const flatListRef = useRef<FlatList>(null);

    const loadMessages = async () => {
        if (!otherUserId) return;
        const data = await socialService.getMessages(otherUserId);
        setMessages(data.reverse()); // Reverse for inverted list
        setLoading(false);
    };

    useEffect(() => {
        loadMessages();
        const interval = setInterval(loadMessages, 5000); // Poll every 5s for MVP
        return () => clearInterval(interval);
    }, [otherUserId]);

    const handleSend = async () => {
        if (!inputText.trim() || !otherUserId) return;

        const content = inputText.trim();
        setInputText('');

        const success = await socialService.sendMessage(otherUserId, content);
        if (success) {
            loadMessages();
        } else {
            // Restore text on fail? For now, just simplistic
        }
    };

    const renderItem = ({ item }: { item: Message }) => {
        const isMyMessage = item.receiver_id === otherUserId; // If I sent it, receiver is the other guy
        // Wait, logic check: 
        // If I am sender, receiver_id is otherUserId.
        // Item has sender_id and receiver_id.
        // My ID is not directly available here unless I fetch it or assume logic.
        // Better: I compare sender_id to otherUserId.
        // If sender_id === otherUserId, it's received.
        // If sender_id !== otherUserId, it's sent (by me).
        
        const isReceived = item.sender_id === otherUserId;

        return (
            <View style={[
                styles.messageBubble, 
                isReceived ? styles.receivedBubble : styles.sentBubble,
                { backgroundColor: isReceived ? (isDark ? '#374151' : '#E5E7EB') : colors.primary }
            ]}>
                <Text style={[
                    styles.messageText, 
                    { color: isReceived ? colors.text.primary : '#FFF', fontFamily: Fonts.regular }
                ]}>
                    {item.content}
                </Text>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.surface }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: colors.text.primary, fontFamily: Fonts.semiBold }]}>
                    Chat
                </Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    inverted
                    contentContainerStyle={styles.listContent}
                />
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View style={[styles.inputContainer, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 10 }]}>
                    <TextInput
                        style={[styles.input, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6', color: colors.text.primary }]}
                        placeholder="Type a message..."
                        placeholderTextColor={colors.text.secondary}
                        value={inputText}
                        onChangeText={setInputText}
                    />
                    <Pressable onPress={handleSend} style={[styles.sendButton, { backgroundColor: colors.primary }]}>
                        <Ionicons name="send" size={20} color="#FFF" />
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
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 8,
    },
    receivedBubble: {
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
    },
    sentBubble: {
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    inputContainer: {
        flexDirection: 'row', // Use row to layout input and button
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        gap: 12,
    },
    input: {
        flex: 1,
        height: 48, // Fixed height for input
        height: 40,
        borderRadius: 20,
        paddingHorizontal: 16,
        fontSize: 15,
        textAlignVertical: 'center', // for android
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    }
});

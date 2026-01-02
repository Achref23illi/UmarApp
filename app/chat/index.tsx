import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { socialService } from '@/services/socialService';
import { useAppSelector } from '@/store/hooks';
import { useFocusEffect } from 'expo-router';

export default function ChatListScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const currentUserId = useAppSelector(state => state.user.currentUser?.id);

    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadMatches = async () => {
        const data = await socialService.getMatches();
        setMatches(data);
        setLoading(false);
        setRefreshing(false);
    };

    useFocusEffect(
        useCallback(() => {
            loadMatches();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadMatches();
    };

    const handleAccept = async (matchId: string) => {
        const success = await socialService.updateMatchStatus(matchId, 'accepted');
        if (success) loadMatches();
    };

    const handleReject = async (matchId: string) => {
        const success = await socialService.updateMatchStatus(matchId, 'rejected');
        if (success) loadMatches();
    };

    const renderItem = ({ item }: { item: any }) => {
        const isChallenger = item.challenger_id === currentUserId;
        const otherUser = isChallenger ? item.opponent : item.challenger;
        
        if (!otherUser) return null;

        return (
            <Pressable 
                style={[styles.itemContainer, { backgroundColor: colors.surface, borderColor: 'rgba(0,0,0,0.05)' }]}
                onPress={() => {
                    if (item.status === 'accepted') {
                        router.push(`/chat/${otherUser.id}`);
                    }
                }}
            >
                <Image source={{ uri: otherUser.avatar_url || 'https://i.pravatar.cc/150' }} style={styles.avatar} />
                <View style={styles.content}>
                    <Text style={[styles.name, { color: colors.text.primary, fontFamily: Fonts.semiBold }]}>
                        {otherUser.full_name || 'Unknown User'}
                    </Text>
                    <Text style={[styles.status, { color: colors.text.secondary, fontFamily: Fonts.regular }]}>
                        {item.status === 'pending' ? 'Pending Request' : 'Connected'}
                    </Text>
                </View>

                {item.status === 'pending' && !isChallenger && (
                    <View style={styles.actions}>
                        <Pressable onPress={() => handleAccept(item.id)} style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
                            <Ionicons name="checkmark" size={16} color="#FFF" />
                        </Pressable>
                        <Pressable onPress={() => handleReject(item.id)} style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}>
                            <Ionicons name="close" size={16} color="#FFF" />
                        </Pressable>
                    </View>
                )}

                {item.status === 'accepted' && (
                    <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
                )}
            </Pressable>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.surface }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Pressable onPress={() => router.back()} style={{ marginRight: 10, padding: 4 }}>
                        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                    </Pressable>
                    <Text style={[styles.headerTitle, { color: colors.text.primary, fontFamily: Fonts.bold }]}>
                        Connections
                    </Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={matches}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>No connections yet.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    headerTitle: {
        fontSize: 22,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#EEE',
    },
    content: {
        flex: 1,
        marginLeft: 12,
    },
    name: {
        fontSize: 16,
    },
    status: {
        fontSize: 13,
        marginTop: 2,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
    }
});

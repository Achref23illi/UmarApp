import { Fonts } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface User {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    gender: string | null;
    age: number | null;
    phone_number: string | null;
    is_admin: boolean;
    created_at: string;
}

export default function AdminUsersScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const { t } = useTranslation();

    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useFocusEffect(
        React.useCallback(() => {
            fetchUsers();
        }, [])
    );

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            setUsers(data || []);
            setFilteredUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchUsers();
        setRefreshing(false);
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setFilteredUsers(users);
        } else {
            const filtered = users.filter(
                (user) =>
                    user.full_name?.toLowerCase().includes(query.toLowerCase()) ||
                    user.email?.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredUsers(filtered);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const renderUserCard = ({ item }: { item: User }) => (
        <View style={[styles.userCard, { backgroundColor: colors.surface }]}>
            <View style={styles.userHeader}>
                {item.avatar_url ? (
                    <Image
                        source={{ uri: item.avatar_url }}
                        style={styles.avatar}
                        contentFit="cover"
                    />
                ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.avatarText, { color: colors.primary, fontFamily: Fonts.bold }]}>
                            {item.full_name?.charAt(0)?.toUpperCase() || item.email?.charAt(0)?.toUpperCase() || '?'}
                        </Text>
                    </View>
                )}
                <View style={styles.userInfo}>
                    <View style={styles.nameRow}>
                        <Text style={[styles.userName, { color: colors.text.primary, fontFamily: Fonts.semiBold }]} numberOfLines={1}>
                            {item.full_name || 'Utilisateur'}
                        </Text>
                        {item.is_admin && (
                            <View style={[styles.adminBadge, { backgroundColor: colors.primary }]}>
                                <Text style={[styles.adminBadgeText, { fontFamily: Fonts.medium }]}>Admin</Text>
                            </View>
                        )}
                    </View>
                    <Text style={[styles.userEmail, { color: colors.text.secondary }]} numberOfLines={1}>
                        {item.email}
                    </Text>
                </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.userDetails}>
                <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                        <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
                        <Text style={[styles.detailText, { color: colors.text.secondary }]}>
                            {formatDate(item.created_at)}
                        </Text>
                    </View>
                    {item.gender && (
                        <View style={styles.detailItem}>
                            <Ionicons 
                                name={item.gender === 'male' ? 'male' : 'female'} 
                                size={16} 
                                color={colors.text.secondary} 
                            />
                            <Text style={[styles.detailText, { color: colors.text.secondary }]}>
                                {item.gender === 'male' ? 'Homme' : 'Femme'}
                            </Text>
                        </View>
                    )}
                </View>
                <View style={styles.detailRow}>
                    {item.age && (
                        <View style={styles.detailItem}>
                            <Ionicons name="person-outline" size={16} color={colors.text.secondary} />
                            <Text style={[styles.detailText, { color: colors.text.secondary }]}>
                                {item.age} ans
                            </Text>
                        </View>
                    )}
                    {item.phone_number && (
                        <View style={styles.detailItem}>
                            <Ionicons name="call-outline" size={16} color={colors.text.secondary} />
                            <Text style={[styles.detailText, { color: colors.text.secondary }]}>
                                {item.phone_number}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.surface }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: colors.text.primary, fontFamily: Fonts.bold }]}>
                    Utilisateurs
                </Text>
                <View style={styles.headerRight}>
                    <Text style={[styles.countBadge, { color: colors.primary, fontFamily: Fonts.semiBold }]}>
                        {filteredUsers.length}
                    </Text>
                </View>
            </View>

            {/* Search */}
            <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
                <View style={[styles.searchBar, { backgroundColor: colors.background }]}>
                    <Ionicons name="search" size={20} color={colors.text.secondary} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text.primary }]}
                        placeholder="Rechercher un utilisateur..."
                        placeholderTextColor={colors.text.secondary}
                        value={searchQuery}
                        onChangeText={handleSearch}
                    />
                    {searchQuery.length > 0 && (
                        <Pressable onPress={() => handleSearch('')}>
                            <Ionicons name="close-circle" size={18} color={colors.text.secondary} />
                        </Pressable>
                    )}
                </View>
            </View>

            {/* Users List */}
            <FlatList
                data={filteredUsers}
                renderItem={renderUserCard}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={64} color={colors.text.secondary} />
                        <Text style={[styles.emptyText, { color: colors.text.secondary, fontFamily: Fonts.medium }]}>
                            {searchQuery ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur'}
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
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
    headerRight: {
        minWidth: 40,
        alignItems: 'flex-end',
    },
    countBadge: {
        fontSize: 16,
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        height: 46,
        borderRadius: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
    },
    listContent: {
        padding: 16,
        gap: 12,
    },
    userCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 4,
    },
    userHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 20,
    },
    userInfo: {
        flex: 1,
        marginLeft: 12,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    userName: {
        fontSize: 16,
        flex: 1,
    },
    adminBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    adminBadgeText: {
        color: '#FFF',
        fontSize: 10,
    },
    userEmail: {
        fontSize: 13,
        marginTop: 2,
    },
    divider: {
        height: 1,
        marginVertical: 12,
    },
    userDetails: {
        gap: 8,
    },
    detailRow: {
        flexDirection: 'row',
        gap: 16,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 13,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    emptyText: {
        fontSize: 16,
    },
});

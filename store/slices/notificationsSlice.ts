import { supabase } from '@/lib/supabase';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

// ── Types ────────────────────────────────────────────────

export interface AppNotification {
    id: string;
    user_id: string;
    title: string;
    body: string;
    data: Record<string, unknown>;
    is_read: boolean;
    created_at: string;
}

interface NotificationsState {
    items: AppNotification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
}

const initialState: NotificationsState = {
    items: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
};

// ── Thunks ───────────────────────────────────────────────

export const fetchNotifications = createAsyncThunk(
    'notifications/fetch',
    async (_, { rejectWithValue }) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return rejectWithValue('Not authenticated');

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            return data as AppNotification[];
        } catch (err: any) {
            return rejectWithValue(err.message || 'Failed to fetch notifications');
        }
    }
);

export const markAsRead = createAsyncThunk(
    'notifications/markAsRead',
    async (notificationId: string, { rejectWithValue }) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);

            if (error) throw error;
            return notificationId;
        } catch (err: any) {
            return rejectWithValue(err.message || 'Failed to mark as read');
        }
    }
);

export const markAllAsRead = createAsyncThunk(
    'notifications/markAllAsRead',
    async (_, { rejectWithValue }) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return rejectWithValue('Not authenticated');

            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (error) throw error;
            return true;
        } catch (err: any) {
            return rejectWithValue(err.message || 'Failed to mark all as read');
        }
    }
);

// ── Slice ────────────────────────────────────────────────

const notificationsSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        clearNotifications: (state) => {
            state.items = [];
            state.unreadCount = 0;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.isLoading = false;
                state.items = action.payload;
                state.unreadCount = action.payload.filter((n) => !n.is_read).length;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(markAsRead.fulfilled, (state, action) => {
                const item = state.items.find((n) => n.id === action.payload);
                if (item && !item.is_read) {
                    item.is_read = true;
                    state.unreadCount = Math.max(0, state.unreadCount - 1);
                }
            })
            .addCase(markAllAsRead.fulfilled, (state) => {
                state.items.forEach((n) => (n.is_read = true));
                state.unreadCount = 0;
            });
    },
});

export const { clearNotifications } = notificationsSlice.actions;
export default notificationsSlice.reducer;

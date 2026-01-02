import { supabase } from '@/lib/supabase';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserState {
  id: string | null;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  age: number | null;
  gender: 'male' | 'female' | null;
  phone_number: string | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    language: string;
  };
}

const initialState: UserState = {
  id: null,
  name: null,
  email: null,
  avatar_url: null,
  age: null,
  gender: null,
  phone_number: null,
  token: null,
  isAuthenticated: false,
  isAdmin: false,
  isLoading: true, // Start as true to wait for auth check
  error: null,
  preferences: {
    theme: 'system',
    notifications: true,
    language: 'en',
  },
};

// --- Async Thunks ---

export const loadUser = createAsyncThunk('user/loadUser', async (_, { rejectWithValue }) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('loadUser - session:', !!session, session?.user?.email);
    
    if (!session) {
      console.log('loadUser - No session, returning null');
      return null;
    }

    // Fetch user profile from backend
    const { data: profile, error } = await supabase
       .from('profiles')
       .select('*')
       .eq('id', session.user.id)
       .single();

    console.log('loadUser - profile:', profile?.email, 'is_admin:', profile?.is_admin);
    
    if (error) {
      console.error('loadUser - profile error:', error);
    }

    return { session, profile };
  } catch (error: any) {
    console.error('loadUser - error:', error);
    return rejectWithValue(error.message);
  }
});

export const loginUser = createAsyncThunk(
  'user/login',
  async ({ email, password }: any, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // Profile will be loaded via loadUser usually, or we fetch here
       const { data: profile } = await supabase
       .from('profiles')
       .select('*')
       .eq('id', data.user.id)
       .single();

      return { session: data.session, profile };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'user/register',
  async ({ email, password, fullName }: any, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      if (error) throw error;
      
      // If email confirmation is enabled, session might be null
      if (!data.session) {
         // Return minimal data or handle "check email" state
         return { session: null, user: data.user, profile: { full_name: fullName, avatar_url: null } }; 
      }

      return { session: data.session, profile: { full_name: fullName, avatar_url: null } };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const logoutUser = createAsyncThunk('user/logout', async (_, { rejectWithValue }) => {
    try {
        await supabase.auth.signOut();
    } catch (error: any) {
        return rejectWithValue(error.message);
    }
});

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    updatePreferences: (state, action: PayloadAction<Partial<UserState['preferences']>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.preferences.theme = action.payload;
    },
    toggleNotifications: (state) => {
      state.preferences.notifications = !state.preferences.notifications;
    },
    clearError: (state) => {
        state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Load User
    builder.addCase(loadUser.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(loadUser.fulfilled, (state, action) => {
      state.isLoading = false;
      if (action.payload) {
        state.isAuthenticated = true;
        state.token = action.payload.session.access_token;
        state.id = action.payload.session.user.id;
        state.email = action.payload.session.user.email || null;
        state.name = action.payload.profile?.full_name || null;
        state.avatar_url = action.payload.profile?.avatar_url || null;
        state.age = action.payload.profile?.age || null;
        state.gender = action.payload.profile?.gender || null;
        state.phone_number = action.payload.profile?.phone_number || null;
        state.isAdmin = action.payload.profile?.is_admin || false;
      } else {
        state.isAuthenticated = false;
        state.token = null;
      }
    });
    builder.addCase(loadUser.rejected, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.token = null;
    });

    // Login
    builder.addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.session.access_token;
        state.id = action.payload.session.user.id;
        state.email = action.payload.session.user.email || null;
        state.name = action.payload.profile?.full_name || null;
        state.avatar_url = action.payload.profile?.avatar_url || null;
        state.age = action.payload.profile?.age || null;
        state.gender = action.payload.profile?.gender || null;
        state.phone_number = action.payload.profile?.phone_number || null;
        state.isAdmin = action.payload.profile?.is_admin || false;
    });
    builder.addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
    });

    // Register
    builder.addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        // Only set authenticated if session exists (email might need confirmation)
        if (action.payload.session) {
            state.isAuthenticated = true;
            state.token = action.payload.session.access_token;
            state.id = action.payload.session.user.id;
            state.email = action.payload.session.user.email || null;
            state.name = action.payload.profile?.full_name || null;
            state.avatar_url = action.payload.profile?.avatar_url || null;
        } else {
            // Registration successful but no session (verification needed)
            state.isAuthenticated = false;
        }
    });
    builder.addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
    });

    // Logout
    builder.addCase(logoutUser.fulfilled, (state) => {
        state.id = null;
        state.name = null;
        state.email = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isAdmin = false;
        state.avatar_url = null;
        state.age = null;
        state.gender = null;
        state.phone_number = null;
    });
  }
});

export const { setLoading, updatePreferences, setTheme, toggleNotifications, clearError } =
  userSlice.actions;

export default userSlice.reducer;

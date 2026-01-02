import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AppState {
  isReady: boolean;
  isOnline: boolean;
  currentRoute: string | null;
  modal: {
    isVisible: boolean;
    type: string | null;
    data: any;
  };
  toast: {
    isVisible: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null;
}

const initialState: AppState = {
  isReady: false,
  isOnline: true,
  currentRoute: null,
  modal: {
    isVisible: false,
    type: null,
    data: null,
  },
  toast: null,
};

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setAppReady: (state, action: PayloadAction<boolean>) => {
      state.isReady = action.payload;
    },
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    setCurrentRoute: (state, action: PayloadAction<string | null>) => {
      state.currentRoute = action.payload;
    },
    showModal: (state, action: PayloadAction<{ type: string; data?: any }>) => {
      state.modal = {
        isVisible: true,
        type: action.payload.type,
        data: action.payload.data || null,
      };
    },
    hideModal: (state) => {
      state.modal = {
        isVisible: false,
        type: null,
        data: null,
      };
    },
    showToast: (
      state,
      action: PayloadAction<{ message: string; type: 'success' | 'error' | 'warning' | 'info' }>
    ) => {
      state.toast = {
        isVisible: true,
        message: action.payload.message,
        type: action.payload.type,
      };
    },
    hideToast: (state) => {
      state.toast = null;
    },
  },
});

export const {
  setAppReady,
  setOnlineStatus,
  setCurrentRoute,
  showModal,
  hideModal,
  showToast,
  hideToast,
} = appSlice.actions;

export default appSlice.reducer;

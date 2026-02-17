import { configureStore } from '@reduxjs/toolkit';
import appReducer from './slices/appSlice';
import counterReducer from './slices/counterSlice';
import languageReducer from './slices/languageSlice';
import notificationsReducer from './slices/notificationsSlice';
import userReducer from './slices/userSlice';
import agendaReducer from './slices/agendaSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    user: userReducer,
    app: appReducer,
    language: languageReducer,
    agenda: agendaReducer,
    notifications: notificationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

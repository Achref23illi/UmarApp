import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AgendaState {
  ids: string[];
  pinnedIds: string[];
}

const initialState: AgendaState = {
  ids: [],
  pinnedIds: [],
};

const agendaSlice = createSlice({
  name: 'agenda',
  initialState,
  reducers: {
    setAgendaEntries(state, action: PayloadAction<{ ids: string[]; pinnedIds: string[] }>) {
      state.ids = action.payload.ids;
      state.pinnedIds = action.payload.pinnedIds;
    },
    setInAgenda(state, action: PayloadAction<{ postId: string; pinned?: boolean }>) {
      if (!state.ids.includes(action.payload.postId)) {
        state.ids.push(action.payload.postId);
      }
      if (action.payload.pinned && !state.pinnedIds.includes(action.payload.postId)) {
        state.pinnedIds.push(action.payload.postId);
      }
    },
    removeFromAgenda(state, action: PayloadAction<string>) {
      state.ids = state.ids.filter((id) => id !== action.payload);
      state.pinnedIds = state.pinnedIds.filter((id) => id !== action.payload);
    },
    setPinned(state, action: PayloadAction<{ postId: string; pinned: boolean }>) {
      const { postId, pinned } = action.payload;
      if (pinned) {
        if (!state.pinnedIds.includes(postId)) state.pinnedIds.push(postId);
      } else {
        state.pinnedIds = state.pinnedIds.filter((id) => id !== postId);
      }
      if (pinned && !state.ids.includes(postId)) {
        state.ids.push(postId);
      }
    },
  },
});

export const { setAgendaEntries, setInAgenda, removeFromAgenda, setPinned } = agendaSlice.actions;
export default agendaSlice.reducer;

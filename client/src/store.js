import { configureStore, createSlice } from '@reduxjs/toolkit';
const sessionSlice = createSlice({
  name: 'session', initialState: { token: localStorage.getItem('staffsync_token'), user: JSON.parse(localStorage.getItem('staffsync_user') || 'null') },
  reducers: {
    setSession(state, action) { state.token = action.payload.token; state.user = action.payload.user; localStorage.setItem('staffsync_token', state.token); localStorage.setItem('staffsync_user', JSON.stringify(state.user)); },
    clearSession(state) { state.token = null; state.user = null; localStorage.removeItem('staffsync_token'); localStorage.removeItem('staffsync_user'); }
  }
});
export const { setSession, clearSession } = sessionSlice.actions;
export const store = configureStore({ reducer: { session: sessionSlice.reducer } });

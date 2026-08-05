/**
 * [인증 Redux Slice]
 *
 * 상태: user / loading / error
 * UI 에서는 Request 만 dispatch → saga 가 API 호출
 */
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthLoginRequest, AuthUser } from "../types/authTypes";

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
};

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // ----- 로그인 -----
    fetchAuthLoginRequest(state, _action: PayloadAction<AuthLoginRequest>) {
      state.loading = true;
      state.error = null;
    },
    fetchAuthLoginSuccess(state, action: PayloadAction<AuthUser>) {
      state.loading = false;
      state.user = action.payload;
    },
    fetchAuthLoginFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // ----- 세션 확인 (me) -----
    fetchAuthMeRequest(state) {
      state.loading = true;
      state.error = null;
    },
    fetchAuthMeSuccess(state, action: PayloadAction<AuthUser>) {
      state.loading = false;
      state.user = action.payload;
    },
    fetchAuthMeFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.user = null;
      state.error = action.payload;
    },

    // ----- 로그아웃 -----
    fetchAuthLogoutRequest(state) {
      state.loading = true;
      state.error = null;
    },
    fetchAuthLogoutSuccess(state) {
      state.loading = false;
      state.user = null;
    },
    fetchAuthLogoutFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchAuthLoginRequest,
  fetchAuthLoginSuccess,
  fetchAuthLoginFailure,
  fetchAuthMeRequest,
  fetchAuthMeSuccess,
  fetchAuthMeFailure,
  fetchAuthLogoutRequest,
  fetchAuthLogoutSuccess,
  fetchAuthLogoutFailure,
} = authSlice.actions;

export default authSlice.reducer;

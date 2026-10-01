import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Congestion, CongestionState } from "@/features/emergency/resource/congestion/types";

/** congestion(혼잡도) slice — UC-RES-01 */
const initialState: CongestionState = {
  data: null,
  loading: false,
  error: "",
};

const congestionSlice = createSlice({
  name: "emergency/congestion",
  initialState,
  reducers: {
    fetchCongestionRequest(state) {
      state.loading = true;
      state.error = "";
    },
    fetchCongestionSuccess(state, action: PayloadAction<Congestion>) {
      state.loading = false;
      state.error = "";
      state.data = action.payload;
    },
    // 자동 갱신 중 실패해도 직전 값은 지우지 않는다 — 화면이 비는 것보다 "마지막 갱신 시각 + 오류"가 낫다.
    fetchCongestionFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const { fetchCongestionRequest, fetchCongestionSuccess, fetchCongestionFailure } = congestionSlice.actions;

export default congestionSlice.reducer;

// ----- Selector (가이드 10.4) -----
type CongestionRoot = { emergency: { congestion: CongestionState } };

export const selectCongestion = (state: CongestionRoot) => state.emergency.congestion.data;
export const selectCongestionLoading = (state: CongestionRoot) => state.emergency.congestion.loading;
export const selectCongestionError = (state: CongestionRoot) => state.emergency.congestion.error;

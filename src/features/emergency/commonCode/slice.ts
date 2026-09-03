import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CommonCodeByGroup, CommonCodeState } from "@/features/emergency/commonCode/types";

/**
 * commonCode(공통코드) slice — emergency 도메인 화면 전체가 공유하는 캐시.
 * 앱에서 한 번만 전체 조회하면 되고, 여러 컴포넌트가 이 slice 하나를 같이 본다.
 */
const initialState: CommonCodeState = {
  byGroupCode: {},
  loading: false,
  loaded: false,
  error: "",
};

const commonCodeSlice = createSlice({
  name: "emergency/commonCode",
  initialState,
  reducers: {
    fetchAllCommonCodesRequest(state) {
      state.loading = true;
      state.error = "";
    },
    fetchAllCommonCodesSuccess(state, action: PayloadAction<CommonCodeByGroup>) {
      state.loading = false;
      state.loaded = true;
      state.byGroupCode = action.payload;
    },
    fetchAllCommonCodesFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.loaded = true;
      state.error = action.payload;
    },
  },
});

export const { fetchAllCommonCodesRequest, fetchAllCommonCodesSuccess, fetchAllCommonCodesFailure } =
  commonCodeSlice.actions;

export default commonCodeSlice.reducer;

// ----- Selector (가이드 10.4) -----
type CommonCodeRoot = { emergency: { commonCode: CommonCodeState } };

export const selectCommonCodeLoaded = (state: CommonCodeRoot) => state.emergency.commonCode.loaded;
export const selectCommonCodeLoading = (state: CommonCodeRoot) => state.emergency.commonCode.loading;
export const selectCommonCodeError = (state: CommonCodeRoot) => state.emergency.commonCode.error;

/** 특정 그룹코드의 항목만 꺼내 쓰는 selector — 없으면 빈 배열 */
export const selectCommonCodesByGroup = (groupCode: string) => (state: CommonCodeRoot) =>
  state.emergency.commonCode.byGroupCode[groupCode] ?? [];

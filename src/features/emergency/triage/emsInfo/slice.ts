import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { EmsInfoState, EmsReferral } from "@/features/emergency/triage/emsInfo/types";

/**
 * emsInfo(EMS 정보 조회) slice — UC-TRI-01 / Jira UD2-8
 * 상태만 관리하고, API 호출은 saga 가 담당한다. (가이드 10.3)
 */
const initialState: EmsInfoState = {
  items: [],
  loading: false,
  error: "",
  searched: false,
};

const emsInfoSlice = createSlice({
  name: "emergency/emsInfo",
  initialState,
  reducers: {
    fetchEmsInfoRequest: {
      reducer(state) {
        state.loading = true;
        state.error = "";
      },
      prepare(receptionNo?: string) {
        return { payload: receptionNo };
      },
    },
    fetchEmsInfoSuccess(state, action: PayloadAction<EmsReferral[]>) {
      state.loading = false;
      state.error = "";
      state.items = action.payload;
      state.searched = true;
    },
    fetchEmsInfoFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
      state.searched = true;
    },
  },
});

export const { fetchEmsInfoRequest, fetchEmsInfoSuccess, fetchEmsInfoFailure } =
  emsInfoSlice.actions;

export default emsInfoSlice.reducer;

// ----- Selector (가이드 10.4) -----
// 등록: features/emergency/common/slice.ts → combineReducers({ emsInfo: ... })
type EmsInfoRoot = { emergency: { emsInfo: EmsInfoState } };

export const selectEmsInfoItems = (state: EmsInfoRoot) => state.emergency.emsInfo.items;
export const selectEmsInfoLoading = (state: EmsInfoRoot) => state.emergency.emsInfo.loading;
export const selectEmsInfoError = (state: EmsInfoRoot) => state.emergency.emsInfo.error;
export const selectEmsInfoSearched = (state: EmsInfoRoot) => state.emergency.emsInfo.searched;

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/store/store";
import type {
  EmergencyReceptionListItem,
  EmergencyReceptionRequest,
} from "./types";

type EmergencyReceptionState = {
  list: EmergencyReceptionListItem[];
  listLoading: boolean;
  listError: string | null;

  registerLoading: boolean;
  registerError: string | null;
  /** 등록 성공 시마다 증가 — 등록 폼을 key 로 리마운트해 초기화하는 데 사용 (reception 도메인과 동일한 패턴) */
  registerSuccessCount: number;
};

const initialState: EmergencyReceptionState = {
  list: [],
  listLoading: false,
  listError: null,

  registerLoading: false,
  registerError: null,
  registerSuccessCount: 0,
};

const emergencyReceptionSlice = createSlice({
  name: "reception/emergencyreception",
  initialState,
  reducers: {
    fetchEmergencyReceptionListRequest(state) {
      state.listLoading = true;
      state.listError = null;
    },
    fetchEmergencyReceptionListSuccess(
      state,
      action: PayloadAction<EmergencyReceptionListItem[]>,
    ) {
      state.listLoading = false;
      state.list = action.payload;
    },
    fetchEmergencyReceptionListFailure(state, action: PayloadAction<string>) {
      state.listLoading = false;
      state.listError = action.payload;
    },

    registerEmergencyReceptionRequest: {
      reducer(state) {
        state.registerLoading = true;
        state.registerError = null;
      },
      prepare(request: EmergencyReceptionRequest) {
        return { payload: request };
      },
    },
    registerEmergencyReceptionSuccess(state) {
      state.registerLoading = false;
      state.registerSuccessCount += 1;
    },
    registerEmergencyReceptionFailure(state, action: PayloadAction<string>) {
      state.registerLoading = false;
      state.registerError = action.payload;
    },
  },
});

export const {
  fetchEmergencyReceptionListRequest,
  fetchEmergencyReceptionListSuccess,
  fetchEmergencyReceptionListFailure,
  registerEmergencyReceptionRequest,
  registerEmergencyReceptionSuccess,
  registerEmergencyReceptionFailure,
} = emergencyReceptionSlice.actions;

export const selectEmergencyReceptionList = (state: RootState) =>
  state.reception.emergencyreception.list;
export const selectEmergencyReceptionListLoading = (state: RootState) =>
  state.reception.emergencyreception.listLoading;
export const selectEmergencyReceptionListError = (state: RootState) =>
  state.reception.emergencyreception.listError;

export const selectEmergencyRegisterLoading = (state: RootState) =>
  state.reception.emergencyreception.registerLoading;
export const selectEmergencyRegisterError = (state: RootState) =>
  state.reception.emergencyreception.registerError;
export const selectEmergencyRegisterSuccessCount = (state: RootState) =>
  state.reception.emergencyreception.registerSuccessCount;

export default emergencyReceptionSlice.reducer;

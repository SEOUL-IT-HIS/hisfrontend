import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";
import type {
  PatientSafetyInfo,
  SafetyListRequest,
  SafetyCreateRequest,
  SafetyUpdateRequest,
  SafetyItemRequest,
} from "../type/patientSafetyType";

export type SafetyMutation =
  | ({ kind: "pin"; pinned: boolean } & SafetyItemRequest)
  | ({ kind: "create" } & SafetyCreateRequest)
  | ({ kind: "update" } & SafetyUpdateRequest)
  | ({ kind: "deactivate" } & SafetyItemRequest);

type SafetyListSuccess = SafetyListRequest & {
  items: PatientSafetyInfo[];
};

type SafetyListFailure = SafetyListRequest & {
  message: string;
};

type PatientSafetyState = {
  patientId: string | null;
  items: PatientSafetyInfo[];
  includeInactive: boolean;
  listLoading: boolean;
  listError: string | null;
  mutationId: string | null;
  mutationLoading: boolean;
  mutationError: string | null;
  mutationSuccess: boolean;
};

const initialState: PatientSafetyState = {
  patientId: null,
  items: [],
  includeInactive: false,
  listLoading: false,
  listError: null,
  mutationId: null,
  mutationLoading: false,
  mutationError: null,
  mutationSuccess: false,
};

const patientSafetySlice = createSlice({
  name: "patientSafety",
  initialState,
  reducers: {
    mutateSafetyRequest: {
      prepare(request: SafetyMutation) {
        return { payload: { ...request, requestId: nanoid() } };
      },
      reducer(state, action: PayloadAction<SafetyMutation & { requestId: string }>) {
        if (state.mutationLoading || state.patientId !== action.payload.patientId) return;
        state.mutationId = action.payload.requestId;
        state.mutationLoading = true;
        state.mutationError = null;
        state.mutationSuccess = false;
      },
    },
    mutateSafetySuccess(state, action: PayloadAction<{ requestId: string }>) {
      if (state.mutationId !== action.payload.requestId) return;
      state.mutationLoading = false;
      state.mutationSuccess = true;
    },
    mutateSafetyFailure(state, action: PayloadAction<{ requestId: string; message: string }>) {
      if (state.mutationId !== action.payload.requestId) return;
      state.mutationLoading = false;
      state.mutationError = action.payload.message;
    },
    resetSafetyMutation(state) {
      if (state.mutationLoading) return;
      state.mutationId = null;
      state.mutationError = null;
      state.mutationSuccess = false;
    },
    fetchSafetyListRequest(
      state,
      action: PayloadAction<SafetyListRequest>,
    ) {
      const { patientId, includeInactive } = action.payload;

      // 환자나 필터가 바뀌면 이전 목록을 비웁니다.
      if (
        state.patientId !== patientId ||
        state.includeInactive !== includeInactive
      ) {
        state.items = [];
      }

      state.patientId = patientId;
      state.includeInactive = includeInactive;
      state.listLoading = true;
      state.listError = null;
    },

    fetchSafetyListSuccess(
      state,
      action: PayloadAction<SafetyListSuccess>,
    ) {
      const { patientId, includeInactive, items } = action.payload;

      // 현재 조회 조건과 다른 응답은 반영하지 않습니다.
      if (
        state.patientId !== patientId ||
        state.includeInactive !== includeInactive
      ) {
        return;
      }

      state.items = items;
      state.listLoading = false;
      state.listError = null;
    },

    fetchSafetyListFailure(
      state,
      action: PayloadAction<SafetyListFailure>,
    ) {
      const { patientId, includeInactive, message } = action.payload;

      if (
        state.patientId !== patientId ||
        state.includeInactive !== includeInactive
      ) {
        return;
      }

      state.listLoading = false;
      state.listError = message;
    },

    resetPatientSafety() {
      return initialState;
    },
  },
});

export const {
  mutateSafetyRequest,
  mutateSafetySuccess,
  mutateSafetyFailure,
  resetSafetyMutation,
  fetchSafetyListRequest,
  fetchSafetyListSuccess,
  fetchSafetyListFailure,
  resetPatientSafety,
} = patientSafetySlice.actions;

export default patientSafetySlice.reducer;

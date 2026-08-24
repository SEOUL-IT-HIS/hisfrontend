import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  SpecimenCreateRequest,
  SpecimenState,
  SpecimenSummary,
} from "@/features/labimaging/labspecimen/types";

/**
 * labspecimen(검체 등록/조회) slice
 * - 상태만 관리하고 API 호출은 하지 않는다 → saga 가 담당 (가이드 10.3)
 */
const initialState: SpecimenState = {
  specimens: [],
  specimensLoading: false,
  specimensError: "",

  creating: false,
  createError: "",
  lastCreated: null,
};

const specimenSlice = createSlice({
  name: "labImaging/labspecimen",
  initialState,
  reducers: {
    // ---------- 접수의 검체 목록 조회 ----------
    fetchSpecimensRequest: {
      reducer(state) {
        state.specimensLoading = true;
        state.specimensError = "";
      },
      prepare(receptionNo: string) {
        return { payload: receptionNo };
      },
    },
    fetchSpecimensSuccess(state, action: PayloadAction<SpecimenSummary[]>) {
      state.specimensLoading = false;
      state.specimens = action.payload;
    },
    fetchSpecimensFailure(state, action: PayloadAction<string>) {
      state.specimensLoading = false;
      state.specimensError = action.payload;
    },

    // ---------- 검체 등록 ----------
    /**
     * payload 에 receptionNo 를 같이 싣는다.
     * 등록에 성공하면 그 접수의 검체 목록을 다시 불러와야 하는데,
     * 요청 DTO 에는 접수ID(UUID)만 있고 목록 조회는 접수번호로 하기 때문이다.
     */
    createSpecimenRequest: {
      reducer(state) {
        state.creating = true;
        state.createError = "";
      },
      prepare(request: SpecimenCreateRequest, receptionNo: string) {
        return { payload: { request, receptionNo } };
      },
    },
    createSpecimenSuccess(state, action: PayloadAction<SpecimenSummary>) {
      state.creating = false;
      state.createError = "";
      state.lastCreated = action.payload;
    },
    createSpecimenFailure(state, action: PayloadAction<string>) {
      state.creating = false;
      state.createError = action.payload;
    },

    /** 다른 접수를 고르면 이전 접수의 등록 결과/오류가 남아 있으면 안 된다. */
    resetSpecimenState(state) {
      state.specimens = [];
      state.specimensError = "";
      state.createError = "";
      state.lastCreated = null;
    },
  },
});

export const {
  fetchSpecimensRequest,
  fetchSpecimensSuccess,
  fetchSpecimensFailure,
  createSpecimenRequest,
  createSpecimenSuccess,
  createSpecimenFailure,
  resetSpecimenState,
} = specimenSlice.actions;

export default specimenSlice.reducer;

// ----- Selector (가이드 10.4: 컴포넌트에서 state.xxx.yyy 깊게 접근 금지) -----
type SpecimenRoot = { labImaging: { labspecimen: SpecimenState } };

export const selectSpecimens = (s: SpecimenRoot) =>
  s.labImaging.labspecimen.specimens;
export const selectSpecimensLoading = (s: SpecimenRoot) =>
  s.labImaging.labspecimen.specimensLoading;
export const selectSpecimensError = (s: SpecimenRoot) =>
  s.labImaging.labspecimen.specimensError;

export const selectSpecimenCreating = (s: SpecimenRoot) =>
  s.labImaging.labspecimen.creating;
export const selectSpecimenCreateError = (s: SpecimenRoot) =>
  s.labImaging.labspecimen.createError;
export const selectLastCreatedSpecimen = (s: SpecimenRoot) =>
  s.labImaging.labspecimen.lastCreated;

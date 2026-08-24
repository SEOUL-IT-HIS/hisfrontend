import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ConsentCreateRequest,
  ConsentState,
  ConsentSummary,
} from "@/features/labimaging/imagingacquisition/types";

/**
 * imagingacquisition(조영제/침습검사 동의) slice
 * - 상태만 관리하고 API 호출은 하지 않는다 → saga 가 담당 (가이드 10.3)
 */
const initialState: ConsentState = {
  consents: [],
  consentsLoading: false,
  consentsError: "",
  loadedImageOrderId: null,

  creating: false,
  createError: "",
  lastCreated: null,
};

const consentSlice = createSlice({
  name: "labImaging/imagingacquisition",
  initialState,
  reducers: {
    // ---------- 오더의 동의 이력 조회 ----------
    fetchConsentsRequest: {
      reducer(state) {
        state.consentsLoading = true;
        state.consentsError = "";
      },
      prepare(imageOrderId: string) {
        return { payload: imageOrderId };
      },
    },
    /**
     * ⚠ 목록과 함께 "어느 오더의 것인지"도 받는다.
     *   결과가 0건인 경우(아직 동의를 안 받은 오더)에는 목록만 봐서는 대상을 알 수 없어서,
     *   saga 가 요청했던 imageOrderId 를 같이 실어 보낸다.
     */
    fetchConsentsSuccess(
      state,
      action: PayloadAction<{ imageOrderId: string; consents: ConsentSummary[] }>,
    ) {
      state.consentsLoading = false;
      state.consents = action.payload.consents;
      state.loadedImageOrderId = action.payload.imageOrderId;
    },
    fetchConsentsFailure(state, action: PayloadAction<string>) {
      state.consentsLoading = false;
      state.consentsError = action.payload;
    },

    // ---------- 동의 등록 ----------
    /**
     * 등록에 성공하면 그 오더의 동의 이력을 다시 불러와야 한다.
     * 요청 DTO 에 imageOrderId 가 이미 들어 있어 별도로 싣지 않고 saga 가 꺼내 쓴다.
     * (검체는 요청에 접수ID(UUID)만 있고 목록 조회는 접수번호로 해서 따로 실었지만,
     *  동의는 등록·조회가 같은 imageOrderId 를 쓰므로 그럴 필요가 없다)
     */
    createConsentRequest: {
      reducer(state) {
        state.creating = true;
        state.createError = "";
      },
      prepare(request: ConsentCreateRequest) {
        return { payload: request };
      },
    },
    createConsentSuccess(state, action: PayloadAction<ConsentSummary>) {
      state.creating = false;
      state.createError = "";
      state.lastCreated = action.payload;
    },
    createConsentFailure(state, action: PayloadAction<string>) {
      state.creating = false;
      state.createError = action.payload;
    },

    /** 다른 오더를 고르면 이전 오더의 이력/등록 결과가 남아 있으면 안 된다. */
    resetConsentState(state) {
      state.consents = [];
      state.consentsError = "";
      state.loadedImageOrderId = null;
      state.createError = "";
      state.lastCreated = null;
    },
  },
});

export const {
  fetchConsentsRequest,
  fetchConsentsSuccess,
  fetchConsentsFailure,
  createConsentRequest,
  createConsentSuccess,
  createConsentFailure,
  resetConsentState,
} = consentSlice.actions;

export default consentSlice.reducer;

// ----- Selector (가이드 10.4: 컴포넌트에서 state.xxx.yyy 깊게 접근 금지) -----
type ConsentRoot = { labImaging: { imagingacquisition: ConsentState } };

export const selectConsents = (s: ConsentRoot) =>
  s.labImaging.imagingacquisition.consents;
export const selectConsentsLoading = (s: ConsentRoot) =>
  s.labImaging.imagingacquisition.consentsLoading;
export const selectConsentsError = (s: ConsentRoot) =>
  s.labImaging.imagingacquisition.consentsError;
export const selectLoadedConsentOrderId = (s: ConsentRoot) =>
  s.labImaging.imagingacquisition.loadedImageOrderId;

export const selectConsentCreating = (s: ConsentRoot) =>
  s.labImaging.imagingacquisition.creating;
export const selectConsentCreateError = (s: ConsentRoot) =>
  s.labImaging.imagingacquisition.createError;
export const selectLastCreatedConsent = (s: ConsentRoot) =>
  s.labImaging.imagingacquisition.lastCreated;

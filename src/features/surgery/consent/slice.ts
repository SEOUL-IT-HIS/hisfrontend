import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  Consent,
  ConsentState,
  CreateConsentRequest,
} from "@/features/surgery/consent/types";

/**
 * 수술 동의서 slice (SL2-42)
 *
 * <p>상태만 관리하고 API 호출은 saga 가 담당한다(§10.3).
 * createSlice name = "surgery/consent" (§10.2 서비스 prefix 유지)</p>
 *
 * <p><b>액션 패턴</b> — 조회·등록·수정이 모두 세 개 한 벌이다.</p>
 * <pre>
 *   Request  →  loading(또는 saving)=true, error 비움.  saga 가 이 액션을 받아 API 를 호출한다
 *   Success  →  로딩 해제 + 상태 반영
 *   Failure  →  로딩 해제 + error 에 문구 저장
 * </pre>
 * <p>컴포넌트는 <b>Request 만 dispatch</b> 하면 된다. Success/Failure 는 saga 가 흘려보낸다.
 * 화면은 API 주소도, 성공 후 무엇을 해야 하는지도 알 필요가 없다.</p>
 *
 * <p><b>loading 과 saving 을 나눈 이유</b> — 읽기와 쓰기는 화면에서 쓰임이 다르다.
 * loading 은 "불러오는 중…" 문구에, saving 은 버튼·입력칸 비활성화(disabled)에 쓴다.
 * 하나로 묶으면 저장 중에 목록이 통째로 사라진다.</p>
 *
 * <p><b>error 를 null 이 아니라 "" 로 둔 이유</b> — 화면에서 {@code error && <p>...</p>} 로
 * 바로 쓰기 위해서다. 노출 직전 resolveSurgeryMessage 로 SUR### 코드를 문구로 바꾼다(§15.2).</p>
 *
 * <p><b>reducer 안에서 state 를 직접 바꿔도 되는 이유</b> — Redux Toolkit 이 내부적으로
 * Immer 를 쓴다. {@code state.loading = true} 처럼 적어도 실제로는 새 객체를 만드는
 * 코드로 변환되므로, 읽기 쉬운 문법을 쓰면서 불변성 규칙은 지켜진다.</p>
 *
 * <p><b>prepare 가 붙은 액션이 있는 이유</b> — reducer 는 인자를 action 하나만 받는데,
 * "어느 대상을 어떻게 바꿀지"처럼 값이 둘 이상 필요한 경우가 있다. prepare 가 둘을 하나의
 * payload 로 묶어주므로, 컴포넌트에서는 {@code dispatch(액션(id, request))} 처럼 자연스럽게 부른다.</p>
 *
 * <p>consents 는 수술 단위 목록(SL2-54), patientConsents 는 환자 단위 이력(SL2-222)이다.
 * 쓰임이 달라 한 배열로 합치지 않았다 — 화면을 오갈 때 서로 덮어쓰면 안 된다.</p>
 */
const initialState: ConsentState = {
  consents: [],
  patientConsents: [],
  loading: false,
  saving: false,
  error: "",
};

const consentSlice = createSlice({
  name: "surgery/consent",
  initialState,
  reducers: {
    // ----- 조회 (SL2-54 수술별 / SL2-222 환자별) -----
    fetchConsentsRequest: {
      reducer(state) {
        state.loading = true;
        state.error = "";
      },
      prepare(surgeryId: string) {
        return { payload: surgeryId };
      },
    },
    fetchConsentsSuccess(state, action: PayloadAction<Consent[]>) {
      state.loading = false;
      state.consents = action.payload;
    },
    fetchConsentsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    fetchPatientConsentsRequest: {
      reducer(state) {
        state.loading = true;
        state.error = "";
      },
      prepare(patientId: string) {
        return { payload: patientId };
      },
    },
    fetchPatientConsentsSuccess(state, action: PayloadAction<Consent[]>) {
      state.loading = false;
      state.patientConsents = action.payload;
    },
    fetchPatientConsentsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // ----- 등록 (SL2-53) -----
    createConsentRequest: {
      reducer(state) {
        state.saving = true;
        state.error = "";
      },
      prepare(surgeryId: string, request: CreateConsentRequest) {
        return { payload: { surgeryId, request } };
      },
    },
    consentMutationSuccess(state) {
      state.saving = false;
      state.error = "";
    },
    consentMutationFailure(state, action: PayloadAction<string>) {
      state.saving = false;
      state.error = action.payload;
    },

    resetConsentState() {
      return initialState;
    },
  },
});

export const {
  fetchConsentsRequest,
  fetchConsentsSuccess,
  fetchConsentsFailure,
  fetchPatientConsentsRequest,
  fetchPatientConsentsSuccess,
  fetchPatientConsentsFailure,
  createConsentRequest,
  consentMutationSuccess,
  consentMutationFailure,
  resetConsentState,
} = consentSlice.actions;

export default consentSlice.reducer;

// ----- Selector (§10.4) -----
// 등록 전제: rootReducer 에 surgery: combineReducers({ consent, ... })
type ConsentRoot = { surgery: { consent: ConsentState } };

export const selectConsents = (state: ConsentRoot) =>
  state.surgery.consent.consents;
export const selectPatientConsents = (state: ConsentRoot) =>
  state.surgery.consent.patientConsents;
export const selectConsentLoading = (state: ConsentRoot) =>
  state.surgery.consent.loading;
export const selectConsentSaving = (state: ConsentRoot) =>
  state.surgery.consent.saving;
export const selectConsentError = (state: ConsentRoot) =>
  state.surgery.consent.error;

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  BillingDetail,
  BillingDetailAdmission,
  BillingDetailVisit,
  SearchPatient,
  SearchPatientResult
} from "@/features/billing/searchBillingDetail/types";

/**
 * billingDetail slice
 * - 진료비 상세조회 검색 결과 상태만 관리
 * - API 호출은 여기서 하지 않는다 → saga 가 담당
 *
 * Action 이름 규칙 (가이드 10.2)
 * - Request / Success / Failure
 * - prefix: billingDetail/...  (createSlice name = "billingDetail")
 */
type BillingDetailState = {
  searchPatient: SearchPatientResult[];
  loading: boolean;
  error: string;

  detail: BillingDetail | null;
  admissionDetail: BillingDetailAdmission | null;
  visitDetail: BillingDetailVisit | null;
  
  detailStatus: { loading: boolean; error: string };
  admissionDetailStatus: { loading: boolean; error: string };
  visitDetailStatus: { loading: boolean; error: string };
  //타입명시
};

const initialState: BillingDetailState = {
  searchPatient: [],//환자 검색 데이터 받아올 값.
  loading: false,
  error: "",

  detail: null,  // billingDetail 진료비 상세 조회 결과
  admissionDetail: null, // billingDetail 입퇴원 상세 조회 결과
  visitDetail: null, // billingDetail 외래 진료비 상세 조회 결과
  
  detailStatus: { loading: false, error: "" },
  admissionDetailStatus: { loading: false, error: "" },
  visitDetailStatus: { loading: false, error: "" },//디폴트값 
};

const billingDetailSlice = createSlice({
  name: "billingDetail",
  initialState,
  reducers: {
    /** 환자 리스트 검색 시작 → saga 가 이 action 을 듣고 API 호출 */
    searchBillingDetailRequest(state,_action: PayloadAction<SearchPatient>,) {
      state.loading = true;
      state.error = "";
    },
    /** 환자 리스트 검색 성공 */
    searchBillingDetailSuccess(state, action: PayloadAction<SearchPatientResult[]>) {
      state.searchPatient = action.payload;
      state.loading = false;
      state.error = "";
    },
    /** 환자 리스트 검색 실패 */
    searchBillingDetailFailure(state, action: PayloadAction<string>) {
      state.searchPatient = [];
      state.loading = false;
      state.error = action.payload;
    },

    /** 진료비 상세조회 단건(환자 상세정보) 조회 시작 */
    fetchBillingDetailRequest(state, _action: PayloadAction<string>) {
      state.detailStatus = { loading: true, error: "" };
    },
    /** 진료비 상세조회 단건 조회 성공 */
    fetchBillingDetailSuccess(state, action: PayloadAction<BillingDetail>) {
      state.detail = action.payload;
      state.detailStatus = { loading: false, error: "" };
    },
    /** 진료비 상세조회 단건 조회 실패 */
    fetchBillingDetailFailure(state, action: PayloadAction<string>) {
      state.detail = null;
      state.detailStatus = { loading: false, error: action.payload };
    },

    /** 입퇴원 상세조회 단건(환자 상세정보) 조회 시작 */
    admissionBillingDetailRequest(state, _action: PayloadAction<string>) {
      state.admissionDetailStatus = { loading: true, error: "" };
    },
    /** 입퇴원 상세조회 단건 조회 성공 */
    admissionBillingDetailSuccess(state, action: PayloadAction<BillingDetailAdmission>) {
      state.admissionDetail = action.payload;
      state.admissionDetailStatus = { loading: false, error: "" };
    },
    /** 입퇴원 상세조회 단건 조회 실패 */
    admissionBillingDetailFailure(state, action: PayloadAction<string>) {
      state.admissionDetail  = null;
      state.admissionDetailStatus = { loading: false, error: action.payload };
    },
    /** 방문 상세조회 단건(환자 상세정보) 조회 시작 */
    visitBillingDetailRequest(state, _action: PayloadAction<string>) {
      state.visitDetailStatus = { loading: true, error: "" };
    },
    /** 방문 상세조회 단건 조회 성공 */
    visitBillingDetailSuccess(state, action: PayloadAction<BillingDetailVisit>) {
      state.visitDetail = action.payload;
      state.visitDetailStatus = { loading: false, error: "" };
    },
    /** 방문 상세조회 단건 조회 실패 */
    visitBillingDetailFailure(state, action: PayloadAction<string>) {
      state.visitDetail = null;
      state.visitDetailStatus = { loading: false, error: action.payload };
    },
    updateBillingStatusRequest(state, _action: PayloadAction<string>){
      state.loading=true; state.error="";},
    updateBillingStatusSuccess(state){
      state.loading=false; state.error="";},
    updateBillingStatusFailure(state, action: PayloadAction<string>){
      state.loading=false; state.error=action.payload
    }



  },
});

export const {
  searchBillingDetailRequest,
  searchBillingDetailSuccess,
  searchBillingDetailFailure,
  fetchBillingDetailRequest,
  fetchBillingDetailSuccess,
  fetchBillingDetailFailure,
  admissionBillingDetailRequest,
  admissionBillingDetailSuccess,
  admissionBillingDetailFailure,
  visitBillingDetailRequest,
  visitBillingDetailSuccess,
  visitBillingDetailFailure,
  updateBillingStatusRequest,
  updateBillingStatusSuccess,
  updateBillingStatusFailure
} = billingDetailSlice.actions;

export default billingDetailSlice.reducer;

// ----- Selector (가이드 10.4: 컴포넌트에서 state.xxx.yyy 깊게 파지 않기) -----

type BillingDetailRoot = { billingDetail: BillingDetailState };

export const selectBillingDetails = (state: BillingDetailRoot) =>state.billingDetail.searchPatient;
export const selectBillingDetailLoading = (state: BillingDetailRoot) =>state.billingDetail.loading;
export const selectBillingDetailError = (state: BillingDetailRoot) => state.billingDetail.error;
export const selectAdmissionDetail = (state: BillingDetailRoot) => state.billingDetail.admissionDetail;
export const selectAdmissionDetailLoading = (state: BillingDetailRoot) => state.billingDetail.admissionDetailStatus.loading;
export const selectAdmissionDetailError = (state: BillingDetailRoot) => state.billingDetail.admissionDetailStatus.error;
export const selectVisitDetail = (state: BillingDetailRoot) => state.billingDetail.visitDetail;
export const selectVisitDetailLoading = (state: BillingDetailRoot) => state.billingDetail.visitDetailStatus.loading;
export const selectVisitDetailError = (state: BillingDetailRoot) => state.billingDetail.visitDetailStatus.error;

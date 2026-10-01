import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { kakaoPayApproveSuccess, paymentSuccess } from "@/features/billing/payment/slice";
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
  lastSearch: SearchPatient; // 결제 완료 후 목록을 같은 조건으로 다시 조회하기 위해 마지막 검색조건 보관
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
  lastSearch: {},
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
    searchBillingDetailRequest(state, action: PayloadAction<SearchPatient>,) {
      state.lastSearch = action.payload;
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
    },

    /** 화면을 떠날 때 검색 결과/상세를 비움 - 안 하면 다시 들어왔을 때 입력창은 빈칸인데 이전 결과가 그대로 보임 */
    resetBillingDetail() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // 결제 성공 시 지금 보고 있는 상세를 결제완료로 표시 (Payment 버튼이 다시 눌리지 않도록)
    // - 목록 재조회는 payment saga 가 lastSearch 로 다시 요청함
    const markDetailPaid = (state: BillingDetailState) => {
      if (state.detail) state.detail.billingStatus = "SUCCESS";
    };
    builder.addCase(paymentSuccess, markDetailPaid);
    builder.addCase(kakaoPayApproveSuccess, markDetailPaid);
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
  updateBillingStatusFailure,
  resetBillingDetail
} = billingDetailSlice.actions;

export default billingDetailSlice.reducer;

// ----- Selector (가이드 10.4: 컴포넌트에서 state.xxx.yyy 깊게 파지 않기) -----

type BillingDetailRoot = { billing: { billingDetail: BillingDetailState } };

export const selectBillingDetails = (state: BillingDetailRoot) =>state.billing.billingDetail.searchPatient;
export const selectBillingDetailLastSearch = (state: BillingDetailRoot) => state.billing.billingDetail.lastSearch;
export const selectBillingDetailLoading = (state: BillingDetailRoot) =>state.billing.billingDetail.loading;
export const selectBillingDetailError = (state: BillingDetailRoot) => state.billing.billingDetail.error;
export const selectAdmissionDetail = (state: BillingDetailRoot) => state.billing.billingDetail.admissionDetail;
export const selectAdmissionDetailLoading = (state: BillingDetailRoot) => state.billing.billingDetail.admissionDetailStatus.loading;
export const selectAdmissionDetailError = (state: BillingDetailRoot) => state.billing.billingDetail.admissionDetailStatus.error;
export const selectVisitDetail = (state: BillingDetailRoot) => state.billing.billingDetail.visitDetail;
export const selectVisitDetailLoading = (state: BillingDetailRoot) => state.billing.billingDetail.visitDetailStatus.loading;
export const selectVisitDetailError = (state: BillingDetailRoot) => state.billing.billingDetail.visitDetailStatus.error;

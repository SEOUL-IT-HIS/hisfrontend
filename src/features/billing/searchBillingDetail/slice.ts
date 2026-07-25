import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  BillingDetail,
  BillingDetailSearchCondition,
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
  billingDetails: BillingDetail[];
  loading: boolean;
  error: string;
};

const initialState: BillingDetailState = {
  billingDetails: [],
  loading: false,
  error: "",
};

const billingDetailSlice = createSlice({
  name: "billingDetail",
  initialState,
  reducers: {
    /** 진료비 상세조회 검색 시작 → saga 가 이 action 을 듣고 API 호출 */
    searchBillingDetailRequest(
      state,
      _action: PayloadAction<BillingDetailSearchCondition>,
    ) {
      state.loading = true;
      state.error = "";
    },
    /** 진료비 상세조회 검색 성공 */
    searchBillingDetailSuccess(state, action: PayloadAction<BillingDetail[]>) {
      state.billingDetails = action.payload;
      state.loading = false;
      state.error = "";
    },
    /** 진료비 상세조회 검색 실패 */
    searchBillingDetailFailure(state, action: PayloadAction<string>) {
      state.billingDetails = [];
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  searchBillingDetailRequest,
  searchBillingDetailSuccess,
  searchBillingDetailFailure,
} = billingDetailSlice.actions;

export default billingDetailSlice.reducer;

// ----- Selector (가이드 10.4: 컴포넌트에서 state.xxx.yyy 깊게 파지 않기) -----

type BillingDetailRoot = { billingDetail: BillingDetailState };

export const selectBillingDetails = (state: BillingDetailRoot) =>
  state.billingDetail.billingDetails;
export const selectBillingDetailLoading = (state: BillingDetailRoot) =>
  state.billingDetail.loading;
export const selectBillingDetailError = (state: BillingDetailRoot) => state.billingDetail.error;

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  BillingMaster,
  BillingMasterCreateRequest,
} from "@/features/billing/billingMaster/types";


type Status = {
  loading: boolean;
  error: string;
};

type BillingMasterState = {
  list: BillingMaster[];
  detail: BillingMaster | null;
  createSuccess: boolean;

  listStatus: Status;
  detailStatus: Status;
  createStatus: Status;
};

const initialStatus: Status = { loading: false, error: "" };

const initialState: BillingMasterState = {
  list: [],
  detail: null,
  createSuccess: false,

  listStatus: { ...initialStatus },
  detailStatus: { ...initialStatus },
  createStatus: { ...initialStatus },
};

const billingMasterSlice = createSlice({
  name: "billingMaster",
  initialState,
  reducers: {
    // 목록 조회
    fetchBillingMasterRequest(state) {
      state.listStatus = { ...initialStatus, loading: true };
    },
    fetchBillingMasterSuccess(state, action: PayloadAction<BillingMaster[]>) {
      state.listStatus = { ...initialStatus };
      state.list = action.payload;
    },
    fetchBillingMasterFailure(state, action: PayloadAction<string>) {
      state.listStatus = { loading: false, error: action.payload };
    },

    // 상세 조회
    fetchBillingMasterDetailRequest(state, _action: PayloadAction<string>) {
      state.detailStatus = { ...initialStatus, loading: true };
      state.detail = null;
    },
    fetchBillingMasterDetailSuccess(state, action: PayloadAction<BillingMaster>) {
      state.detailStatus = { ...initialStatus };
      state.detail = action.payload;
    },
    fetchBillingMasterDetailFailure(state, action: PayloadAction<string>) {
      state.detailStatus = { loading: false, error: action.payload };
    },

    // 등록
    registerBillingMasterRequest(state, _action: PayloadAction<BillingMasterCreateRequest>) {
      state.createStatus = { ...initialStatus, loading: true };
      state.createSuccess = false;
    },
    registerBillingMasterSuccess(state) {
      state.createStatus = { ...initialStatus };
      state.createSuccess = true;
    },
    registerBillingMasterFailure(state, action: PayloadAction<string>) {
      state.createStatus = { loading: false, error: action.payload };
      state.createSuccess = false;
    },
    resetBillingMasterCreateStatus(state) {
      state.createStatus = { ...initialStatus };
      state.createSuccess = false;
    },
  },
});

export const {
  fetchBillingMasterRequest,
  fetchBillingMasterSuccess,
  fetchBillingMasterFailure,
  fetchBillingMasterDetailRequest,
  fetchBillingMasterDetailSuccess,
  fetchBillingMasterDetailFailure,
  registerBillingMasterRequest,
  registerBillingMasterSuccess,
  registerBillingMasterFailure,
  resetBillingMasterCreateStatus,
} = billingMasterSlice.actions;

export default billingMasterSlice.reducer;

// ----- Selector (가이드 10.4: 컴포넌트에서 state.xxx.yyy 깊게 파지 않기) -----

type BillingMasterRoot = { billingMaster: BillingMasterState };

export const selectBillingMasterList = (state: BillingMasterRoot) => state.billingMaster.list;
export const selectBillingMasterListStatus = (state: BillingMasterRoot) =>
  state.billingMaster.listStatus;
export const selectBillingMasterDetail = (state: BillingMasterRoot) => state.billingMaster.detail;
export const selectBillingMasterDetailStatus = (state: BillingMasterRoot) =>
  state.billingMaster.detailStatus;
export const selectBillingMasterCreateStatus = (state: BillingMasterRoot) =>
  state.billingMaster.createStatus;
export const selectBillingMasterCreateSuccess = (state: BillingMasterRoot) =>
  state.billingMaster.createSuccess;

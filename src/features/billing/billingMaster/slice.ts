import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/store/store";
import type {
  BillingMaster,
  BillingMasterCreateRequest,
  BillingMasterUpdateRequest,
} from "@/features/billing/billingMaster/types";


type Status = {
  loading: boolean;
  error: string;
};

type BillingMasterState = {
  list: BillingMaster[];
  detail: BillingMaster | null;
  createSuccess: boolean;
  updateSuccess: boolean;

  listStatus: Status;
  detailStatus: Status;
  createStatus: Status;
  updateStatus: Status;
};

const initialStatus: Status = { loading: false, error: "" };

const initialState: BillingMasterState = {
  list: [],
  detail: null,
  createSuccess: false,
  updateSuccess: false,

  listStatus: { ...initialStatus },
  detailStatus: { ...initialStatus },
  createStatus: { ...initialStatus },
  updateStatus: { ...initialStatus },
};

const billingMasterSlice = createSlice({
  name: "billingMaster",
  initialState,
  reducers: {
    // List
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

    // Detail
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

    // Create
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

    // Update
    updateBillingMasterRequest(
      state,
      _action: PayloadAction<{ billingMasterId: string; payload: BillingMasterUpdateRequest }>,
    ) {
      state.updateStatus = { ...initialStatus, loading: true };
      state.updateSuccess = false;
    },
    updateBillingMasterSuccess(state) {
      state.updateStatus = { ...initialStatus };
      state.updateSuccess = true;
    },
    updateBillingMasterFailure(state, action: PayloadAction<string>) {
      state.updateStatus = { loading: false, error: action.payload };
      state.updateSuccess = false;
    },
    resetBillingMasterUpdateStatus(state) {
      state.updateStatus = { ...initialStatus };
      state.updateSuccess = false;
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
  updateBillingMasterRequest,
  updateBillingMasterSuccess,
  updateBillingMasterFailure,
  resetBillingMasterUpdateStatus,
} = billingMasterSlice.actions;

export default billingMasterSlice.reducer;

// ----- Selectors (avoid reaching deep into state.xxx.yyy inside components) -----

type BillingMasterRoot = { billing: { billingMaster: BillingMasterState } };

export const selectBillingMasterList = (state: BillingMasterRoot) => state.billing.billingMaster.list;
export const selectBillingMasterListStatus = (state: BillingMasterRoot) =>
  state.billing.billingMaster.listStatus;
export const selectBillingMasterDetail = (state: BillingMasterRoot) => state.billing.billingMaster.detail;
export const selectBillingMasterDetailStatus = (state: BillingMasterRoot) =>
  state.billing.billingMaster.detailStatus;
export const selectBillingMasterCreateStatus = (state: BillingMasterRoot) =>
  state.billing.billingMaster.createStatus;
export const selectBillingMasterCreateSuccess = (state: BillingMasterRoot) =>
  state.billing.billingMaster.createSuccess;
export const selectBillingMasterUpdateStatus = (state: BillingMasterRoot) =>
  state.billing.billingMaster.updateStatus;
export const selectBillingMasterUpdateSuccess = (state: BillingMasterRoot) =>
  state.billing.billingMaster.updateSuccess;

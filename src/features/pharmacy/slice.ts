import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  DisposalRegisterRequest,
  IssuanceDto,
  IssuanceRegisterRequest,
  InventoryDto,
  Medication,
  MedicationRegisterForm,
  PharmacyState,
  PrescriptionDetail,
  PrescriptionListItem,
  ReceiptDto,
  ReceiptRegisterRequest,
} from "./types";

const initialState: PharmacyState = {
  medicationList: [],
  loading: false,
  error: null,

  importCount: null,
  importLoading: false,
  importError: null,

  inventoryList: [],
  inventoryLoading: false,
  inventoryError: null,

  receiptList: [],
  receiptLoading: false,
  receiptError: null,

  receiptRegisterLoading: false,
  receiptRegisterError: null,

  issuanceList: [],
  issuanceLoading: false,
  issuanceError: null,

  prescriptionList: [],
  prescriptionLoading: false,
  prescriptionError: null,

  prescriptionDetail: null,
  prescriptionDetailLoading: false,
  prescriptionDetailError: null,

  disposalLoading: false,
  disposalError: null,
};

const pharmacySlice = createSlice({
  name: "pharmacy",
  initialState,
  reducers: {
    fetchMedicationListRequest(state) {
      state.loading = true;
      state.error = null;
    },
    fetchMedicationListSuccess(state, action: PayloadAction<Medication[]>) {
      state.loading = false;
      state.medicationList = action.payload;
    },
    fetchMedicationListFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    registerMedicationRequest(
      state,
      _action: PayloadAction<MedicationRegisterForm>
    ) {
      state.loading = true;
      state.error = null;
    },
    registerMedicationSuccess(state) {
      state.loading = false;
    },
    registerMedicationFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // ----- 공공API(의약품 낱알식별정보) 가져오기 -----
    importMedicationsRequest(state) {
      state.importLoading = true;
      state.importError = null;
      state.importCount = null;
    },
    importMedicationsSuccess(state, action: PayloadAction<number>) {
      state.importLoading = false;
      state.importCount = action.payload;
    },
    importMedicationsFailure(state, action: PayloadAction<string>) {
      state.importLoading = false;
      state.importError = action.payload;
    },

    // ----- 약품 재고 조회 (HL2-5) -----
    fetchInventoryListRequest(state) {
      state.inventoryLoading = true;
      state.inventoryError = null;
    },
    fetchInventoryListSuccess(state, action: PayloadAction<InventoryDto[]>) {
      state.inventoryLoading = false;
      state.inventoryList = action.payload;
    },
    fetchInventoryListFailure(state, action: PayloadAction<string>) {
      state.inventoryLoading = false;
      state.inventoryError = action.payload;
    },

    // ----- 약품 입고 조회 (HL2-7) -----
    fetchReceiptListRequest(state) {
      state.receiptLoading = true;
      state.receiptError = null;
    },
    fetchReceiptListSuccess(state, action: PayloadAction<ReceiptDto[]>) {
      state.receiptLoading = false;
      state.receiptList = action.payload;
    },
    fetchReceiptListFailure(state, action: PayloadAction<string>) {
      state.receiptLoading = false;
      state.receiptError = action.payload;
    },

    // ----- 약품 입고 등록 -----
    registerReceiptRequest(state, _action: PayloadAction<ReceiptRegisterRequest>) {
      state.receiptRegisterLoading = true;
      state.receiptRegisterError = null;
    },
    registerReceiptSuccess(state) {
      state.receiptRegisterLoading = false;
    },
    registerReceiptFailure(state, action: PayloadAction<string>) {
      state.receiptRegisterLoading = false;
      state.receiptRegisterError = action.payload;
    },

    // ----- 약품 출고 등록/조회 (HL2-8, HL2-9) -----
    fetchIssuanceListRequest(state) {
      state.issuanceLoading = true;
      state.issuanceError = null;
    },
    fetchIssuanceListSuccess(state, action: PayloadAction<IssuanceDto[]>) {
      state.issuanceLoading = false;
      state.issuanceList = action.payload;
    },
    fetchIssuanceListFailure(state, action: PayloadAction<string>) {
      state.issuanceLoading = false;
      state.issuanceError = action.payload;
    },
    registerIssuanceRequest(
      state,
      _action: PayloadAction<IssuanceRegisterRequest>
    ) {
      state.issuanceLoading = true;
      state.issuanceError = null;
    },
    registerIssuanceSuccess(state) {
      state.issuanceLoading = false;
    },
    registerIssuanceFailure(state, action: PayloadAction<string>) {
      state.issuanceLoading = false;
      state.issuanceError = action.payload;
    },

    // ----- 처방전 목록/상세 조회 (HL2-17) -----
    fetchPrescriptionListRequest(state) {
      state.prescriptionLoading = true;
      state.prescriptionError = null;
    },
    fetchPrescriptionListSuccess(
      state,
      action: PayloadAction<PrescriptionListItem[]>
    ) {
      state.prescriptionLoading = false;
      state.prescriptionList = action.payload;
    },
    fetchPrescriptionListFailure(state, action: PayloadAction<string>) {
      state.prescriptionLoading = false;
      state.prescriptionError = action.payload;
    },
    fetchPrescriptionDetailRequest(state, _action: PayloadAction<string>) {
      state.prescriptionDetailLoading = true;
      state.prescriptionDetailError = null;
    },
    fetchPrescriptionDetailSuccess(
      state,
      action: PayloadAction<PrescriptionDetail>
    ) {
      state.prescriptionDetailLoading = false;
      state.prescriptionDetail = action.payload;
    },
    fetchPrescriptionDetailFailure(state, action: PayloadAction<string>) {
      state.prescriptionDetailLoading = false;
      state.prescriptionDetailError = action.payload;
    },

    // ----- 약품 폐기 관리 (HL2-10) -----
    registerDisposalRequest(
      state,
      _action: PayloadAction<DisposalRegisterRequest>
    ) {
      state.disposalLoading = true;
      state.disposalError = null;
    },
    registerDisposalSuccess(state) {
      state.disposalLoading = false;
    },
    registerDisposalFailure(state, action: PayloadAction<string>) {
      state.disposalLoading = false;
      state.disposalError = action.payload;
    },
  },
});

export const {
  fetchMedicationListRequest,
  fetchMedicationListSuccess,
  fetchMedicationListFailure,
  registerMedicationRequest,
  registerMedicationSuccess,
  registerMedicationFailure,

  importMedicationsRequest,
  importMedicationsSuccess,
  importMedicationsFailure,

  fetchInventoryListRequest,
  fetchInventoryListSuccess,
  fetchInventoryListFailure,

  fetchReceiptListRequest,
  fetchReceiptListSuccess,
  fetchReceiptListFailure,
  registerReceiptRequest,
  registerReceiptSuccess,
  registerReceiptFailure,

  fetchIssuanceListRequest,
  fetchIssuanceListSuccess,
  fetchIssuanceListFailure,
  registerIssuanceRequest,
  registerIssuanceSuccess,
  registerIssuanceFailure,

  fetchPrescriptionListRequest,
  fetchPrescriptionListSuccess,
  fetchPrescriptionListFailure,
  fetchPrescriptionDetailRequest,
  fetchPrescriptionDetailSuccess,
  fetchPrescriptionDetailFailure,

  registerDisposalRequest,
  registerDisposalSuccess,
  registerDisposalFailure,
} = pharmacySlice.actions;

export default pharmacySlice.reducer;

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ControlledDrugDisposalRequest,
  ControlledDrugIssuanceRequest,
  ControlledDrugReceiptRequest,
  ControlledDrugRecordDto,
  DispensingCancelRequest,
  DisposalRegisterRequest,
  IssuanceDto,
  IssuanceRegisterRequest,
  InventoryDto,
  Medication,
  MedicationRegisterForm,
  MedicationReturnRegisterRequest,
  PharmacyState,
  PrescriptionDetail,
  PrescriptionListItem,
  PrescriptionRejectRequest,
  ReceiptDto,
  ReceiptRegisterRequest,
  ReleaseCancelRequest,
  ReleaseRegisterRequest,
  ReturnedDisposalRegisterRequest,
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

  prescriptionActionLoading: false,
  prescriptionActionError: null,

  disposalLoading: false,
  disposalError: null,

  releaseLoading: false,
  releaseError: null,

  returnLoading: false,
  returnError: null,
  lastReturnItemId: null,

  controlledDrugRegisterLoading: false,
  controlledDrugRegisterError: null,

  controlledDrugRecordList: [],
  controlledDrugRecordLoading: false,
  controlledDrugRecordError: null,
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
      // 다른 처방전 상세로 이동했을 때 이전 처방전의 조제완료/거절 에러가 남아 보이지 않도록 비운다.
      state.prescriptionActionError = null;
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

    // ----- 조제완료/조제거절 (HL2-18) -----
    dispensePrescriptionRequest(state, _action: PayloadAction<string>) {
      state.prescriptionActionLoading = true;
      state.prescriptionActionError = null;
    },
    dispensePrescriptionSuccess(state) {
      state.prescriptionActionLoading = false;
      if (state.prescriptionDetail) {
        state.prescriptionDetail.status = "DISPENSED";
      }
    },
    dispensePrescriptionFailure(state, action: PayloadAction<string>) {
      state.prescriptionActionLoading = false;
      state.prescriptionActionError = action.payload;
    },
    rejectPrescriptionRequest(
      state,
      _action: PayloadAction<PrescriptionRejectRequest>
    ) {
      state.prescriptionActionLoading = true;
      state.prescriptionActionError = null;
    },
    rejectPrescriptionSuccess(state, action: PayloadAction<string>) {
      state.prescriptionActionLoading = false;
      if (state.prescriptionDetail) {
        state.prescriptionDetail.status = "REJECTED";
        state.prescriptionDetail.rejectReason = action.payload;
      }
    },
    rejectPrescriptionFailure(state, action: PayloadAction<string>) {
      state.prescriptionActionLoading = false;
      state.prescriptionActionError = action.payload;
    },

    // ----- 조제취소 (HL2-18) -----
    cancelDispensePrescriptionRequest(
      state,
      _action: PayloadAction<DispensingCancelRequest>
    ) {
      state.prescriptionActionLoading = true;
      state.prescriptionActionError = null;
    },
    cancelDispensePrescriptionSuccess(state) {
      state.prescriptionActionLoading = false;
      // 상세 데이터(조제항목별 dispensingItemId, 불출 상태)는 saga가 이어서
      // fetchPrescriptionDetailRequest를 다시 호출해 서버 값으로 갱신한다.
    },
    cancelDispensePrescriptionFailure(state, action: PayloadAction<string>) {
      state.prescriptionActionLoading = false;
      state.prescriptionActionError = action.payload;
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

    // ----- 불출/불출취소 (HL2-20, HL2-21) -----
    registerReleaseRequest(state, _action: PayloadAction<ReleaseRegisterRequest>) {
      state.releaseLoading = true;
      state.releaseError = null;
    },
    registerReleaseSuccess(state) {
      state.releaseLoading = false;
    },
    registerReleaseFailure(state, action: PayloadAction<string>) {
      state.releaseLoading = false;
      state.releaseError = action.payload;
    },
    cancelReleaseRequest(state, _action: PayloadAction<ReleaseCancelRequest>) {
      state.releaseLoading = true;
      state.releaseError = null;
    },
    cancelReleaseSuccess(state) {
      state.releaseLoading = false;
    },
    cancelReleaseFailure(state, action: PayloadAction<string>) {
      state.releaseLoading = false;
      state.releaseError = action.payload;
    },

    // ----- 반납/반납약품폐기 (HL2-22, HL2-23) -----
    registerMedicationReturnRequest(
      state,
      _action: PayloadAction<MedicationReturnRegisterRequest>
    ) {
      state.returnLoading = true;
      state.returnError = null;
      state.lastReturnItemId = null;
    },
    registerMedicationReturnSuccess(state, action: PayloadAction<string>) {
      state.returnLoading = false;
      state.lastReturnItemId = action.payload;
    },
    registerMedicationReturnFailure(state, action: PayloadAction<string>) {
      state.returnLoading = false;
      state.returnError = action.payload;
    },
    registerReturnedDisposalRequest(
      state,
      _action: PayloadAction<ReturnedDisposalRegisterRequest>
    ) {
      state.returnLoading = true;
      state.returnError = null;
    },
    registerReturnedDisposalSuccess(state) {
      state.returnLoading = false;
      state.lastReturnItemId = null;
    },
    registerReturnedDisposalFailure(state, action: PayloadAction<string>) {
      state.returnLoading = false;
      state.returnError = action.payload;
    },

    // ----- 특수약품(마약류) 관리 (HL2-11~16) -----
    registerControlledDrugReceiptRequest(
      state,
      _action: PayloadAction<ControlledDrugReceiptRequest>
    ) {
      state.controlledDrugRegisterLoading = true;
      state.controlledDrugRegisterError = null;
    },
    registerControlledDrugIssuanceRequest(
      state,
      _action: PayloadAction<ControlledDrugIssuanceRequest>
    ) {
      state.controlledDrugRegisterLoading = true;
      state.controlledDrugRegisterError = null;
    },
    registerControlledDrugDisposalRequest(
      state,
      _action: PayloadAction<ControlledDrugDisposalRequest>
    ) {
      state.controlledDrugRegisterLoading = true;
      state.controlledDrugRegisterError = null;
    },
    registerControlledDrugSuccess(state) {
      state.controlledDrugRegisterLoading = false;
    },
    registerControlledDrugFailure(state, action: PayloadAction<string>) {
      state.controlledDrugRegisterLoading = false;
      state.controlledDrugRegisterError = action.payload;
    },
    fetchControlledDrugRecordsRequest(
      state,
      _action: PayloadAction<string | undefined>
    ) {
      state.controlledDrugRecordLoading = true;
      state.controlledDrugRecordError = null;
    },
    fetchControlledDrugRecordsSuccess(
      state,
      action: PayloadAction<ControlledDrugRecordDto[]>
    ) {
      state.controlledDrugRecordLoading = false;
      state.controlledDrugRecordList = action.payload;
    },
    fetchControlledDrugRecordsFailure(state, action: PayloadAction<string>) {
      state.controlledDrugRecordLoading = false;
      state.controlledDrugRecordError = action.payload;
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

  dispensePrescriptionRequest,
  dispensePrescriptionSuccess,
  dispensePrescriptionFailure,
  rejectPrescriptionRequest,
  rejectPrescriptionSuccess,
  rejectPrescriptionFailure,
  cancelDispensePrescriptionRequest,
  cancelDispensePrescriptionSuccess,
  cancelDispensePrescriptionFailure,

  registerDisposalRequest,
  registerDisposalSuccess,
  registerDisposalFailure,

  registerReleaseRequest,
  registerReleaseSuccess,
  registerReleaseFailure,
  cancelReleaseRequest,
  cancelReleaseSuccess,
  cancelReleaseFailure,

  registerMedicationReturnRequest,
  registerMedicationReturnSuccess,
  registerMedicationReturnFailure,
  registerReturnedDisposalRequest,
  registerReturnedDisposalSuccess,
  registerReturnedDisposalFailure,

  registerControlledDrugReceiptRequest,
  registerControlledDrugIssuanceRequest,
  registerControlledDrugDisposalRequest,
  registerControlledDrugSuccess,
  registerControlledDrugFailure,
  fetchControlledDrugRecordsRequest,
  fetchControlledDrugRecordsSuccess,
  fetchControlledDrugRecordsFailure,
} = pharmacySlice.actions;

export default pharmacySlice.reducer;

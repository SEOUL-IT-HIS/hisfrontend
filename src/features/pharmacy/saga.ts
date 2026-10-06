import type { PayloadAction } from "@reduxjs/toolkit";
import { call, put, takeLatest } from "redux-saga/effects";
import {
  cancelDispensePrescription,
  cancelRelease,
  createControlledDrugDisposal,
  createControlledDrugIssuance,
  createControlledDrugReceipt,
  createDisposal,
  createIssuance,
  createMedication,
  createMedicationReturn,
  createReceipt,
  createRelease,
  createReturnedDisposal,
  dispensePrescription,
  getControlledDrugRecords,
  getInventoryList,
  getIssuanceList,
  getMedicationList,
  getPrescriptionDetail,
  getPrescriptionList,
  getReceiptList,
  importMedicationsFromPublicApi,
  rejectPrescription,
} from "./api";
import { PHM_MESSAGES } from "./messages";
import {
  cancelDispensePrescriptionFailure,
  cancelDispensePrescriptionRequest,
  cancelDispensePrescriptionSuccess,
  cancelReleaseFailure,
  cancelReleaseRequest,
  cancelReleaseSuccess,
  dispensePrescriptionFailure,
  dispensePrescriptionRequest,
  dispensePrescriptionSuccess,
  fetchControlledDrugRecordsFailure,
  fetchControlledDrugRecordsRequest,
  fetchControlledDrugRecordsSuccess,
  fetchInventoryListFailure,
  fetchInventoryListRequest,
  fetchInventoryListSuccess,
  fetchIssuanceListFailure,
  fetchIssuanceListRequest,
  fetchIssuanceListSuccess,
  fetchMedicationListFailure,
  fetchMedicationListRequest,
  fetchMedicationListSuccess,
  fetchPrescriptionDetailFailure,
  fetchPrescriptionDetailRequest,
  fetchPrescriptionDetailSuccess,
  fetchPrescriptionListFailure,
  fetchPrescriptionListRequest,
  fetchPrescriptionListSuccess,
  fetchReceiptListFailure,
  fetchReceiptListRequest,
  fetchReceiptListSuccess,
  importMedicationsFailure,
  importMedicationsRequest,
  importMedicationsSuccess,
  registerControlledDrugDisposalRequest,
  registerControlledDrugFailure,
  registerControlledDrugIssuanceRequest,
  registerControlledDrugReceiptRequest,
  registerControlledDrugSuccess,
  registerDisposalFailure,
  registerDisposalRequest,
  registerDisposalSuccess,
  registerIssuanceFailure,
  registerIssuanceRequest,
  registerIssuanceSuccess,
  registerMedicationFailure,
  registerMedicationRequest,
  registerMedicationReturnFailure,
  registerMedicationReturnRequest,
  registerMedicationReturnSuccess,
  registerMedicationSuccess,
  registerReceiptFailure,
  registerReceiptRequest,
  registerReceiptSuccess,
  registerReleaseFailure,
  registerReleaseRequest,
  registerReleaseSuccess,
  registerReturnedDisposalFailure,
  registerReturnedDisposalRequest,
  registerReturnedDisposalSuccess,
  rejectPrescriptionFailure,
  rejectPrescriptionRequest,
  rejectPrescriptionSuccess,
} from "./slice";
import type {
  ControlledDrugDisposalRequest,
  ControlledDrugIssuanceRequest,
  ControlledDrugReceiptRequest,
  DispensingCancelRequest,
  DisposalRegisterRequest,
  IssuanceRegisterRequest,
  Medication,
  MedicationRegisterForm,
  MedicationReturnRegisterRequest,
  PrescriptionRejectRequest,
  ReceiptRegisterRequest,
  ReleaseCancelRequest,
  ReleaseRegisterRequest,
  ReturnedDisposalRegisterRequest,
} from "./types";

function resolveErrorMessage(error: unknown): string {
  const code = error instanceof Error ? error.message : "";
  return (
    (PHM_MESSAGES as Record<string, string>)[code] ??
    "An error occurred while processing the request."
  );
}

function* fetchMedicationListSaga() {
  try {
    const response: Awaited<ReturnType<typeof getMedicationList>> =
      yield call(getMedicationList);
    const medicationList: Medication[] = response.data;
    yield put(fetchMedicationListSuccess(medicationList));
  } catch (error) {
    yield put(fetchMedicationListFailure(resolveErrorMessage(error)));
  }
}

function* registerMedicationSaga(
  action: PayloadAction<MedicationRegisterForm>
) {
  try {
    yield call(createMedication, action.payload);
    yield put(registerMedicationSuccess());
  } catch (error) {
    yield put(registerMedicationFailure(resolveErrorMessage(error)));
  }
}

// ----- 공공API(의약품 낱알식별정보) 가져오기 -----
function* importMedicationsSaga() {
  try {
    const response: Awaited<ReturnType<typeof importMedicationsFromPublicApi>> =
      yield call(importMedicationsFromPublicApi);
    yield put(importMedicationsSuccess(response.data));
  } catch (error) {
    yield put(importMedicationsFailure(resolveErrorMessage(error)));
  }
}

// ----- 약품 재고 조회 (HL2-5) -----
function* fetchInventoryListSaga() {
  try {
    const response: Awaited<ReturnType<typeof getInventoryList>> =
      yield call(getInventoryList);
    yield put(fetchInventoryListSuccess(response.data.content));
  } catch (error) {
    yield put(fetchInventoryListFailure(resolveErrorMessage(error)));
  }
}

// ----- 약품 입고 조회 (HL2-7) -----
function* fetchReceiptListSaga() {
  try {
    const response: Awaited<ReturnType<typeof getReceiptList>> =
      yield call(getReceiptList);
    yield put(fetchReceiptListSuccess(response.data));
  } catch (error) {
    yield put(fetchReceiptListFailure(resolveErrorMessage(error)));
  }
}

// ----- 약품 입고 등록 -----
function* registerReceiptSaga(action: PayloadAction<ReceiptRegisterRequest>) {
  try {
    yield call(createReceipt, action.payload);
    yield put(registerReceiptSuccess());
  } catch (error) {
    yield put(registerReceiptFailure(resolveErrorMessage(error)));
  }
}

// ----- 약품 출고 등록/조회 (HL2-8, HL2-9) -----
function* fetchIssuanceListSaga() {
  try {
    const response: Awaited<ReturnType<typeof getIssuanceList>> =
      yield call(getIssuanceList);
    yield put(fetchIssuanceListSuccess(response.data));
  } catch (error) {
    yield put(fetchIssuanceListFailure(resolveErrorMessage(error)));
  }
}

function* registerIssuanceSaga(action: PayloadAction<IssuanceRegisterRequest>) {
  try {
    yield call(createIssuance, action.payload);
    yield put(registerIssuanceSuccess());
  } catch (error) {
    yield put(registerIssuanceFailure(resolveErrorMessage(error)));
  }
}

// ----- 처방전 목록/상세 조회 (HL2-17) -----
function* fetchPrescriptionListSaga() {
  try {
    const response: Awaited<ReturnType<typeof getPrescriptionList>> =
      yield call(getPrescriptionList);
    yield put(fetchPrescriptionListSuccess(response.data.content));
  } catch (error) {
    yield put(fetchPrescriptionListFailure(resolveErrorMessage(error)));
  }
}

function* fetchPrescriptionDetailSaga(action: PayloadAction<string>) {
  try {
    const response: Awaited<ReturnType<typeof getPrescriptionDetail>> =
      yield call(getPrescriptionDetail, action.payload);
    yield put(fetchPrescriptionDetailSuccess(response.data));
  } catch (error) {
    yield put(fetchPrescriptionDetailFailure(resolveErrorMessage(error)));
  }
}

// ----- 조제완료/조제거절 (HL2-18) -----
function* dispensePrescriptionSaga(action: PayloadAction<string>) {
  try {
    yield call(dispensePrescription, action.payload);
    yield put(dispensePrescriptionSuccess());
  } catch (error) {
    yield put(dispensePrescriptionFailure(resolveErrorMessage(error)));
  }
}

function* rejectPrescriptionSaga(
  action: PayloadAction<PrescriptionRejectRequest>
) {
  try {
    yield call(rejectPrescription, action.payload);
    yield put(rejectPrescriptionSuccess(action.payload.reason));
  } catch (error) {
    yield put(rejectPrescriptionFailure(resolveErrorMessage(error)));
  }
}

// ----- 조제취소 (HL2-18) -----
function* cancelDispensePrescriptionSaga(
  action: PayloadAction<DispensingCancelRequest>
) {
  try {
    yield call(cancelDispensePrescription, action.payload);
    yield put(cancelDispensePrescriptionSuccess());
    // 조제취소 후에는 조제항목별 dispensingItemId/불출 정보가 전부 비워지므로 다시 불러온다.
    yield put(fetchPrescriptionDetailRequest(action.payload.prescriptionLinkId));
  } catch (error) {
    yield put(cancelDispensePrescriptionFailure(resolveErrorMessage(error)));
  }
}

// ----- 약품 폐기 관리 (HL2-10) -----
function* registerDisposalSaga(action: PayloadAction<DisposalRegisterRequest>) {
  try {
    yield call(createDisposal, action.payload);
    yield put(registerDisposalSuccess());
  } catch (error) {
    yield put(registerDisposalFailure(resolveErrorMessage(error)));
  }
}

// ----- 불출/불출취소 (HL2-20, HL2-21) -----
function* registerReleaseSaga(action: PayloadAction<ReleaseRegisterRequest>) {
  try {
    yield call(createRelease, action.payload);
    yield put(registerReleaseSuccess());
    yield put(fetchPrescriptionDetailRequest(action.payload.prescriptionLinkId));
  } catch (error) {
    yield put(registerReleaseFailure(resolveErrorMessage(error)));
  }
}

function* cancelReleaseSaga(action: PayloadAction<ReleaseCancelRequest>) {
  try {
    yield call(cancelRelease, action.payload);
    yield put(cancelReleaseSuccess());
    yield put(fetchPrescriptionDetailRequest(action.payload.prescriptionLinkId));
  } catch (error) {
    yield put(cancelReleaseFailure(resolveErrorMessage(error)));
  }
}

// ----- 반납/반납약품폐기 (HL2-22, HL2-23) -----
function* registerMedicationReturnSaga(
  action: PayloadAction<MedicationReturnRegisterRequest>
) {
  try {
    const response: Awaited<ReturnType<typeof createMedicationReturn>> =
      yield call(createMedicationReturn, action.payload);
    yield put(registerMedicationReturnSuccess(response.data.medicationReturnItemId));
    yield put(fetchPrescriptionDetailRequest(action.payload.prescriptionLinkId));
  } catch (error) {
    yield put(registerMedicationReturnFailure(resolveErrorMessage(error)));
  }
}

function* registerReturnedDisposalSaga(
  action: PayloadAction<ReturnedDisposalRegisterRequest>
) {
  try {
    yield call(createReturnedDisposal, action.payload);
    yield put(registerReturnedDisposalSuccess());
    yield put(fetchPrescriptionDetailRequest(action.payload.prescriptionLinkId));
  } catch (error) {
    yield put(registerReturnedDisposalFailure(resolveErrorMessage(error)));
  }
}

// ----- 특수약품(마약류) 관리 (HL2-11~16) -----
function* registerControlledDrugReceiptSaga(
  action: PayloadAction<ControlledDrugReceiptRequest>
) {
  try {
    yield call(createControlledDrugReceipt, action.payload);
    yield put(registerControlledDrugSuccess());
  } catch (error) {
    yield put(registerControlledDrugFailure(resolveErrorMessage(error)));
  }
}

function* registerControlledDrugIssuanceSaga(
  action: PayloadAction<ControlledDrugIssuanceRequest>
) {
  try {
    yield call(createControlledDrugIssuance, action.payload);
    yield put(registerControlledDrugSuccess());
  } catch (error) {
    yield put(registerControlledDrugFailure(resolveErrorMessage(error)));
  }
}

function* registerControlledDrugDisposalSaga(
  action: PayloadAction<ControlledDrugDisposalRequest>
) {
  try {
    yield call(createControlledDrugDisposal, action.payload);
    yield put(registerControlledDrugSuccess());
  } catch (error) {
    yield put(registerControlledDrugFailure(resolveErrorMessage(error)));
  }
}

function* fetchControlledDrugRecordsSaga(
  action: PayloadAction<string | undefined>
) {
  try {
    const response: Awaited<ReturnType<typeof getControlledDrugRecords>> =
      yield call(getControlledDrugRecords, action.payload);
    yield put(fetchControlledDrugRecordsSuccess(response.data));
  } catch (error) {
    yield put(fetchControlledDrugRecordsFailure(resolveErrorMessage(error)));
  }
}

export default function* pharmacySaga() {
  yield takeLatest(fetchMedicationListRequest.type, fetchMedicationListSaga);
  yield takeLatest(registerMedicationRequest.type, registerMedicationSaga);
  yield takeLatest(importMedicationsRequest.type, importMedicationsSaga);
  yield takeLatest(fetchInventoryListRequest.type, fetchInventoryListSaga);
  yield takeLatest(fetchReceiptListRequest.type, fetchReceiptListSaga);
  yield takeLatest(registerReceiptRequest.type, registerReceiptSaga);
  yield takeLatest(fetchIssuanceListRequest.type, fetchIssuanceListSaga);
  yield takeLatest(registerIssuanceRequest.type, registerIssuanceSaga);
  yield takeLatest(
    fetchPrescriptionListRequest.type,
    fetchPrescriptionListSaga
  );
  yield takeLatest(
    fetchPrescriptionDetailRequest.type,
    fetchPrescriptionDetailSaga
  );
  yield takeLatest(dispensePrescriptionRequest.type, dispensePrescriptionSaga);
  yield takeLatest(rejectPrescriptionRequest.type, rejectPrescriptionSaga);
  yield takeLatest(
    cancelDispensePrescriptionRequest.type,
    cancelDispensePrescriptionSaga
  );
  yield takeLatest(registerDisposalRequest.type, registerDisposalSaga);
  yield takeLatest(registerReleaseRequest.type, registerReleaseSaga);
  yield takeLatest(cancelReleaseRequest.type, cancelReleaseSaga);
  yield takeLatest(
    registerMedicationReturnRequest.type,
    registerMedicationReturnSaga
  );
  yield takeLatest(
    registerReturnedDisposalRequest.type,
    registerReturnedDisposalSaga
  );
  yield takeLatest(
    registerControlledDrugReceiptRequest.type,
    registerControlledDrugReceiptSaga
  );
  yield takeLatest(
    registerControlledDrugIssuanceRequest.type,
    registerControlledDrugIssuanceSaga
  );
  yield takeLatest(
    registerControlledDrugDisposalRequest.type,
    registerControlledDrugDisposalSaga
  );
  yield takeLatest(
    fetchControlledDrugRecordsRequest.type,
    fetchControlledDrugRecordsSaga
  );
}

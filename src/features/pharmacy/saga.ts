import type { PayloadAction } from "@reduxjs/toolkit";
import { call, put, takeLatest } from "redux-saga/effects";
import {
  createDisposal,
  createIssuance,
  createMedication,
  createReceipt,
  getInventoryList,
  getIssuanceList,
  getMedicationList,
  getPrescriptionDetail,
  getPrescriptionList,
  getReceiptList,
  importMedicationsFromPublicApi,
} from "./api";
import { PHM_MESSAGES } from "./messages";
import {
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
  registerDisposalFailure,
  registerDisposalRequest,
  registerDisposalSuccess,
  registerIssuanceFailure,
  registerIssuanceRequest,
  registerIssuanceSuccess,
  registerMedicationFailure,
  registerMedicationRequest,
  registerMedicationSuccess,
  registerReceiptFailure,
  registerReceiptRequest,
  registerReceiptSuccess,
} from "./slice";
import type {
  DisposalRegisterRequest,
  IssuanceRegisterRequest,
  Medication,
  MedicationRegisterForm,
  ReceiptRegisterRequest,
} from "./types";

function resolveErrorMessage(error: unknown): string {
  const code = error instanceof Error ? error.message : "";
  return (
    (PHM_MESSAGES as Record<string, string>)[code] ??
    "약품 처리 중 오류가 발생했습니다."
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

// ----- 약품 폐기 관리 (HL2-10) -----
function* registerDisposalSaga(action: PayloadAction<DisposalRegisterRequest>) {
  try {
    yield call(createDisposal, action.payload);
    yield put(registerDisposalSuccess());
  } catch (error) {
    yield put(registerDisposalFailure(resolveErrorMessage(error)));
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
  yield takeLatest(registerDisposalRequest.type, registerDisposalSaga);
}

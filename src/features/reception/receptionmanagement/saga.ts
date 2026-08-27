import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  getReceptionList,
  getReceptionDetail,
  getDepartments,
  getDoctors,
  registerReception,
  cancelReception,
} from "./api";
import { fetchPatientsByIds } from "@/features/reception/patientmanagement/api";
import type { PatientBatchItem } from "@/features/reception/patientmanagement/types";
import {
  fetchReceptionListRequest,
  fetchReceptionListSuccess,
  fetchReceptionListFailure,
  fetchReceptionDetailRequest,
  fetchReceptionDetailSuccess,
  fetchReceptionDetailFailure,
  fetchDepartmentsRequest,
  fetchDepartmentsSuccess,
  fetchDepartmentsFailure,
  fetchDoctorsRequest,
  fetchDoctorsSuccess,
  fetchDoctorsFailure,
  registerReceptionRequest,
  registerReceptionSuccess,
  registerReceptionFailure,
  cancelReceptionRequest,
  cancelReceptionSuccess,
  cancelReceptionFailure,
} from "./slice";
import type {
  ReceptionListItem,
  ReceptionDetail,
  ReceptionListQuery,
  ReceptionRegisterRequest,
  ReceptionCancelRequest,
  DepartmentOption,
  DoctorOption,
} from "./types";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

/**
 * patientId 를 가진 항목들에 환자명을 채워 넣는다.
 * - reception-service는 patientId만 내려주므로, 표시용 이름은 CB2 batch 조회로 프론트에서 조합한다.
 * - 이름 조회가 실패해도 접수 목록/상세 자체는 보여줘야 하므로 실패 시 원본 그대로 반환한다.
 */
function* attachPatientNames<T extends { patientId: string; patientName: string }>(
  items: T[],
) {
  const patientIds = [...new Set(items.map((item) => item.patientId).filter(Boolean))];
  if (patientIds.length === 0) return items;

  try {
    const patients: PatientBatchItem[] = yield call(fetchPatientsByIds, patientIds);
    const nameById = new Map(patients.map((p) => [p.patientId, p.patientName]));
    return items.map((item) => ({
      ...item,
      patientName: nameById.get(item.patientId) ?? item.patientName,
    }));
  } catch {
    return items;
  }
}

function* fetchReceptionListSaga(action: PayloadAction<ReceptionListQuery>) {
  try {
    const items: ReceptionListItem[] = yield call(
      getReceptionList,
      action.payload,
    );
    const enriched: ReceptionListItem[] = yield call(attachPatientNames, items);
    yield put(fetchReceptionListSuccess(enriched));
  } catch (err) {
    yield put(
      fetchReceptionListFailure(
        errorMessage(err, "접수 목록 조회에 실패했습니다."),
      ),
    );
  }
}

function* fetchReceptionDetailSaga(action: PayloadAction<string>) {
  try {
    const detail: ReceptionDetail = yield call(
      getReceptionDetail,
      action.payload,
    );
    const [enriched]: ReceptionDetail[] = yield call(attachPatientNames, [detail]);
    yield put(fetchReceptionDetailSuccess(enriched));
  } catch (err) {
    yield put(
      fetchReceptionDetailFailure(
        errorMessage(err, "접수 상세 조회에 실패했습니다."),
      ),
    );
  }
}

function* fetchDepartmentsSaga() {
  try {
    const departments: DepartmentOption[] = yield call(getDepartments);
    yield put(fetchDepartmentsSuccess(departments));
  } catch (err) {
    yield put(
      fetchDepartmentsFailure(
        errorMessage(err, "진료과 목록 조회에 실패했습니다."),
      ),
    );
  }
}

function* fetchDoctorsSaga(action: PayloadAction<string>) {
  try {
    const doctors: DoctorOption[] = yield call(getDoctors, action.payload);
    yield put(fetchDoctorsSuccess(doctors));
  } catch (err) {
    yield put(
      fetchDoctorsFailure(errorMessage(err, "의사 목록 조회에 실패했습니다.")),
    );
  }
}

function* registerReceptionSaga(
  action: PayloadAction<ReceptionRegisterRequest>,
) {
  try {
    yield call(registerReception, action.payload);
    yield put(registerReceptionSuccess());
    yield put(fetchReceptionListRequest());
  } catch (err) {
    yield put(
      registerReceptionFailure(errorMessage(err, "접수 등록에 실패했습니다.")),
    );
  }
}

function* cancelReceptionSaga(action: PayloadAction<ReceptionCancelRequest>) {
  try {
    yield call(cancelReception, action.payload);
    yield put(cancelReceptionSuccess());
    yield put(fetchReceptionListRequest());
  } catch (err) {
    yield put(
      cancelReceptionFailure(errorMessage(err, "접수 취소에 실패했습니다.")),
    );
  }
}

export default function* receptionManagementSaga() {
  yield takeLatest(fetchReceptionListRequest.type, fetchReceptionListSaga);
  yield takeLatest(
    fetchReceptionDetailRequest.type,
    fetchReceptionDetailSaga,
  );
  yield takeLatest(fetchDepartmentsRequest.type, fetchDepartmentsSaga);
  yield takeLatest(fetchDoctorsRequest.type, fetchDoctorsSaga);
  yield takeLatest(registerReceptionRequest.type, registerReceptionSaga);
  yield takeLatest(cancelReceptionRequest.type, cancelReceptionSaga);
}

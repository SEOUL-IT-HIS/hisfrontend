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

/** 접수 취소 시 백엔드가 message 에 담아 보내는 에러코드 → 화면 문구 */
const CANCEL_ERROR_MESSAGES: Record<string, string> = {
  RCP002: "This reception has already been cancelled.",
  RCP009: "This reception cannot be cancelled because treatment has already started in the emergency department.",
  RCP010: "Unable to verify whether the emergency reception can be cancelled. Please try again later.",
  RCP014: "This reception cannot be cancelled because the consultation has already started in the outpatient department.",
  RCP015: "Unable to verify the outpatient consultation status. Please try again later.",
};

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
        errorMessage(err, "Failed to load the reception list."),
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
        errorMessage(err, "Failed to load the reception details."),
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
        errorMessage(err, "Failed to load the department list."),
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
      fetchDoctorsFailure(errorMessage(err, "Failed to load the doctor list.")),
    );
  }
}

/** 접수 등록 시 백엔드가 message 에 담아 보내는 에러코드 → 화면 문구 */
const REGISTER_ERROR_MESSAGES: Record<string, string> = {
  RCP006: "Please select a doctor.",
  RCP007: "Invalid visit type.",
  RCP012: "The reservation could not be found.",
  RCP013: "This reservation has already been received or does not match the selected patient.",
};

function* registerReceptionSaga(
  action: PayloadAction<ReceptionRegisterRequest>,
) {
  try {
    yield call(registerReception, action.payload);
    yield put(registerReceptionSuccess());
    yield put(fetchReceptionListRequest());
  } catch (err) {
    yield put(
      registerReceptionFailure(
        REGISTER_ERROR_MESSAGES[errorMessage(err, "")] ??
          errorMessage(err, "Failed to register the reception."),
      ),
    );
  }
}

function* cancelReceptionSaga(action: PayloadAction<ReceptionCancelRequest>) {
  try {
    yield call(cancelReception, action.payload);
    yield put(cancelReceptionSuccess());
    yield put(fetchReceptionListRequest());
  } catch (err) {
    const message = errorMessage(err, "Failed to cancel the reception.");
    yield put(cancelReceptionFailure(CANCEL_ERROR_MESSAGES[message] ?? message));
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

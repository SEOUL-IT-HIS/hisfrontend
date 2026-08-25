import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  getReceptionList,
  getReceptionDetail,
  getDepartments,
  getDoctors,
  registerReception,
} from "./api";
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
} from "./slice";
import type {
  ReceptionListItem,
  ReceptionDetail,
  ReceptionListQuery,
  ReceptionRegisterRequest,
  DepartmentOption,
  DoctorOption,
} from "./types";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function* fetchReceptionListSaga(action: PayloadAction<ReceptionListQuery>) {
  try {
    const items: ReceptionListItem[] = yield call(
      getReceptionList,
      action.payload,
    );
    yield put(fetchReceptionListSuccess(items));
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
    yield put(fetchReceptionDetailSuccess(detail));
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

export default function* receptionManagementSaga() {
  yield takeLatest(fetchReceptionListRequest.type, fetchReceptionListSaga);
  yield takeLatest(
    fetchReceptionDetailRequest.type,
    fetchReceptionDetailSaga,
  );
  yield takeLatest(fetchDepartmentsRequest.type, fetchDepartmentsSaga);
  yield takeLatest(fetchDoctorsRequest.type, fetchDoctorsSaga);
  yield takeLatest(registerReceptionRequest.type, registerReceptionSaga);
}

import { call, put, takeLatest } from "redux-saga/effects";
import {
  checkPatientDuplicateApi,
  registerPatientApi,
} from "../api/patientApi";
import {
  checkPatientDuplicateFailure,
  checkPatientDuplicateRequest,
  checkPatientDuplicateSuccess,
  registerPatientFailure,
  registerPatientRequest,
  registerPatientSuccess,
} from "../slice/patientSlice";
import type { Patient } from "../type/patientType";

function* registerPatientSaga(
  action: ReturnType<typeof registerPatientRequest>,
) {
  try {
    const patient: Patient = yield call(registerPatientApi, action.payload);
    yield put(registerPatientSuccess(patient));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "환자 등록에 실패했습니다.";
    yield put(registerPatientFailure(message));
  }
}

function* checkPatientDuplicateSaga(
  action: ReturnType<typeof checkPatientDuplicateRequest>,
) {
  try {
    const duplicated: boolean = yield call(
      checkPatientDuplicateApi,
      action.payload,
    );
    yield put(checkPatientDuplicateSuccess(duplicated));
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "환자 중복 확인에 실패했습니다.";
    yield put(checkPatientDuplicateFailure(message));
  }
}

export default function* patientSaga() {
  yield takeLatest(registerPatientRequest.type, registerPatientSaga);
  yield takeLatest(
    checkPatientDuplicateRequest.type,
    checkPatientDuplicateSaga,
  );
}

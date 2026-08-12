import { call, put, takeLatest } from "redux-saga/effects";
import { isAxiosError } from "axios";
import {
  checkPatientDuplicateApi,
  fetchPatientDetailApi,
  fetchPatientListApi,
  registerPatientApi,
  updatePatientApi,
} from "../api/patientApi";
import {
  checkPatientDuplicateFailure,
  checkPatientDuplicateRequest,
  checkPatientDuplicateSuccess,
  fetchPatientDetailFailure,
  fetchPatientDetailRequest,
  fetchPatientDetailSuccess,
  fetchPatientListFailure,
  fetchPatientListRequest,
  fetchPatientListSuccess,
  registerPatientFailure,
  registerPatientRequest,
  registerPatientSuccess,
  updatePatientFailure,
  updatePatientRequest,
  updatePatientSuccess,
} from "../slice/patientSlice";
import type {
  Patient,
  PatientDetail,
  PatientListItem,
} from "../type/patientType";

type PatientErrorResponse = {
  message?: string;
};

function getPatientErrorMessage(error: unknown, fallbackMessage: string) {
  if (isAxiosError<PatientErrorResponse>(error)) {
    const responseMessage = error.response?.data?.message;

    if (responseMessage) {
      return responseMessage;
    }

    if (!error.response) {
      return "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.";
    }

    if (error.response.status >= 500) {
      return "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    }
  }

 if (error instanceof Error) {
  const isTechnicalMessage =
    error.message === "Network Error" ||
    error.message.startsWith("Request failed with status code");

  return isTechnicalMessage
    ? "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요."
    : error.message;
}

return fallbackMessage;
}

function* fetchPatientListSaga(
  action: ReturnType<typeof fetchPatientListRequest>,
) {
  try {
    const patients: PatientListItem[] = yield call(
      fetchPatientListApi,
      action.payload,
    );

    yield put(fetchPatientListSuccess(patients));
  } catch (error) {
    const message = getPatientErrorMessage(
      error,
      "환자 목록 조회에 실패했습니다.",
    );

    yield put(fetchPatientListFailure(message));
  }
}

function* fetchPatientDetailSaga(
  action: ReturnType<typeof fetchPatientDetailRequest>,
) {
  try {
    const patient: PatientDetail = yield call(
      fetchPatientDetailApi,
      action.payload,
    );

    yield put(fetchPatientDetailSuccess(patient));
  } catch (error) {
    const message = getPatientErrorMessage(
      error,
      "환자 상세 정보를 불러오지 못했습니다.",
    );

    yield put(fetchPatientDetailFailure(message));
  }
}

function* updatePatientSaga(
  action: ReturnType<typeof updatePatientRequest>,
) {
  try {
    const patient: PatientDetail = yield call(
      updatePatientApi,
      action.payload,
    );

    yield put(updatePatientSuccess(patient));
  } catch (error) {
    const message = getPatientErrorMessage(
      error,
      "환자 정보 수정에 실패했습니다.",
    );

    yield put(updatePatientFailure(message));
  }
}

function* registerPatientSaga(
  action: ReturnType<typeof registerPatientRequest>,
) {
  try {
    const patient: Patient = yield call(registerPatientApi, action.payload);
    yield put(registerPatientSuccess(patient));
} catch (error) {
  const message = getPatientErrorMessage(
    error,
    "환자 등록에 실패했습니다.",
  );
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
   const message = getPatientErrorMessage(
  error,
  "환자 중복 확인에 실패했습니다.",
);
    yield put(checkPatientDuplicateFailure(message));
  }
}

export default function* patientSaga() {
  yield takeLatest(fetchPatientListRequest.type, fetchPatientListSaga);

  yield takeLatest(
    fetchPatientDetailRequest.type,
    fetchPatientDetailSaga,
  );

  yield takeLatest(
  updatePatientRequest.type,
  updatePatientSaga,
);

  yield takeLatest(registerPatientRequest.type, registerPatientSaga);

  yield takeLatest(
    checkPatientDuplicateRequest.type,
    checkPatientDuplicateSaga,
  );
}
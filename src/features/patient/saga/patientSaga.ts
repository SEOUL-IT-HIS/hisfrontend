import { call, put, takeLatest } from "redux-saga/effects";
import { isAxiosError } from "axios";
import {
  checkPatientDuplicateApi,
  fetchPatientDetailApi,
  fetchPatientListApi,
  registerPatientApi,
  updatePatientApi,
  deactivatePatientApi,
  updatePatientDeathApi,
  convertTemporaryPatientApi,
  activatePatientApi,
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
  deactivatePatientFailure,
  deactivatePatientRequest,
  deactivatePatientSuccess,
  updatePatientDeathFailure,
  updatePatientDeathRequest,
  updatePatientDeathSuccess,
  convertTemporaryPatientFailure,
  convertTemporaryPatientRequest,
  convertTemporaryPatientSuccess,
  checkConversionDuplicateFailure,
  checkConversionDuplicateRequest,
  checkConversionDuplicateSuccess,
  activatePatientFailure,
  activatePatientRequest,
  activatePatientSuccess,
} from "../slice/patientSlice";
import type {
  Patient,
  PatientDetail,
  PatientListItem,
} from "../type/patientType";

type PatientErrorResponse = {
  message?: string;
};

const patientErrorTranslations: Record<string, string> = {
  "입력값이 올바르지 않습니다.": "The input is invalid.",
  "일반환자는 환자명을 입력해야 합니다.": "Patient name is required for a regular patient.",
  "일반환자는 생년월일을 입력해야 합니다.": "Date of birth is required for a regular patient.",
  "일반환자는 주민등록번호를 입력해야 합니다.": "Resident registration number is required for a regular patient.",
  "임시환자는 임시등록 사유를 입력해야 합니다.": "Temporary registration reason is required for a temporary patient.",
  "올바른 주민등록번호 형식이 아닙니다.": "The resident registration number is invalid.",
  "주민등록번호와 생년월일이 일치하지 않습니다.": "The resident registration number does not match the date of birth.",
  "이미 등록된 주민등록번호입니다.": "This resident registration number is already registered.",
  "임시환자만 정규환자로 전환할 수 있습니다.": "Only a temporary patient can be converted to a regular patient.",
  "사망 상태인 환자는 활성화할 수 없습니다. 먼저 사망정보를 해제해 주세요.": "A deceased patient cannot be activated. Clear the death information first.",
  "환자 정보를 찾을 수 없습니다.": "Patient information was not found.",
  "사망 환자는 사망일시를 입력해야 합니다.": "The date and time of death is required.",
  "사망일시는 현재 시각보다 이후일 수 없습니다.": "The date and time of death cannot be in the future.",
  "요청 데이터 형식이 올바르지 않습니다.": "The request data format is invalid.",
  "서버 오류가 발생했습니다.": "A server error occurred.",
};

function translatePatientError(message: string, fallbackMessage: string) {
  const translatedMessage = patientErrorTranslations[message];
  if (translatedMessage) return translatedMessage;

  return /[가-힣]/.test(message) ? fallbackMessage : message;
}

function getPatientErrorMessage(error: unknown, fallbackMessage: string) {
  if (isAxiosError<PatientErrorResponse>(error)) {
    const responseMessage = error.response?.data?.message;

    if (responseMessage) {
      return translatePatientError(responseMessage, fallbackMessage);
    }

    if (!error.response) {
      return "Unable to connect to the server. Please try again later.";
    }

    if (error.response.status >= 500) {
      return "A server error occurred. Please try again later.";
    }
  }

  if (error instanceof Error) {
    const isTechnicalMessage =
      error.message === "Network Error" ||
      error.message.startsWith("Request failed with status code");

    return isTechnicalMessage
      ? "Unable to connect to the server. Please try again later."
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
      "Failed to load the patient list.",
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
      "Failed to load patient details.",
    );

    yield put(fetchPatientDetailFailure(message));
  }
}

function* updatePatientSaga(action: ReturnType<typeof updatePatientRequest>) {
  try {
    const patient: PatientDetail = yield call(updatePatientApi, action.payload);

    yield put(updatePatientSuccess(patient));
  } catch (error) {
    const message = getPatientErrorMessage(
      error,
      "Failed to update patient information.",
    );

    yield put(updatePatientFailure(message));
  }
}

function* updatePatientDeathSaga(
  action: ReturnType<typeof updatePatientDeathRequest>,
) {
  try {
    const patient: PatientDetail = yield call(
      updatePatientDeathApi,
      action.payload,
    );

    yield put(updatePatientDeathSuccess(patient));
  } catch (error) {
    const message = getPatientErrorMessage(
      error,
      "Failed to update death information.",
    );

    yield put(updatePatientDeathFailure(message));
  }
}

function* convertTemporaryPatientSaga(
  action: ReturnType<typeof convertTemporaryPatientRequest>,
) {
  try {
    const patient: PatientDetail = yield call(
      convertTemporaryPatientApi,
      action.payload,
    );

    yield put(convertTemporaryPatientSuccess(patient));
  } catch (error) {
    const message = getPatientErrorMessage(
      error,
      "Failed to convert the patient to a regular patient.",
    );

    yield put(convertTemporaryPatientFailure(message));
  }
}

function* checkConversionDuplicateSaga(
  action: ReturnType<typeof checkConversionDuplicateRequest>,
) {
  try {
    const duplicated: boolean = yield call(
      checkPatientDuplicateApi,
      action.payload,
    );
    yield put(checkConversionDuplicateSuccess(duplicated));
  } catch (error) {
    const message = getPatientErrorMessage(
      error,
      "Failed to check the resident registration number.",
    );
    yield put(checkConversionDuplicateFailure(message));
  }
}

function* activatePatientSaga(
  action: ReturnType<typeof activatePatientRequest>,
) {
  try {
    const patient: PatientDetail = yield call(
      activatePatientApi,
      action.payload,
    );
    yield put(activatePatientSuccess(patient));
  } catch (error) {
    const message = getPatientErrorMessage(
      error,
      "Failed to activate the patient.",
    );
    yield put(activatePatientFailure(message));
  }
}

function* deactivatePatientSaga(
  action: ReturnType<typeof deactivatePatientRequest>,
) {
  try {
    const patient: PatientDetail = yield call(
      deactivatePatientApi,
      action.payload,
    );

    yield put(deactivatePatientSuccess(patient));
  } catch (error) {
    const message = getPatientErrorMessage(
      error,
      "Failed to deactivate the patient.",
    );

    yield put(deactivatePatientFailure(message));
  }
}

function* registerPatientSaga(
  action: ReturnType<typeof registerPatientRequest>,
) {
  try {
    const patient: Patient = yield call(registerPatientApi, action.payload);
    yield put(registerPatientSuccess(patient));
  } catch (error) {
    const message = getPatientErrorMessage(error, "Failed to register the patient.");
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
      "Failed to check for a duplicate patient.",
    );
    yield put(checkPatientDuplicateFailure(message));
  }
}

export default function* patientSaga() {
  yield takeLatest(fetchPatientListRequest.type, fetchPatientListSaga);

  yield takeLatest(fetchPatientDetailRequest.type, fetchPatientDetailSaga);

  yield takeLatest(updatePatientRequest.type, updatePatientSaga);

  yield takeLatest(
    convertTemporaryPatientRequest.type,
    convertTemporaryPatientSaga,
  );

  yield takeLatest(updatePatientDeathRequest.type, updatePatientDeathSaga);

  yield takeLatest(deactivatePatientRequest.type, deactivatePatientSaga);

  yield takeLatest(activatePatientRequest.type, activatePatientSaga);

  yield takeLatest(registerPatientRequest.type, registerPatientSaga);

  yield takeLatest(
    checkPatientDuplicateRequest.type,
    checkPatientDuplicateSaga,
  );

  yield takeLatest(
    checkConversionDuplicateRequest.type,
    checkConversionDuplicateSaga,
  );
}

import { isAxiosError } from "axios";
import { all, call, put, race, select, take, takeEvery, takeLatest } from "redux-saga/effects";
import { fetchSafetyListApi, createSafetyApi, updateSafetyApi, deactivateSafetyApi, setSafetyPinnedApi } from "../api/patientSafetyApi";
import type { RootState } from "@/store/store";
import {
  fetchSafetyListRequest,
  fetchSafetyListSuccess,
  fetchSafetyListFailure,
  resetPatientSafety,
  mutateSafetyRequest,
  mutateSafetySuccess,
  mutateSafetyFailure,
} from "../slice/patientSafetySlice";
import type { PatientSafetyInfo } from "../type/patientSafetyType";

function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (!error.response) {
      return "Unable to connect to the server. Please try again.";
    }

    if (error.response.status === 404) {
      return "The patient or safety information was not found. Refresh the list.";
    }

    if (error.response.status === 409) {
      if (error.response.data?.message?.includes("최대 2건")) return "Only 2 items can be pinned. Unpin an existing item first.";
      return "Inactive safety information cannot be edited or pinned. Refresh the list.";
    }

    if (error.response.status === 400) {
      return "Check the input. Safety information is required and must be within 2,000 UTF-8 bytes.";
    }
  }

  return "Unable to complete the request. Please try again.";
}

function* fetchSafetyListSaga(
  action: ReturnType<typeof fetchSafetyListRequest>,
) {
  const request = action.payload;

  try {
    const result: {
      items?: PatientSafetyInfo[];
      reset?: ReturnType<typeof resetPatientSafety>;
    } = yield race({
      items: call(fetchSafetyListApi, request),
      reset: take(resetPatientSafety.type),
    });

    // 화면 종료 등으로 초기화되면 조회 결과를 반영하지 않습니다.
    if (result.reset || result.items === undefined) {
      return;
    }

    yield put(
      fetchSafetyListSuccess({
        ...request,
        items: result.items,
      }),
    );
  } catch (error: unknown) {
    yield put(
      fetchSafetyListFailure({
        ...request,
        message: getErrorMessage(error),
      }),
    );
  }
}

const selectSafety = (state: RootState) => state.patientSafety;

function* mutateSafetySaga(action: ReturnType<typeof mutateSafetyRequest>) {
  const request = action.payload;
  const current: ReturnType<typeof selectSafety> = yield select(selectSafety);
  // The reducer accepts only one mutation. Ignored duplicate actions must not call the API.
  if (current.mutationId !== request.requestId) return;
  try {
    if (request.kind === "create") yield call(createSafetyApi, request);
    else if (request.kind === "pin") yield call(setSafetyPinnedApi, request);
    else if (request.kind === "update") yield call(updateSafetyApi, request);
    else yield call(deactivateSafetyApi, request);

    const latest: ReturnType<typeof selectSafety> = yield select(selectSafety);
    if (latest.mutationId !== request.requestId || latest.patientId !== request.patientId) return;
    yield put(mutateSafetySuccess({ requestId: request.requestId }));
    yield put(fetchSafetyListRequest({ patientId: request.patientId, includeInactive: latest.includeInactive }));
  } catch (error: unknown) {
    yield put(mutateSafetyFailure({ requestId: request.requestId, message: getErrorMessage(error) }));
  }
}

export default function* watchPatientSafetySaga() {
  yield all([
    takeLatest(fetchSafetyListRequest.type, fetchSafetyListSaga),
    takeEvery(mutateSafetyRequest.type, mutateSafetySaga),
  ]);
}

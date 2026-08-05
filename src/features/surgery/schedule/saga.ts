import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  assignSurgery,
  cancelSurgerySchedule,
  endSurgery,
  getSurgeryRequests,
  getSurgerySchedule,
  getSurgerySchedules,
  getTodaySurgeries,
  registerEmergencySurgery,
  registerSurgerySchedule,
  startSurgery,
  updateSurgeryProgress,
  updateSurgerySchedule,
} from "@/features/surgery/schedule/api";
import {
  assignSurgeryRequest,
  cancelSurgeryRequest,
  endSurgeryRequest,
  fetchSurgeriesFailure,
  fetchSurgeriesRequest,
  fetchSurgeriesSuccess,
  fetchSurgeryFailure,
  fetchSurgeryRequest,
  fetchSurgeryRequestsFailure,
  fetchSurgeryRequestsRequest,
  fetchSurgeryRequestsSuccess,
  fetchSurgerySuccess,
  fetchTodaySurgeriesFailure,
  fetchTodaySurgeriesRequest,
  fetchTodaySurgeriesSuccess,
  registerEmergencySurgeryRequest,
  registerSurgeryRequest,
  startSurgeryRequest,
  surgeryMutationFailure,
  surgeryMutationSuccess,
  updateProgressRequest,
  updateSurgeryRequest,
} from "@/features/surgery/schedule/slice";
import type {
  AssignSurgeryRequest,
  CancelSurgeryRequest,
  RegisterSurgeryRequest,
  Surgery,
  SurgeryListParams,
  UpdateProgressRequest,
  UpdateSurgeryRequest,
} from "@/features/surgery/schedule/types";

/**
 * 수술 스케줄링 saga (SL2-2)
 *
 * <p>API 호출은 여기서만 한다(§10.3). 실패 시 Error.message(SUR### 코드 또는 문구)를
 * 그대로 전달하고 문구 변환은 컴포넌트에서 처리한다(§15.1).</p>
 */

// ----- 조회 -----

function* fetchSurgeriesSaga(
  action: PayloadAction<SurgeryListParams | undefined>,
) {
  try {
    const response: Surgery[] = yield call(getSurgerySchedules, action.payload);
    yield put(fetchSurgeriesSuccess(response));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "수술 일정 조회에 실패했습니다.";
    yield put(fetchSurgeriesFailure(message));
  }
}

function* fetchTodaySurgeriesSaga() {
  try {
    const response: Surgery[] = yield call(getTodaySurgeries);
    yield put(fetchTodaySurgeriesSuccess(response));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "금일 수술현황 조회에 실패했습니다.";
    yield put(fetchTodaySurgeriesFailure(message));
  }
}

function* fetchSurgeryRequestsSaga() {
  try {
    const response: Surgery[] = yield call(getSurgeryRequests);
    yield put(fetchSurgeryRequestsSuccess(response));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "수술 요청 목록 조회에 실패했습니다.";
    yield put(fetchSurgeryRequestsFailure(message));
  }
}

function* fetchSurgerySaga(action: PayloadAction<string>) {
  try {
    const response: Surgery = yield call(getSurgerySchedule, action.payload);
    yield put(fetchSurgerySuccess(response));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "수술 정보 조회에 실패했습니다.";
    yield put(fetchSurgeryFailure(message));
  }
}

// ----- 등록/수정 -----

function* registerSurgerySaga(action: PayloadAction<RegisterSurgeryRequest>) {
  try {
    yield call(registerSurgerySchedule, action.payload);
    yield put(surgeryMutationSuccess());
    yield put(fetchSurgeriesRequest());
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "수술 스케줄 등록에 실패했습니다.";
    yield put(surgeryMutationFailure(message));
  }
}

function* registerEmergencySurgerySaga(
  action: PayloadAction<RegisterSurgeryRequest>,
) {
  try {
    yield call(registerEmergencySurgery, action.payload);
    yield put(surgeryMutationSuccess());
    yield put(fetchSurgeriesRequest());
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "긴급 수술 등록에 실패했습니다.";
    yield put(surgeryMutationFailure(message));
  }
}

function* updateSurgerySaga(
  action: PayloadAction<{ surgeryId: string; request: UpdateSurgeryRequest }>,
) {
  try {
    const { surgeryId, request } = action.payload;
    yield call(updateSurgerySchedule, surgeryId, request);
    yield put(surgeryMutationSuccess());
    yield put(fetchSurgeriesRequest());
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "수술 스케줄 수정에 실패했습니다.";
    yield put(surgeryMutationFailure(message));
  }
}

// ----- 배정 -----

function* assignSurgerySaga(
  action: PayloadAction<{ surgeryId: string; request: AssignSurgeryRequest }>,
) {
  try {
    const { surgeryId, request } = action.payload;
    yield call(assignSurgery, surgeryId, request);
    yield put(surgeryMutationSuccess());
    // 배정되면 요청접수 목록에서 빠지므로 대기 목록을 다시 불러온다
    yield put(fetchSurgeryRequestsRequest());
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "수술 배정에 실패했습니다.";
    yield put(surgeryMutationFailure(message));
  }
}

// ----- 상태 전이 -----

function* cancelSurgerySaga(
  action: PayloadAction<{
    surgeryId: string;
    request?: CancelSurgeryRequest;
  }>,
) {
  try {
    const { surgeryId, request } = action.payload;
    yield call(cancelSurgerySchedule, surgeryId, request);
    yield put(surgeryMutationSuccess());
    yield put(fetchSurgeriesRequest());
    // 요청접수 건의 취소는 '반려'라 대기 목록에서도 빠져야 한다
    yield put(fetchSurgeryRequestsRequest());
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "수술 취소에 실패했습니다.";
    yield put(surgeryMutationFailure(message));
  }
}

function* updateProgressSaga(
  action: PayloadAction<{ surgeryId: string; request: UpdateProgressRequest }>,
) {
  try {
    const { surgeryId, request } = action.payload;
    yield call(updateSurgeryProgress, surgeryId, request);
    yield put(surgeryMutationSuccess());
    // 진행상태 변경은 모니터링 화면에서 쓰므로 금일 현황을 갱신한다
    yield put(fetchTodaySurgeriesRequest());
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "진행상태 변경에 실패했습니다.";
    yield put(surgeryMutationFailure(message));
  }
}

function* startSurgerySaga(action: PayloadAction<string>) {
  try {
    yield call(startSurgery, action.payload);
    yield put(surgeryMutationSuccess());
    yield put(fetchTodaySurgeriesRequest());
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "수술 시작 처리에 실패했습니다.";
    yield put(surgeryMutationFailure(message));
  }
}

function* endSurgerySaga(action: PayloadAction<string>) {
  try {
    yield call(endSurgery, action.payload);
    yield put(surgeryMutationSuccess());
    yield put(fetchTodaySurgeriesRequest());
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "수술 종료 처리에 실패했습니다.";
    yield put(surgeryMutationFailure(message));
  }
}

/** 수술 스케줄 관련 요청을 감시한다(최신 요청만 처리) */
export default function* scheduleSaga() {
  yield takeLatest(fetchSurgeriesRequest.type, fetchSurgeriesSaga);
  yield takeLatest(fetchTodaySurgeriesRequest.type, fetchTodaySurgeriesSaga);
  yield takeLatest(fetchSurgeryRequestsRequest.type, fetchSurgeryRequestsSaga);
  yield takeLatest(fetchSurgeryRequest.type, fetchSurgerySaga);
  yield takeLatest(registerSurgeryRequest.type, registerSurgerySaga);
  yield takeLatest(
    registerEmergencySurgeryRequest.type,
    registerEmergencySurgerySaga,
  );
  yield takeLatest(updateSurgeryRequest.type, updateSurgerySaga);
  yield takeLatest(assignSurgeryRequest.type, assignSurgerySaga);
  yield takeLatest(cancelSurgeryRequest.type, cancelSurgerySaga);
  yield takeLatest(updateProgressRequest.type, updateProgressSaga);
  yield takeLatest(startSurgeryRequest.type, startSurgerySaga);
  yield takeLatest(endSurgeryRequest.type, endSurgerySaga);
}

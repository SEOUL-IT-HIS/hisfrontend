/**
 * 수술 스케줄링 saga (SL2-2)
 *
 * <p>saga 는 <b>순서가 있는 부수효과</b>를 맡는다. reducer 는 순수 함수여야 해서 API 호출을
 * 넣을 수 없고, 컴포넌트에 넣으면 화면마다 같은 코드를 반복하게 된다. 그래서 중간층을 둔다 —
 * 백엔드에서 컨트롤러가 아니라 서비스에 업무 규칙을 두는 것과 같은 이유다.</p>
 *
 * <p><b>기본 골격</b> — 이 파일의 사가는 전부 같은 모양이다.</p>
 * <pre>
 *   try {
 *     yield call(api함수, 인자)     // 응답이 올 때까지 기다린다
 *     yield put(성공액션(결과))      // slice 에 결과를 넣는다
 *     yield put(재조회액션())        // (변경 작업일 때) 목록을 다시 불러온다
 *   } catch (err) {
 *     yield put(실패액션(getSurgeryErrorMessage(err, "기본 문구")))
 *   }
 * </pre>
 *
 * <p><b>call / put</b> — call 은 함수를 부르고 끝날 때까지 기다린다. put 은 액션을 흘려보낸다
 * (컴포넌트의 dispatch 와 같다). api.ts 안에서는 async/await 를 쓰지만 saga 안에서는 yield 를
 * 쓴다. 하는 일은 같고, 제너레이터 함수라 문법이 다를 뿐이다.</p>
 *
 * <p><b>takeLatest 를 쓰는 이유</b> — 같은 액션이 연달아 오면 <b>이전 것을 취소하고 마지막만</b>
 * 처리한다. 사용자가 버튼을 빠르게 두 번 눌러도 응답이 뒤섞이지 않는다.
 * 모두 처리해야 하는 경우에는 takeEvery 를 쓰지만, 조회·저장에는 takeLatest 가 맞다.</p>
 *
 * <p><b>변경 후 목록을 다시 부르는 이유</b> — 서버가 최종 상태를 갖고 있어서다. 화면에서
 * 짐작해 상태를 고치면 다른 사람이 동시에 바꾼 내용과 어긋난다. 한 번 더 조회하는 편이 안전하다.</p>
 *
 * <p>맨 아래 default export 가 이 도메인의 watcher 다. features/surgery/saga.ts 가 이들을
 * 묶고, store/rootSaga.ts 는 수술 전체를 한 줄로만 등록한다(§5.4 공용 파일 최소 수정).</p>
 */
import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  cancelSurgerySchedule,
  endSurgery,
  getSurgerySchedule,
  getSurgerySchedules,
  searchSurgeries,
  getSurgeryHistory,
  assignSurgeryField,
  getTodaySurgeries,
  startSurgery,
  updateSurgeryProgress,
  updateSurgerySchedule,
} from "@/features/surgery/schedule/api";
import {
  cancelSurgeryRequest,
  endSurgeryRequest,
  fetchSurgeriesFailure,
  fetchSurgeriesRequest,
  fetchSurgeriesSuccess,
  fetchSurgeryFailure,
  fetchSurgeryRequest,
  fetchSurgerySuccess,
  fetchTodaySurgeriesFailure,
  fetchTodaySurgeriesRequest,
  fetchTodaySurgeriesSuccess,
  searchSurgeriesFailure,
  searchSurgeriesRequest,
  searchSurgeriesSuccess,
  fetchHistoryRequest,
  fetchHistorySuccess,
  fetchHistoryFailure,
  assignFieldRequest,
  startSurgeryRequest,
  surgeryMutationFailure,
  surgeryMutationSuccess,
  updateProgressRequest,
  updateSurgeryRequest,
} from "@/features/surgery/schedule/slice";
import type {
  CancelSurgeryRequest,
  Surgery,
  SurgeryListParams,
  SurgerySearchParams,
  SurgeryStatusHistory,
  AssignFieldRequest,
  UpdateProgressRequest,
  UpdateSurgeryRequest,
} from "@/features/surgery/schedule/types";
import type { PageResponse } from "@/features/surgery/types";
import { getSurgeryErrorMessage } from "@/features/surgery/errorMessage";

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
    yield put(
      fetchSurgeriesFailure(
        getSurgeryErrorMessage(err, "수술 일정 조회에 실패했습니다."),
      ),
    );
  }
}

/** 조건 검색 (SL2-314 기록지 조회 / SL2-334 간호기록 조회) */
function* searchSurgeriesSaga(
  action: PayloadAction<SurgerySearchParams | undefined>,
) {
  try {
    const response: PageResponse<Surgery> = yield call(
      searchSurgeries,
      action.payload,
    );
    yield put(searchSurgeriesSuccess(response));
  } catch (err) {
    yield put(
      searchSurgeriesFailure(
        getSurgeryErrorMessage(err, "수술 검색에 실패했습니다."),
      ),
    );
  }
}

/** 상태변경 이력 조회 (SL2-282) */
function* fetchHistorySaga(
  action: PayloadAction<{ surgeryId: string; type?: string }>,
) {
  try {
    const response: SurgeryStatusHistory[] = yield call(
      getSurgeryHistory,
      action.payload.surgeryId,
      action.payload.type,
    );
    yield put(fetchHistorySuccess(response));
  } catch (err) {
    yield put(
      fetchHistoryFailure(
        getSurgeryErrorMessage(err, "상태 변경 이력 조회에 실패했습니다."),
      ),
    );
  }
}

/**
 * 개별 배정 (SL2-13 / SL2-15 / SL2-43 / SL2-63)
 *
 * <p>성공하면 그 수술을 다시 읽는다 — 수술실 배정은 백엔드가 존재·가용을 검증하므로
 * (SUR036·SUR045) 화면이 짐작해 고치면 거절된 요청도 성공한 것처럼 보인다.
 * 이력도 함께 갱신한다. 배정 변경이 이력에 남기 때문이다.</p>
 */
function* assignFieldSaga(
  action: PayloadAction<{
    surgeryId: string;
    field: "room" | "surgeon" | "anesthesiologist" | "nurse";
    request: AssignFieldRequest;
  }>,
) {
  try {
    const { surgeryId, field, request } = action.payload;
    yield call(assignSurgeryField, surgeryId, field, request);
    yield put(surgeryMutationSuccess());
    yield put(fetchSurgeryRequest(surgeryId));
    yield put(fetchHistoryRequest(surgeryId));
  } catch (err) {
    yield put(
      surgeryMutationFailure(
        getSurgeryErrorMessage(err, "배정 처리에 실패했습니다."),
      ),
    );
  }
}

function* fetchTodaySurgeriesSaga() {
  try {
    const response: Surgery[] = yield call(getTodaySurgeries);
    yield put(fetchTodaySurgeriesSuccess(response));
  } catch (err) {
    yield put(
      fetchTodaySurgeriesFailure(
        getSurgeryErrorMessage(err, "금일 수술현황 조회에 실패했습니다."),
      ),
    );
  }
}

function* fetchSurgerySaga(action: PayloadAction<string>) {
  try {
    const response: Surgery = yield call(getSurgerySchedule, action.payload);
    yield put(fetchSurgerySuccess(response));
  } catch (err) {
    yield put(
      fetchSurgeryFailure(
        getSurgeryErrorMessage(err, "수술 정보 조회에 실패했습니다."),
      ),
    );
  }
}

// ----- 등록/수정 -----

function* updateSurgerySaga(
  action: PayloadAction<{ surgeryId: string; request: UpdateSurgeryRequest }>,
) {
  try {
    const { surgeryId, request } = action.payload;
    yield call(updateSurgerySchedule, surgeryId, request);
    yield put(surgeryMutationSuccess());
    yield put(fetchSurgeriesRequest());
  } catch (err) {
    yield put(
      surgeryMutationFailure(
        getSurgeryErrorMessage(err, "수술 스케줄 수정에 실패했습니다."),
      ),
    );
  }
}

// ----- 배정 -----

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
    // 오더 반려는 order saga 가 처리한다 — 수술 취소가 대기 목록을 건드릴 이유가 없다.
    //   요청 단계가 오더로 옮겨져(2026-08-13) 여기 오는 것은 이미 만들어진 수술뿐이다.
  } catch (err) {
    yield put(
      surgeryMutationFailure(
        getSurgeryErrorMessage(err, "수술 취소에 실패했습니다."),
      ),
    );
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
    yield put(
      surgeryMutationFailure(
        getSurgeryErrorMessage(err, "진행상태 변경에 실패했습니다."),
      ),
    );
  }
}

function* startSurgerySaga(action: PayloadAction<string>) {
  try {
    yield call(startSurgery, action.payload);
    yield put(surgeryMutationSuccess());
    yield put(fetchTodaySurgeriesRequest());
  } catch (err) {
    yield put(
      surgeryMutationFailure(
        getSurgeryErrorMessage(err, "수술 시작 처리에 실패했습니다."),
      ),
    );
  }
}

function* endSurgerySaga(action: PayloadAction<string>) {
  try {
    yield call(endSurgery, action.payload);
    yield put(surgeryMutationSuccess());
    yield put(fetchTodaySurgeriesRequest());
  } catch (err) {
    yield put(
      surgeryMutationFailure(
        getSurgeryErrorMessage(err, "수술 종료 처리에 실패했습니다."),
      ),
    );
  }
}

/** 수술 스케줄 관련 요청을 감시한다(최신 요청만 처리) */
export default function* scheduleSaga() {
  yield takeLatest(fetchSurgeriesRequest.type, fetchSurgeriesSaga);
  yield takeLatest(searchSurgeriesRequest.type, searchSurgeriesSaga);
  yield takeLatest(fetchTodaySurgeriesRequest.type, fetchTodaySurgeriesSaga);
  yield takeLatest(fetchSurgeryRequest.type, fetchSurgerySaga);
  yield takeLatest(fetchHistoryRequest.type, fetchHistorySaga);
  yield takeLatest(assignFieldRequest.type, assignFieldSaga);
  yield takeLatest(updateSurgeryRequest.type, updateSurgerySaga);
  yield takeLatest(cancelSurgeryRequest.type, cancelSurgerySaga);
  yield takeLatest(updateProgressRequest.type, updateProgressSaga);
  yield takeLatest(startSurgeryRequest.type, startSurgerySaga);
  yield takeLatest(endSurgeryRequest.type, endSurgerySaga);
}

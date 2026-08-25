/**
 * 마취기록 saga (SL2-3)
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
  appendVitalSigns,
  createAnesthesiaRecord,
  getAnesthesiaRecord,
  getAnesthesiaRecords,
} from "@/features/surgery/anesthesia/api";
import {
  anesthesiaMutationFailure,
  anesthesiaMutationSuccess,
  appendVitalSignsRequest,
  createAnesthesiaRecordRequest,
  fetchAnesthesiaRecordFailure,
  fetchAnesthesiaRecordRequest,
  fetchAnesthesiaRecordSuccess,
  fetchAnesthesiaRecordsFailure,
  fetchAnesthesiaRecordsRequest,
  fetchAnesthesiaRecordsSuccess,
} from "@/features/surgery/anesthesia/slice";
import type {
  AnesthesiaRecord,
  AppendVitalSignsRequest,
  CreateAnesthesiaRecordRequest,
} from "@/features/surgery/anesthesia/types";
import { getSurgeryErrorMessage } from "@/features/surgery/errorMessage";

/**
 * 마취기록 saga (SL2-3)
 *
 * <p>API 호출은 여기서만 한다(§10.3).</p>
 */

function* fetchAnesthesiaRecordsSaga(action: PayloadAction<string>) {
  try {
    const response: AnesthesiaRecord[] = yield call(
      getAnesthesiaRecords,
      action.payload,
    );
    yield put(fetchAnesthesiaRecordsSuccess(response));
  } catch (err) {
    yield put(
      fetchAnesthesiaRecordsFailure(
        getSurgeryErrorMessage(err, "마취기록 조회에 실패했습니다."),
      ),
    );
  }
}

function* fetchAnesthesiaRecordSaga(action: PayloadAction<string>) {
  try {
    const response: AnesthesiaRecord = yield call(
      getAnesthesiaRecord,
      action.payload,
    );
    yield put(fetchAnesthesiaRecordSuccess(response));
  } catch (err) {
    yield put(
      fetchAnesthesiaRecordFailure(
        getSurgeryErrorMessage(err, "마취기록 조회에 실패했습니다."),
      ),
    );
  }
}

function* createAnesthesiaRecordSaga(
  action: PayloadAction<{
    surgeryId: string;
    request: CreateAnesthesiaRecordRequest;
  }>,
) {
  try {
    const { surgeryId, request } = action.payload;
    yield call(createAnesthesiaRecord, surgeryId, request);
    yield put(anesthesiaMutationSuccess());
    yield put(fetchAnesthesiaRecordsRequest(surgeryId));
  } catch (err) {
    yield put(
      anesthesiaMutationFailure(
        getSurgeryErrorMessage(err, "마취기록 등록에 실패했습니다."),
      ),
    );
  }
}

/**
 * 활력징후 추가 (SL2-18)
 *
 * <p>누적 결과를 화면에 반영하기 위해 성공 후 해당 수술의 기록 목록을 다시 불러온다.</p>
 */
function* appendVitalSignsSaga(
  action: PayloadAction<{
    anesthesiaId: string;
    surgeryId: string;
    request: AppendVitalSignsRequest;
  }>,
) {
  try {
    const { anesthesiaId, surgeryId, request } = action.payload;
    yield call(appendVitalSigns, anesthesiaId, request);
    yield put(anesthesiaMutationSuccess());
    yield put(fetchAnesthesiaRecordsRequest(surgeryId));
  } catch (err) {
    yield put(
      anesthesiaMutationFailure(
        getSurgeryErrorMessage(err, "활력징후 기록에 실패했습니다."),
      ),
    );
  }
}

/** 마취기록 관련 요청을 감시한다(최신 요청만 처리) */
export default function* anesthesiaSaga() {
  yield takeLatest(
    fetchAnesthesiaRecordsRequest.type,
    fetchAnesthesiaRecordsSaga,
  );
  yield takeLatest(
    fetchAnesthesiaRecordRequest.type,
    fetchAnesthesiaRecordSaga,
  );
  yield takeLatest(
    createAnesthesiaRecordRequest.type,
    createAnesthesiaRecordSaga,
  );
  yield takeLatest(appendVitalSignsRequest.type, appendVitalSignsSaga);
}

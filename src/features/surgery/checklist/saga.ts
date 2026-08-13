/**
 * 수술 안전 체크리스트 saga (SL2-35 / SL2-46·47·48 / SL2-49)
 *
 * <p>API 호출은 여기서만 한다(§10.3). 실패 시 백엔드가 준 SUR### 코드를 그대로 넘기고,
 * 문구 변환은 화면이 노출 직전에 한다(§15.2).</p>
 *
 * <p>등록·수정 뒤에 목록을 다시 읽는 이유 — 최종 상태는 서버가 갖고 있다. 특히 등록은
 * 이전 단계 완료 여부를 백엔드가 검증하므로(SUR051), 화면이 짐작해 상태를 고치면
 * 거절된 요청도 성공한 것처럼 보일 수 있다.</p>
 */
import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  createChecklistItem,
  getChecklist,
  updateChecklistItem,
} from "@/features/surgery/checklist/api";
import {
  checklistMutationFailure,
  checklistMutationSuccess,
  createChecklistRequest,
  fetchChecklistFailure,
  fetchChecklistRequest,
  fetchChecklistSuccess,
  updateChecklistRequest,
} from "@/features/surgery/checklist/slice";
import type {
  CreateChecklistRequest,
  SurgeryChecklist,
  UpdateChecklistRequest,
} from "@/features/surgery/checklist/types";
import { getSurgeryErrorMessage } from "@/features/surgery/errorMessage";

function* fetchChecklistSaga(action: PayloadAction<string>) {
  try {
    const response: SurgeryChecklist[] = yield call(
      getChecklist,
      action.payload,
    );
    yield put(fetchChecklistSuccess(response));
  } catch (err) {
    yield put(
      fetchChecklistFailure(
        getSurgeryErrorMessage(err, "체크리스트 조회에 실패했습니다."),
      ),
    );
  }
}

function* createChecklistSaga(
  action: PayloadAction<{ surgeryId: string; request: CreateChecklistRequest }>,
) {
  try {
    const { surgeryId, request } = action.payload;
    yield call(createChecklistItem, surgeryId, request);
    yield put(checklistMutationSuccess());
    yield put(fetchChecklistRequest(surgeryId));
  } catch (err) {
    yield put(
      checklistMutationFailure(
        getSurgeryErrorMessage(err, "체크리스트 작성에 실패했습니다."),
      ),
    );
  }
}

function* updateChecklistSaga(
  action: PayloadAction<{
    surgeryId: string;
    checklistId: string;
    request: UpdateChecklistRequest;
  }>,
) {
  try {
    const { surgeryId, checklistId, request } = action.payload;
    yield call(updateChecklistItem, checklistId, request);
    yield put(checklistMutationSuccess());
    yield put(fetchChecklistRequest(surgeryId));
  } catch (err) {
    yield put(
      checklistMutationFailure(
        getSurgeryErrorMessage(err, "체크리스트 수정에 실패했습니다."),
      ),
    );
  }
}

/** 체크리스트 관련 요청을 감시한다(최신 요청만 처리) */
export default function* checklistSaga() {
  yield takeLatest(fetchChecklistRequest.type, fetchChecklistSaga);
  yield takeLatest(createChecklistRequest.type, createChecklistSaga);
  yield takeLatest(updateChecklistRequest.type, updateChecklistSaga);
}

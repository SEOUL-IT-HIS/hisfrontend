import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createLabOrder } from "@/features/labimaging/labspecimen/api";
import {
  createLabOrderFailure,
  createLabOrderRequest,
  createLabOrderSuccess,
} from "@/features/labimaging/labspecimen/slice";
import type {
  LabOrderCreateRequest,
  LabOrderCreateResponse,
} from "@/features/labimaging/labspecimen/types";

/**
 * labSpecimen saga
 * - API 호출은 여기서만 한다 (가이드 10.3)
 * - 흐름: createLabOrderRequest → createLabOrder → Success / Failure
 * - 실패 시 Error.message(백엔드 message = LAB### 코드 또는 문구)를 그대로 실어 보내고,
 *   사용자 노출용 문구 변환은 컴포넌트에서 resolveLabSpecimenMessage 로 처리한다. (가이드 15.1)
 * - 사용자 노출은 공통 Toast 로 표시하는 것이 원칙이나(가이드 15.3), 공통 Toast 는
 *   리더 관리 공통 컴포넌트라 아직 없어 slice 상태로 결과를 전달한다. (리더 요청 목록 참고)
 */
function* createLabOrderSaga(action: PayloadAction<LabOrderCreateRequest>) {
  try {
    const response: LabOrderCreateResponse = yield call(
      createLabOrder,
      action.payload,
    );
    yield put(createLabOrderSuccess(response));
  } catch (err) {
    // 중복 오더(LAB004) 등 업무 실패도 여기서 실패 메시지로 처리한다. (요청서 1.2)
    const message =
      err instanceof Error ? err.message : "검사 오더 접수에 실패했습니다.";
    yield put(createLabOrderFailure(message));
  }
}

/** 검사 오더 접수 요청을 감시한다 (최신 요청만 처리) */
export default function* labSpecimenSaga() {
  yield takeLatest(createLabOrderRequest.type, createLabOrderSaga);
}

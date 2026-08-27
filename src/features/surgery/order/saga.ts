/**
 * 수술 오더 saga (SL2-36 / SL2-44 / SL2-225 / SL2-226 / SL2-15)
 *
 * <p>API 호출은 여기서만 한다(§10.3). 실패 시 백엔드가 준 SUR### 코드를 그대로 넘기고,
 * 문구 변환은 화면이 노출 직전에 한다(§15.2).</p>
 *
 * <p><b>접수·배정·반려 뒤에 목록을 다시 읽는 이유</b> — 최종 상태는 서버가 갖고 있다.
 * 특히 배정은 수술실 존재·가용 검증(SUR036·SUR045)과 오더 상태 검증(SUR058)을 백엔드가
 * 하므로, 화면이 짐작해 목록을 고치면 거절된 요청도 성공한 것처럼 보인다.</p>
 *
 * <p><b>다시 읽을 때 마지막 검색 조건을 그대로 쓴다</b> — 조건 없이 부르면 배정 대기만
 * 보던 화면이 갑자기 전체 목록(수락·반려 포함)으로 바뀐다. slice 가 마지막 조건을
 * 들고 있고 saga 가 select 로 꺼내 쓴다.</p>
 */
import { call, put, select, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  assignSurgeryOrder,
  createEmergencySurgeryOrder,
  createSurgeryOrder,
  getSurgeryOrders,
  rejectSurgeryOrder,
} from "@/features/surgery/order/api";
import {
  assignOrderRequest,
  createEmergencyOrderRequest,
  createOrderRequest,
  fetchOrdersFailure,
  fetchOrdersRequest,
  fetchOrdersSuccess,
  orderMutationFailure,
  orderMutationSuccess,
  rejectOrderRequest,
  selectOrderLastParams,
} from "@/features/surgery/order/slice";
import type {
  AssignSurgeryOrderRequest,
  CreateSurgeryOrderRequest,
  RejectSurgeryOrderRequest,
  SurgeryOrder,
  SurgeryOrderSearchParams,
} from "@/features/surgery/order/types";
import { getSurgeryErrorMessage } from "@/features/surgery/errorMessage";

function* fetchOrdersSaga(
  action: PayloadAction<SurgeryOrderSearchParams | undefined>,
) {
  try {
    const response: SurgeryOrder[] = yield call(
      getSurgeryOrders,
      action.payload,
    );
    yield put(fetchOrdersSuccess(response));
  } catch (err) {
    yield put(
      fetchOrdersFailure(
        getSurgeryErrorMessage(err, "수술 요청 목록 조회에 실패했습니다."),
      ),
    );
  }
}

function* createOrderSaga(action: PayloadAction<CreateSurgeryOrderRequest>) {
  try {
    yield call(createSurgeryOrder, action.payload);
    yield put(orderMutationSuccess());
    yield put(fetchOrdersRequest(yield select(selectOrderLastParams)));
  } catch (err) {
    yield put(
      orderMutationFailure(
        getSurgeryErrorMessage(err, "수술 요청 접수에 실패했습니다."),
      ),
    );
  }
}

function* createEmergencyOrderSaga(
  action: PayloadAction<CreateSurgeryOrderRequest>,
) {
  try {
    yield call(createEmergencySurgeryOrder, action.payload);
    yield put(orderMutationSuccess());
    yield put(fetchOrdersRequest(yield select(selectOrderLastParams)));
  } catch (err) {
    yield put(
      orderMutationFailure(
        getSurgeryErrorMessage(err, "응급 수술 요청 접수에 실패했습니다."),
      ),
    );
  }
}

function* assignOrderSaga(
  action: PayloadAction<{
    orderId: string;
    request: AssignSurgeryOrderRequest;
  }>,
) {
  try {
    yield call(
      assignSurgeryOrder,
      action.payload.orderId,
      action.payload.request,
    );
    yield put(orderMutationSuccess());
    yield put(fetchOrdersRequest(yield select(selectOrderLastParams)));
  } catch (err) {
    yield put(
      orderMutationFailure(
        getSurgeryErrorMessage(err, "수술실 배정에 실패했습니다."),
      ),
    );
  }
}

function* rejectOrderSaga(
  action: PayloadAction<{
    orderId: string;
    request: RejectSurgeryOrderRequest;
  }>,
) {
  try {
    yield call(
      rejectSurgeryOrder,
      action.payload.orderId,
      action.payload.request,
    );
    yield put(orderMutationSuccess());
    yield put(fetchOrdersRequest(yield select(selectOrderLastParams)));
  } catch (err) {
    yield put(
      orderMutationFailure(
        getSurgeryErrorMessage(err, "수술 요청 반려에 실패했습니다."),
      ),
    );
  }
}

export default function* surgeryOrderSaga() {
  yield takeLatest(fetchOrdersRequest.type, fetchOrdersSaga);
  yield takeLatest(createOrderRequest.type, createOrderSaga);
  yield takeLatest(createEmergencyOrderRequest.type, createEmergencyOrderSaga);
  yield takeLatest(assignOrderRequest.type, assignOrderSaga);
  yield takeLatest(rejectOrderRequest.type, rejectOrderSaga);
}

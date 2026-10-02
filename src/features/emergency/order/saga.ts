import { call, put, takeEvery, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  cancelOrder,
  confirmVerbalOrder,
  createOrder,
  dispatchLab,
  dispatchPharmacy,
  getOrder,
  getOrders,
  searchLabItems,
} from "@/features/emergency/order/api";
import {
  cancelOrderRequest,
  cancelOrderSuccess,
  confirmVerbalRequest,
  confirmVerbalSuccess,
  createOrderFailure,
  createOrderRequest,
  createOrderSuccess,
  dispatchOrderRequest,
  dispatchOrderSuccess,
  fetchOrderRequest,
  fetchOrdersFailure,
  fetchOrdersRequest,
  fetchOrdersSuccess,
  fetchOrderSuccess,
  orderActionFailure,
  searchLabItemsFailure,
  searchLabItemsRequest,
  searchLabItemsSuccess,
} from "@/features/emergency/order/slice";
import type {
  LabItem,
  Order,
  OrderCancelRequest,
  OrderCreateRequest,
  OrderDispatch,
} from "@/features/emergency/order/types";

/**
 * 처방코어가 거절한 이유(예: 영상 오더 미지원, 코드값 오류)가 서버 message 에 들어 있어 그것을 먼저 보여준다.
 * 없으면 axios 기본 문구, 그것도 없으면 fallback.
 */
function errorMessage(err: unknown, fallback: string): string {
  const serverMessage = (err as { response?: { data?: { message?: unknown } } } | null)?.response?.data?.message;
  if (typeof serverMessage === "string" && serverMessage) return serverMessage;
  return err instanceof Error ? err.message : fallback;
}

function* createOrderSaga(action: PayloadAction<OrderCreateRequest>) {
  try {
    const order: Order = yield call(createOrder, action.payload);
    yield put(createOrderSuccess({ receptionId: action.payload.encounterId, order }));
    // 처방코어의 실제 상태(전송 상태 등)를 목록으로 다시 맞춘다
    yield put(fetchOrdersRequest(action.payload.encounterId));
  } catch (err) {
    // 처방 등록에 실패했습니다.
    yield put(createOrderFailure(errorMessage(err, "Failed to register the order.")));
  }
}

function* fetchOrdersSaga(action: PayloadAction<string>) {
  try {
    const orders: Order[] = yield call(getOrders, action.payload);
    yield put(fetchOrdersSuccess({ receptionId: action.payload, orders }));
  } catch (err) {
    // 처방 목록 조회에 실패했습니다.
    yield put(fetchOrdersFailure({ receptionId: action.payload, message: errorMessage(err, "Failed to load orders.") }));
  }
}

function* fetchOrderSaga(action: PayloadAction<{ receptionId: string; orderId: string }>) {
  try {
    const order: Order = yield call(getOrder, action.payload.orderId);
    yield put(fetchOrderSuccess({ receptionId: action.payload.receptionId, order }));
  } catch (err) {
    // 처방 조회에 실패했습니다.
    yield put(orderActionFailure(errorMessage(err, "Failed to load the order.")));
  }
}

function* cancelOrderSaga(action: PayloadAction<{ orderId: string; request: OrderCancelRequest }>) {
  try {
    const order: Order = yield call(cancelOrder, action.payload.orderId, action.payload.request);
    yield put(cancelOrderSuccess(order));
  } catch (err) {
    // 처방 취소에 실패했습니다.
    yield put(orderActionFailure(errorMessage(err, "Failed to cancel the order.")));
  }
}

function* searchLabItemsSaga(action: PayloadAction<string>) {
  try {
    const items: LabItem[] = yield call(searchLabItems, action.payload.trim() || undefined);
    yield put(searchLabItemsSuccess(items));
  } catch (err) {
    // 검사항목 검색에 실패했습니다.
    yield put(searchLabItemsFailure(errorMessage(err, "Failed to search lab tests.")));
  }
}

function* confirmVerbalSaga(action: PayloadAction<{ orderId: string; confirmedBy: string }>) {
  try {
    const order: Order = yield call(confirmVerbalOrder, action.payload.orderId, action.payload.confirmedBy);
    yield put(confirmVerbalSuccess(order));
  } catch (err) {
    // 구두처방 확정에 실패했습니다.
    yield put(orderActionFailure(errorMessage(err, "Failed to confirm the verbal order.")));
  }
}

function* dispatchOrderSaga(
  action: PayloadAction<{ orderId: string; target: "LAB" | "PHARMACY"; receptionId: string }>,
) {
  try {
    const result: OrderDispatch = yield call(
      action.payload.target === "LAB" ? dispatchLab : dispatchPharmacy,
      action.payload.orderId,
    );
    yield put(dispatchOrderSuccess(result));
    // 호출이 받아들여져도 실제 전송 결과는 처방코어 상태로 확인한다
    yield put(fetchOrdersRequest(action.payload.receptionId));
  } catch (err) {
    // 전송에 실패했습니다.
    yield put(orderActionFailure(errorMessage(err, "Failed to send the order.")));
  }
}

export default function* orderSaga() {
  yield takeLatest(createOrderRequest.type, createOrderSaga);
  yield takeLatest(fetchOrdersRequest.type, fetchOrdersSaga);
  yield takeLatest(fetchOrderRequest.type, fetchOrderSaga);
  // 취소·전송은 처방마다 따로 진행될 수 있어서 takeEvery
  yield takeEvery(cancelOrderRequest.type, cancelOrderSaga);
  yield takeEvery(dispatchOrderRequest.type, dispatchOrderSaga);
  yield takeLatest(searchLabItemsRequest.type, searchLabItemsSaga);
  yield takeEvery(confirmVerbalRequest.type, confirmVerbalSaga);
}

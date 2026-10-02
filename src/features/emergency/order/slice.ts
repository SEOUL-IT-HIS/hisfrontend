import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  Order,
  OrderCancelRequest,
  OrderCreateRequest,
  OrderDispatch,
  OrderState,
} from "@/features/emergency/order/types";

/** order(응급 처방 — 검사·약품) slice */
const initialState: OrderState = {
  ordersByReceptionId: {},
  submitting: false,
  submitError: "",
  busyOrderId: "",
  actionError: "",
};

/** 같은 처방ID가 이미 있으면 바꾸고, 없으면 맨 앞에 넣는다(최근 것이 위). */
function upsert(state: OrderState, receptionId: string, order: Order) {
  const list = state.ordersByReceptionId[receptionId] ?? [];
  const index = list.findIndex((o) => o.orderId === order.orderId);
  if (index >= 0) {
    list[index] = { ...list[index], ...order, encounterId: order.encounterId ?? list[index].encounterId };
  } else {
    list.unshift({ ...order, encounterId: order.encounterId ?? receptionId });
  }
  state.ordersByReceptionId[receptionId] = list;
}

/** 어느 접수에 있든 처방ID로 찾아서 고친다(취소·전송 응답 반영). */
function patchOrder(state: OrderState, orderId: string, patch: Partial<Order>) {
  Object.values(state.ordersByReceptionId).forEach((list) => {
    const found = list.find((o) => o.orderId === orderId);
    if (found) Object.assign(found, patch);
  });
}

const orderSlice = createSlice({
  name: "emergency/order",
  initialState,
  reducers: {
    createOrderRequest: {
      reducer(state) {
        state.submitting = true;
        state.submitError = "";
      },
      prepare(request: OrderCreateRequest) {
        return { payload: request };
      },
    },
    createOrderSuccess(state, action: PayloadAction<{ receptionId: string; order: Order }>) {
      state.submitting = false;
      state.submitError = "";
      upsert(state, action.payload.receptionId, action.payload.order);
    },
    createOrderFailure(state, action: PayloadAction<string>) {
      state.submitting = false;
      state.submitError = action.payload;
    },

    /** 처방ID로 한 건 불러온다(다른 화면·사람이 만든 처방, 새로고침 뒤 다시 보기). */
    fetchOrderRequest: {
      reducer(state, action: PayloadAction<{ receptionId: string; orderId: string }>) {
        state.busyOrderId = action.payload.orderId;
        state.actionError = "";
      },
      prepare(receptionId: string, orderId: string) {
        return { payload: { receptionId, orderId } };
      },
    },
    fetchOrderSuccess(state, action: PayloadAction<{ receptionId: string; order: Order }>) {
      state.busyOrderId = "";
      upsert(state, action.payload.receptionId, action.payload.order);
    },

    cancelOrderRequest: {
      reducer(state, action: PayloadAction<{ orderId: string; request: OrderCancelRequest }>) {
        state.busyOrderId = action.payload.orderId;
        state.actionError = "";
      },
      prepare(orderId: string, request: OrderCancelRequest) {
        return { payload: { orderId, request } };
      },
    },
    cancelOrderSuccess(state, action: PayloadAction<Order>) {
      state.busyOrderId = "";
      patchOrder(state, action.payload.orderId, {
        status: action.payload.status,
        cancelReason: action.payload.cancelReason,
        cancelledAt: action.payload.cancelledAt,
      });
    },

    dispatchOrderRequest: {
      reducer(state, action: PayloadAction<{ orderId: string; target: "LAB" | "PHARMACY" }>) {
        state.busyOrderId = action.payload.orderId;
        state.actionError = "";
      },
      prepare(orderId: string, target: "LAB" | "PHARMACY") {
        return { payload: { orderId, target } };
      },
    },
    dispatchOrderSuccess(state, action: PayloadAction<OrderDispatch>) {
      state.busyOrderId = "";
      patchOrder(
        state,
        action.payload.orderId,
        action.payload.target === "LAB"
          ? { labDispatchStatus: action.payload.status }
          : { pharmacyDispatchStatus: action.payload.status },
      );
    },

    /** 조회·취소·전송 실패. 전송이 실패하면 그 처방에 FAILED 를 표시해 다시 시도할 수 있게 한다. */
    orderActionFailure(state, action: PayloadAction<string>) {
      state.busyOrderId = "";
      state.actionError = action.payload;
    },
    clearOrderErrors(state) {
      state.submitError = "";
      state.actionError = "";
    },
  },
});

export const {
  createOrderRequest,
  createOrderSuccess,
  createOrderFailure,
  fetchOrderRequest,
  fetchOrderSuccess,
  cancelOrderRequest,
  cancelOrderSuccess,
  dispatchOrderRequest,
  dispatchOrderSuccess,
  orderActionFailure,
  clearOrderErrors,
} = orderSlice.actions;

export default orderSlice.reducer;

// ----- Selector -----
type OrderRoot = { emergency: { order: OrderState } };

const NO_ORDERS: Order[] = [];

export const selectOrdersByReception = (receptionId: string) => (state: OrderRoot) =>
  state.emergency.order.ordersByReceptionId[receptionId] ?? NO_ORDERS;
export const selectOrderSubmitting = (state: OrderRoot) => state.emergency.order.submitting;
export const selectOrderSubmitError = (state: OrderRoot) => state.emergency.order.submitError;
export const selectOrderBusyId = (state: OrderRoot) => state.emergency.order.busyOrderId;
export const selectOrderActionError = (state: OrderRoot) => state.emergency.order.actionError;

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  MedicationItem,
  Order,
  OrderCancelRequest,
  OrderCreateRequest,
  OrderDispatch,
  OrderState,
} from "@/features/emergency/order/types";

/** order(응급 처방 — 검사·약품) slice */
const initialState: OrderState = {
  ordersByReceptionId: {},
  listStatusByReception: {},
  listError: "",
  medications: [],
  medicationsLoading: false,
  medicationsError: "",
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
    const known = list[index];
    list[index] = {
      ...known,
      ...order,
      encounterId: order.encounterId ?? known.encounterId,
      // 전송 상태 요약은 목록 응답에만 있다 — 단건 응답(null)이 목록에서 받은 값을 지우지 않게 한다
      labSendStatus: order.labSendStatus ?? known.labSendStatus,
      pharmacySendStatus: order.pharmacySendStatus ?? known.pharmacySendStatus,
    };
  } else {
    list.unshift({ ...order, encounterId: order.encounterId ?? receptionId });
  }
  state.ordersByReceptionId[receptionId] = list;
}

/**
 * 서버 목록으로 접수의 처방을 갱신한다. 목록은 가벼워서(items 없음) 이 화면에서 이미 알고 있는
 * 항목·구두 표시·등록 직후 전송 결과는 그대로 둔다. 서버 목록에 아직 없는 이 화면의 처방은 뒤에 남긴다.
 */
function mergeServerOrders(state: OrderState, receptionId: string, serverOrders: Order[]) {
  const local = state.ordersByReceptionId[receptionId] ?? [];
  const merged = serverOrders.map((server) => {
    const known = local.find((o) => o.orderId === server.orderId);
    return {
      ...known,
      ...server,
      encounterId: server.encounterId ?? receptionId,
      items: server.items && server.items.length > 0 ? server.items : (known?.items ?? null),
      orderMethodName: server.orderMethodName ?? known?.orderMethodName ?? null,
      verbalYn: server.verbalYn ?? known?.verbalYn ?? null,
      verbalConfirmedAt: server.verbalConfirmedAt ?? known?.verbalConfirmedAt ?? null,
      verbalConfirmedBy: server.verbalConfirmedBy ?? known?.verbalConfirmedBy ?? null,
      labDispatchStatus: known?.labDispatchStatus ?? null,
      pharmacyDispatchStatus: known?.pharmacyDispatchStatus ?? null,
    };
  });
  const serverIds = new Set(serverOrders.map((o) => o.orderId));
  state.ordersByReceptionId[receptionId] = [...merged, ...local.filter((o) => !serverIds.has(o.orderId))];
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

    /** 접수의 처방 목록을 처방코어에서 불러온다(환자를 고를 때·새로고침). */
    fetchOrdersRequest: {
      reducer(state, action: PayloadAction<string>) {
        state.listStatusByReception[action.payload] = "loading";
        state.listError = "";
      },
      prepare(receptionId: string) {
        return { payload: receptionId };
      },
    },
    fetchOrdersSuccess(state, action: PayloadAction<{ receptionId: string; orders: Order[] }>) {
      state.listStatusByReception[action.payload.receptionId] = "loaded";
      mergeServerOrders(state, action.payload.receptionId, action.payload.orders);
    },
    fetchOrdersFailure(state, action: PayloadAction<{ receptionId: string; message: string }>) {
      state.listStatusByReception[action.payload.receptionId] = "error";
      state.listError = action.payload.message;
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

    /** 목록을 불러온 뒤 항목이 비어 있는 처방의 상세를 채운다(진행 표시·오류 표시 없이 조용히). */
    loadOrderDetailSuccess(state, action: PayloadAction<{ receptionId: string; order: Order }>) {
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

    /** 약품 검색(처방 등록의 약품 선택). name 은 약품명 일부(필수) */
    searchMedicationsRequest: {
      reducer(state) {
        state.medicationsLoading = true;
        state.medicationsError = "";
      },
      prepare(name: string) {
        return { payload: name };
      },
    },
    searchMedicationsSuccess(state, action: PayloadAction<MedicationItem[]>) {
      state.medicationsLoading = false;
      state.medications = action.payload;
    },
    searchMedicationsFailure(state, action: PayloadAction<string>) {
      state.medicationsLoading = false;
      state.medications = [];
      state.medicationsError = action.payload;
    },
    /** 검색어를 지웠을 때 이전 결과와 오류를 비운다 */
    clearMedicationSearch(state) {
      state.medicationsLoading = false;
      state.medications = [];
      state.medicationsError = "";
    },

    /** 구두처방 사후 확정 */
    confirmVerbalRequest: {
      reducer(state, action: PayloadAction<{ orderId: string; confirmedBy: string }>) {
        state.busyOrderId = action.payload.orderId;
        state.actionError = "";
      },
      prepare(orderId: string, confirmedBy: string) {
        return { payload: { orderId, confirmedBy } };
      },
    },
    confirmVerbalSuccess(state, action: PayloadAction<Order>) {
      state.busyOrderId = "";
      patchOrder(state, action.payload.orderId, {
        verbalYn: "Y",
        verbalConfirmedAt: action.payload.verbalConfirmedAt ?? null,
        verbalConfirmedBy: action.payload.verbalConfirmedBy ?? null,
        ...(action.payload.status ? { status: action.payload.status } : {}),
      });
    },

    dispatchOrderRequest: {
      reducer(state, action: PayloadAction<{ orderId: string; target: "LAB" | "PHARMACY"; receptionId: string }>) {
        state.busyOrderId = action.payload.orderId;
        state.actionError = "";
      },
      prepare(orderId: string, target: "LAB" | "PHARMACY", receptionId: string) {
        return { payload: { orderId, target, receptionId } };
      },
    },
    dispatchOrderSuccess(state, action: PayloadAction<OrderDispatch>) {
      state.busyOrderId = "";
      // 전송 호출이 받아들여져도 처방코어가 검사·약제로 실제로 넘겼는지는 별개라(FAILED 로 남을 수 있다),
      // 백엔드가 호출 직후 다시 읽은 실제 상태(SENT/FAILED/PENDING)만 반영한다. REQUESTED(못 읽음)는 목록 새로고침에 맡긴다.
      if (["SENT", "FAILED", "PENDING"].includes(action.payload.status)) {
        patchOrder(
          state,
          action.payload.orderId,
          action.payload.target === "LAB"
            ? { labDispatchStatus: action.payload.status, labSendStatus: action.payload.status }
            : { pharmacyDispatchStatus: action.payload.status, pharmacySendStatus: action.payload.status },
        );
      }
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
  fetchOrdersRequest,
  fetchOrdersSuccess,
  fetchOrdersFailure,
  fetchOrderRequest,
  fetchOrderSuccess,
  loadOrderDetailSuccess,
  cancelOrderRequest,
  cancelOrderSuccess,
  searchMedicationsRequest,
  searchMedicationsSuccess,
  searchMedicationsFailure,
  clearMedicationSearch,
  confirmVerbalRequest,
  confirmVerbalSuccess,
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
export const selectOrderListStatus = (receptionId: string) => (state: OrderRoot) =>
  state.emergency.order.listStatusByReception[receptionId];
export const selectMedications = (state: OrderRoot) => state.emergency.order.medications;
export const selectMedicationsLoading = (state: OrderRoot) => state.emergency.order.medicationsLoading;
export const selectMedicationsError = (state: OrderRoot) => state.emergency.order.medicationsError;
export const selectOrderListError = (state: OrderRoot) => state.emergency.order.listError;
export const selectOrderSubmitting = (state: OrderRoot) => state.emergency.order.submitting;
export const selectOrderSubmitError = (state: OrderRoot) => state.emergency.order.submitError;
export const selectOrderBusyId = (state: OrderRoot) => state.emergency.order.busyOrderId;
export const selectOrderActionError = (state: OrderRoot) => state.emergency.order.actionError;

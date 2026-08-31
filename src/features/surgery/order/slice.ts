import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  AssignSurgeryOrderRequest,
  CreateSurgeryOrderRequest,
  RejectSurgeryOrderRequest,
  SurgeryOrder,
  SurgeryOrderSearchParams,
  SurgeryOrderState,
} from "@/features/surgery/order/types";

/**
 * 수술 오더 slice (SL2-36 진료요청 / SL2-44 응급요청 / SL2-225 목록 / SL2-226 반려 / SL2-15 배정)
 *
 * <p>상태만 관리하고 API 호출은 saga 가 담당한다(§10.3).
 * createSlice name = "surgery/order" (§10.2 서비스 prefix 유지)</p>
 *
 * <p><b>schedule slice 에서 분리한 이유</b> — 요청과 수술은 다른 것이다.
 * 예전에는 요청도 수술 행이라 한 slice 가 둘을 다뤘는데, 그래서 "배정 대기 목록"과
 * "수술 목록"이 같은 배열을 상태만 달리 담고 있었다. 이제 오더는 오더대로 관리한다.</p>
 *
 * <p><b>배정·반려가 Mutation 액션을 같이 쓰는 이유</b> — 둘 다 끝나면 목록을 다시 읽는다.
 * 화면에서 구분할 일이 없어 성공/실패 액션을 나눌 실익이 없다. 체크리스트 slice 와 같은 방식이다.</p>
 */
const initialState: SurgeryOrderState = {
  orders: [],
  loading: false,
  saving: false,
  error: "",
};

const surgeryOrderSlice = createSlice({
  name: "surgery/order",
  initialState,
  reducers: {
    // ----- 목록 조회 (SL2-225) -----
    fetchOrdersRequest: {
      reducer(state, action: PayloadAction<SurgeryOrderSearchParams | undefined>) {
        state.loading = true;
        state.error = "";
        // 변경 후 다시 읽을 때 같은 조건을 쓰기 위해 기억해 둔다
        state.lastParams = action.payload;
      },
      prepare(params?: SurgeryOrderSearchParams) {
        return { payload: params };
      },
    },
    fetchOrdersSuccess(state, action: PayloadAction<SurgeryOrder[]>) {
      state.loading = false;
      state.orders = action.payload;
    },
    fetchOrdersFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // ----- 접수 (SL2-36 진료 / SL2-44 응급) -----
    createOrderRequest: {
      reducer(state) {
        state.saving = true;
        state.error = "";
      },
      prepare(request: CreateSurgeryOrderRequest) {
        return { payload: request };
      },
    },
    createEmergencyOrderRequest: {
      reducer(state) {
        state.saving = true;
        state.error = "";
      },
      prepare(request: CreateSurgeryOrderRequest) {
        return { payload: request };
      },
    },

    // ----- 배정 → 수락 (SL2-15) -----
    assignOrderRequest: {
      reducer(state) {
        state.saving = true;
        state.error = "";
      },
      prepare(orderId: string, request: AssignSurgeryOrderRequest) {
        return { payload: { orderId, request } };
      },
    },

    // ----- 반려 (SL2-226) -----
    rejectOrderRequest: {
      reducer(state) {
        state.saving = true;
        state.error = "";
      },
      prepare(orderId: string, request: RejectSurgeryOrderRequest) {
        return { payload: { orderId, request } };
      },
    },

    /** 접수·배정·반려 공통 결과. 성공하면 saga 가 목록을 다시 읽는다 */
    orderMutationSuccess(state) {
      state.saving = false;
    },
    orderMutationFailure(state, action: PayloadAction<string>) {
      state.saving = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchOrdersRequest,
  fetchOrdersSuccess,
  fetchOrdersFailure,
  createOrderRequest,
  createEmergencyOrderRequest,
  assignOrderRequest,
  rejectOrderRequest,
  orderMutationSuccess,
  orderMutationFailure,
} = surgeryOrderSlice.actions;

/** 오더 목록 */
export const selectSurgeryOrders = (state: {
  surgery: { order: SurgeryOrderState };
}) => state.surgery.order.orders;

export const selectOrderLoading = (state: {
  surgery: { order: SurgeryOrderState };
}) => state.surgery.order.loading;

export const selectOrderSaving = (state: {
  surgery: { order: SurgeryOrderState };
}) => state.surgery.order.saving;

export const selectOrderError = (state: {
  surgery: { order: SurgeryOrderState };
}) => state.surgery.order.error;

/** 마지막 조회 조건 — saga 가 변경 후 목록을 다시 읽을 때 쓴다 */
export const selectOrderLastParams = (state: {
  surgery: { order: SurgeryOrderState };
}) => state.surgery.order.lastParams;

export default surgeryOrderSlice.reducer;

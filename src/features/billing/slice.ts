import { combineReducers } from "@reduxjs/toolkit";
import billingMasterReducer from "@/features/billing/billingMaster/slice";
import billingDetailReducer from "@/features/billing/searchBillingDetail/slice";
import billingPaymentReducer from "@/features/billing/payment/slice";
import billingHistoryReducer from "@/features/billing/history/slice";

/**
 * billing 도메인 결합 reducer
 * - 하위 기능 slice 들을 하나로 묶어 rootReducer 에 billing 키로 등록한다.
 * - 각 slice 의 selector 가 state.billing.<기능> 을 참조하므로 아래 키 이름을
 *   반드시 그대로 맞춘다. (billingMaster/slice.ts, payment/slice.ts 등 selector 참고)
 */
const billingReducer = combineReducers({
  billingMaster: billingMasterReducer,
  billingDetail: billingDetailReducer,
  billingPayment: billingPaymentReducer,
  billingHistory: billingHistoryReducer,
});

export default billingReducer;

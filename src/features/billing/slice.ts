import { combineReducers } from "@reduxjs/toolkit";
import billingDetailReducer from "@/features/billing/searchBillingDetail/slice";
import billingMasterReducer from "@/features/billing/billingMaster/slice";
import billingPaymentReducer from "@/features/billing/payment/slice";
import billingHistoryReducer from "@/features/billing/history/slice";

const billingReducer = combineReducers({
  detail: billingDetailReducer,
  master: billingMasterReducer,
  payment: billingPaymentReducer,
  history: billingHistoryReducer,
});

export default billingReducer;

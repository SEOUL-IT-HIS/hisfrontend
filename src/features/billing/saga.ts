import { all, fork } from "redux-saga/effects";
import billingDetailSaga from "@/features/billing/searchBillingDetail/saga";
import billingMasterSaga from "@/features/billing/billingMaster/saga";
import billingPaymentSaga from "@/features/billing/payment/saga";
import billingHistorySaga from "@/features/billing/history/saga";

export default function* billingSaga() {
  yield all([
    fork(billingDetailSaga),
    fork(billingMasterSaga),
    fork(billingPaymentSaga),
    fork(billingHistorySaga),
  ]);
}

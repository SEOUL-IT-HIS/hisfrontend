import { all, fork } from "redux-saga/effects";
import billingMasterSaga from "@/features/billing/billingMaster/saga";
import billingDetailSaga from "@/features/billing/searchBillingDetail/saga";
import billingPaymentSaga from "@/features/billing/payment/saga";
import billingHistorySaga from "@/features/billing/history/saga";

/**
 * billing 도메인 결합 saga
 * - 하위 기능 saga 들을 fork 로 묶어 rootSaga 에서 한 번에 실행한다.
 */
export default function* billingSaga() {
  yield all([
    fork(billingMasterSaga),
    fork(billingDetailSaga),
    fork(billingPaymentSaga),
    fork(billingHistorySaga),
  ]);
}

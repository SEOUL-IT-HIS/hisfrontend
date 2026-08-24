import { all, fork } from "redux-saga/effects";
import anesthesiaSaga from "@/features/surgery/anesthesia/saga";
import checklistSaga from "@/features/surgery/checklist/saga";
import orderSaga from "@/features/surgery/order/saga";
import consentSaga from "@/features/surgery/consent/saga";
import operativeRecordSaga from "@/features/surgery/operativeRecord/saga";
import roomSaga from "@/features/surgery/room/saga";
import scheduleSaga from "@/features/surgery/schedule/saga";

/**
 * surgery 도메인 결합 saga
 *
 * <p>하위 기능 saga 들을 fork 로 묶어 rootSaga 에서 한 번에 실행한다.</p>
 */
export default function* surgerySaga() {
  yield all([
    fork(roomSaga),
    fork(scheduleSaga),
    fork(orderSaga),
    fork(anesthesiaSaga),
    fork(operativeRecordSaga),
    fork(consentSaga),
    fork(checklistSaga),
  ]);
}

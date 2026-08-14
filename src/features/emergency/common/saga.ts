import { all, fork } from "redux-saga/effects";
import emsInfoSaga from "@/features/emergency/emsInfo/saga";
import ktasSaga from "@/features/emergency/ktas/saga";
import vitalsSaga from "@/features/emergency/vitals/saga";
import isolationSaga from "@/features/emergency/isolation/saga";
import riskScreeningSaga from "@/features/emergency/riskScreening/saga";
import commonCodeSaga from "@/features/emergency/commonCode/saga";

/**
 * emergency 도메인 결합 saga
 * - 하위 기능 saga 들을 fork 로 묶어 rootSaga 에서 한 번에 실행한다.
 */
export default function* emergencySaga() {
  yield all([
    fork(emsInfoSaga),
    fork(ktasSaga),
    fork(vitalsSaga),
    fork(isolationSaga),
    fork(riskScreeningSaga),
    fork(commonCodeSaga),
  ]);
}

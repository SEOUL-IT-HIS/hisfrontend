import { all, fork } from "redux-saga/effects";
import labOrderSaga from "@/features/labimaging/laborder/saga";
import imageOrderSaga from "@/features/labimaging/imagingorder/saga";
import labScheduleSaga from "@/features/labimaging/labschedule/saga";
import imageScheduleSaga from "@/features/labimaging/imagingschedule/saga";
import labSpecimenSaga from "@/features/labimaging/labspecimen/saga";
import consentSaga from "@/features/labimaging/imagingacquisition/saga";

/**
 * labImaging 도메인 결합 saga
 * - 하위 기능 saga 들을 fork 로 묶어 rootSaga 에서 한 번에 실행한다.
 */
export default function* labImagingSaga() {
  yield all([
    fork(labOrderSaga),
    fork(imageOrderSaga),
    fork(labScheduleSaga),
    fork(imageScheduleSaga),
    fork(labSpecimenSaga),
    fork(consentSaga),
  ]);
}

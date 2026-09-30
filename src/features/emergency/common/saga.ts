import { all, fork } from "redux-saga/effects";
import emsInfoSaga from "@/features/emergency/triage/emsInfo/saga";
import ktasSaga from "@/features/emergency/triage/ktas/saga";
import vitalsSaga from "@/features/emergency/triage/vitals/saga";
import isolationSaga from "@/features/emergency/triage/isolation/saga";
import riskScreeningSaga from "@/features/emergency/triage/riskScreening/saga";
import commonCodeSaga from "@/features/emergency/commonCode/saga";
import receptionListSaga from "@/features/emergency/receptionList/saga";
import bedSaga from "@/features/emergency/resource/bed/saga";
import clinicalNoteSaga from "@/features/emergency/care/clinicalNote/saga";
import consentSaga from "@/features/emergency/care/consent/saga";
import treatmentSaga from "@/features/emergency/care/treatment/saga";
import medicationSaga from "@/features/emergency/care/medication/saga";
import cprSaga from "@/features/emergency/care/cpr/saga";
import dispositionSaga from "@/features/emergency/disposition/saga";
import dispositionFollowUpSaga from "@/features/emergency/disposition/followup/saga";
import congestionSaga from "@/features/emergency/resource/congestion/saga";
import dashboardSaga from "@/features/emergency/monitor/saga";

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
    fork(receptionListSaga),
    fork(bedSaga),
    fork(clinicalNoteSaga),
    fork(consentSaga),
    fork(treatmentSaga),
    fork(medicationSaga),
    fork(cprSaga),
    fork(dispositionSaga),
    fork(dispositionFollowUpSaga),
    fork(congestionSaga),
    fork(dashboardSaga),
  ]);
}

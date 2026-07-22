import {all, fork} from "redux-saga/effects";

// ----- 서비스별 saga (담당자 saga 준비되면 import 후 fork 등록) -----
// import patientSaga from "@/features/patient/saga";
// import receptionSaga from "@/features/reception/saga";
// import billingSaga from "@/features/billing/saga";
// import outpatientSaga from "@/features/outpatient/saga";
// import emergencySaga from "@/features/emergency/saga";
// import inpatientSaga from "@/features/inpatient/saga";
// import labImagingSaga from "@/features/labimaging/saga";
// import pharmacySaga from "@/features/pharmacy/saga";
// import surgerySaga from "@/features/surgery/saga";
// import adminSaga from "@/features/admin/saga";
// import commonCodeSaga from "@/features/commoncode/saga";
import menuSaga from "@/features/system/saga/menuSaga";

/**
 * RootSaga (프론트 리더 관리 영역)
 * - 담당 영역(auth/admin/commoncode/system) 초기화 — 재구현 후 fork 등록
 */
export default function* rootSaga() {
  yield all([
      fork(menuSaga),
    // fork(commonCodeSaga),
    // fork(adminSaga),
    // fork(patientSaga),
    // fork(receptionSaga),
    // fork(billingSaga),
    // fork(outpatientSaga),
    // fork(emergencySaga),
    // fork(inpatientSaga),
    // fork(labImagingSaga),
    // fork(pharmacySaga),
    // fork(surgerySaga),
  ]);
}

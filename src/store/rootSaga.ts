import { all, fork } from "redux-saga/effects";
import adminSaga from "@/features/admin/saga";
import systemSaga from "@/features/system/saga";

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

/**
 * RootSaga (프론트 리더 관리 영역)
 * - 각 팀원은 features/{service}/saga.ts 만 작성한다.
 * - 이 파일 등록은 프론트 리더가 담당한다. (가이드 5.2)
 * - API 호출은 각 서비스 saga 안에서만 한다. (가이드 10.3)
 */
export default function* rootSaga() {
  yield all([
    // 공통
    fork(systemSaga),

    // 관리자 (ADM)
    fork(adminSaga),

    // 환자 (PAT)
    // fork(patientSaga),

    // 접수 (RCP)
    // fork(receptionSaga),

    // 수납/청구 (BIL)
    // fork(billingSaga),

    // 외래 (OPD)
    // fork(outpatientSaga),

    // 응급 (EMG)
    // fork(emergencySaga),

    // 입원 (IPT)
    // fork(inpatientSaga),

    // 검사/영상 (LAB)
    // fork(labImagingSaga),

    // 약국 (PHM)
    // fork(pharmacySaga),

    // 수술 (SUR)
    // fork(surgerySaga),
  ]);
}

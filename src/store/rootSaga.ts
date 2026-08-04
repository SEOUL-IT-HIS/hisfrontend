import { all, fork } from "redux-saga/effects";

// ----- 서비스별 saga (담당자 saga 준비되면 import 후 fork 등록) -----
// import patientSaga from "@/features/patient/saga";
// import receptionSaga from "@/features/reception/saga";
// import billingSaga from "@/features/billing/saga";
import outpatientSaga from "@/features/outpatient/common/saga";
import emergencySaga from "@/features/emergency/common/saga";
import inpatientSaga from "@/features/inpatient/saga";
import labImagingSaga from "@/features/labimaging/common/saga";
// import pharmacySaga from "@/features/pharmacy/saga";
// import surgerySaga from "@/features/surgery/saga";
// import adminSaga from "@/features/admin/saga";
import watchCommonCodeItemSaga from "@/features/commonCode/saga/commonCodeItemSaga";
import watchCommonCodeGroupSaga from "@/features/commonCode/saga/commonCodeGroupSaga";
import watchEmpSaga from "@/features/emp/saga/empSaga";
import watchMenuSaga from "@/features/system/saga/menuSaga";
import watchPatientSaga from "@/features/patient/saga/patientSaga";
import billingDetailSaga from "@/features/billing/searchBillingDetail/saga";
import billingMasterSaga from "@/features/billing/billingMaster/saga";

/**
 * RootSaga (프론트 리더 관리 영역)
 * - 담당 영역(auth/admin/commonCode/system) 초기화 — 재구현 후 fork 등록
 */
export default function* rootSaga() {
  yield all([
      fork(watchMenuSaga),
      fork(watchEmpSaga),
      fork(watchCommonCodeGroupSaga),
      fork(watchCommonCodeItemSaga),
      fork(labImagingSaga),
    // fork(adminSaga),
    fork(watchPatientSaga),
    // fork(receptionSaga),
    fork(billingDetailSaga),
    fork(billingMasterSaga),
     fork(outpatientSaga),
    fork(emergencySaga),
    fork(inpatientSaga),
    // fork(pharmacySaga),
    // fork(surgerySaga),
  ]);
}

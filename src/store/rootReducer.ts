import { combineReducers } from "@reduxjs/toolkit";
import adminReducer from "@/features/admin/slice";
import commonCodeReducer from "@/features/commoncode/slice";
import systemReducer from "@/features/system/slice";

// ----- 서비스별 reducer (담당자 slice 준비되면 import 후 아래에 등록) -----
// import patientReducer from "@/features/patient/slice";
// import receptionReducer from "@/features/reception/slice";
// import billingReducer from "@/features/billing/slice";
// import outpatientReducer from "@/features/outpatient/slice";
// import emergencyReducer from "@/features/emergency/slice";
// import inpatientReducer from "@/features/inpatient/slice";
// import labImagingReducer from "@/features/labimaging/slice";
// import pharmacyReducer from "@/features/pharmacy/slice";
// import surgeryReducer from "@/features/surgery/slice";

/**
 * RootReducer (프론트 리더 관리 영역)
 * - 각 팀원은 features/{service}/slice.ts 만 작성한다.
 * - 이 파일 등록은 프론트 리더가 담당한다. (가이드 5.1)
 *
 * 서비스 키 (가이드 3.2)
 * - patient | reception | billing | outpatient | emergency
 * - inpatient | labImaging | pharmacy | surgery | admin
 * - system 은 공통(메뉴 등) 영역
 */
const rootReducer = combineReducers({
  // 공통
  system: systemReducer,
  commoncode: commonCodeReducer,

  // 관리자 (ADM)
  admin: adminReducer,

  // 환자 (PAT)
  // patient: patientReducer,

  // 접수 (RCP)
  // reception: receptionReducer,

  // 수납/청구 (BIL)
  // billing: billingReducer,

  // 외래 (OPD)
  // outpatient: outpatientReducer,

  // 응급 (EMG)
  // emergency: emergencyReducer,

  // 입원 (IPT)
  // inpatient: inpatientReducer,

  // 검사/영상 (LAB)
  // labImaging: labImagingReducer,

  // 약국 (PHM)
  // pharmacy: pharmacyReducer,

  // 수술 (SUR)
  // surgery: surgeryReducer,
});

export default rootReducer;

import { combineReducers } from "@reduxjs/toolkit";

// ----- 서비스별 reducer (담당자 slice 준비되면 import 후 아래에 등록) -----
// import patientReducer from "@/features/patient/slice";
// import receptionReducer from "@/features/reception/slice";
// import billingReducer from "@/features/billing/slice";
// import outpatientReducer from "@/features/outpatient/slice";
// import emergencyReducer from "@/features/emergency/slice";
import inpatientReducer from "@/features/inpatient/slice";
// import labImagingReducer from "@/features/labimaging/slice";
// import pharmacyReducer from "@/features/pharmacy/slice";
// import surgeryReducer from "@/features/surgery/slice";
// import adminReducer from "@/features/admin/slice";
// import commonCodeReducer from "@/features/commoncode/slice";
// import systemReducer from "@/features/system/slice";

/**
 * RootReducer (프론트 리더 관리 영역)
 * - 담당 영역(auth/admin/commoncode/system) 초기화 — 재구현 후 등록
 * - combineReducers 는 최소 1개 reducer 필요 → placeholder 유지
 */
const placeholderReducer = (state: Record<string, never> = {}) => state;

const rootReducer = combineReducers({
  _bootstrap: placeholderReducer,

  // 공통
  // system: systemReducer,
  // commoncode: commonCodeReducer,

  // 관리자 (ADM)
  // admin: adminReducer,

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
  inpatient: inpatientReducer,

  // 검사/영상 (LAB)
  // labImaging: labImagingReducer,

  // 약국 (PHM)
  // pharmacy: pharmacyReducer,

  // 수술 (SUR)
  // surgery: surgeryReducer,
});

export default rootReducer;

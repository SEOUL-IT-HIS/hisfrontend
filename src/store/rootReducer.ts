import { combineReducers, type UnknownAction } from "@reduxjs/toolkit";
import { fetchAuthLogoutSuccess } from "@/features/auth/slice/authSlice";

// ----- 서비스별 reducer (담당자 slice 준비되면 import 후 아래에 등록) -----
// import patientReducer from "@/features/patient/slice";
// import receptionReducer from "@/features/reception/slice";
// import billingReducer from "@/features/billing/slice";
 import outpatientReducer from "@/features/outpatient/common/slice";
import emergencyReducer from "@/features/emergency/common/slice";
import inpatientReducer from "@/features/inpatient/slice";
import labImagingReducer from "@/features/labimaging/common/slice";
// import pharmacyReducer from "@/features/pharmacy/slice";
import surgeryReducer from "@/features/surgery/slice";
// import adminReducer from "@/features/admin/slice";
import commonCodeItemReducer from "@/features/commonCode/slice/commonCodeItemSlice";
import commonCodeGroupReducer from "@/features/commonCode/slice/commonCodeGroupSlice";
import authReducer from "@/features/auth/slice/authSlice";
import empReducer from "@/features/emp/slice/empSlice";
import systemReducer from "@/features/system/slice/menuSlice";
import patientReducer from "@/features/patient/slice/patientSlice";
import billingDetailReducer from "@/features/billing/searchBillingDetail/slice";
import billingMasterReducer from "@/features/billing/billingMaster/slice";

/**
 * RootReducer (프론트 리더 관리 영역)
 * - 담당 영역(auth/admin/commonCode/system) 초기화 — 재구현 후 등록
 * - combineReducers 는 최소 1개 reducer 필요 → placeholder 유지
 * - 로그아웃 성공(fetchAuthLogoutSuccess) 시 전체 상태를 초기값으로 리셋한다 (로그아웃 후 잔여 상태 방지)
 */
const placeholderReducer = (state: Record<string, never> = {}) => state;

const appReducer = combineReducers({
  _bootstrap: placeholderReducer,

  // 공통
  system: systemReducer,
  auth: authReducer,
  commonCodeGroup: commonCodeGroupReducer,
  commonCodeItem: commonCodeItemReducer,
  emp: empReducer,

  // 관리자 (ADM)
  // admin: adminReducer,

  // 환자 (PAT)
  patient: patientReducer,

  // 접수 (RCP)
  // reception: receptionReducer,

  // 수납/청구 (BIL)
  billingDetail: billingDetailReducer,
  billingMaster: billingMasterReducer,

  // 외래 (OPD)
  outpatient: outpatientReducer,

  // 응급 (EMG)
  emergency: emergencyReducer,

  // 입원 (IPT)
  inpatient: inpatientReducer,

  // 검사/영상 (LAB)
  labImaging: labImagingReducer,

  // 약국 (PHM)
  // pharmacy: pharmacyReducer,

  // 수술 (SUR)
  surgery: surgeryReducer,
});

function rootReducer(
  state: ReturnType<typeof appReducer> | undefined,
  action: UnknownAction,
) {
  if (action.type === fetchAuthLogoutSuccess.type) {
    return appReducer(undefined, action);
  }
  return appReducer(state, action);
}

export default rootReducer;

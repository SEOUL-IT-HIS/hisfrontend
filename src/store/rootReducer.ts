import { combineReducers } from "@reduxjs/toolkit";
import adminReducer from "@/features/admin/slice";
import systemReducer from "@/features/system/slice";

/**
 * RootReducer (프론트 리더 관리 영역)
 * - 서비스별 slice.reducer 를 여기에 등록한다.
 * - 예: patient: patientReducer, admin: adminReducer
 */
const rootReducer = combineReducers({
  admin: adminReducer,
  system: systemReducer,
});

export default rootReducer;

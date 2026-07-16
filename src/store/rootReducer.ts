import { combineReducers } from "@reduxjs/toolkit";
import systemReducer from "@/features/system/slice";

/**
 * RootReducer (프론트 리더 관리 영역)
 * - 서비스별 slice.reducer 를 여기에 등록한다.
 * - 예: patient: patientReducer, admin: adminReducer
 */
const rootReducer = combineReducers({
  system: systemReducer,
});

export default rootReducer;

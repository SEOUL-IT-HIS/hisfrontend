import { combineReducers } from "@reduxjs/toolkit";
import bedManagementReducer from "./bedmanagement/slice";

/**
 * inpatient(입원) 서비스 reducer
 * - 기능(Story) 단위 하위 slice 를 combine 한다.
 * - 하위 기능(입퇴원관리/간호기록관리/투약관리/물품관리/처방이행관리) 추가 시 아래에 이어서 등록
 */
const inpatientReducer = combineReducers({
  bedmanagement: bedManagementReducer,
});

export default inpatientReducer;

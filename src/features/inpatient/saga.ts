import { all, fork } from "redux-saga/effects";
import bedManagementSaga from "./bedmanagement/bedassignment/saga";
import bedSaga from "./bedmanagement/bedstatus/saga";
import admissionSaga from "./admissiondischarge/saga";
import bedReservationSaga from "./bedmanagement/bedreservation/saga";

/**
 * inpatient(입원) 서비스 saga
 * - 하위 기능(입퇴원관리/간호기록관리/투약관리/물품관리/처방이행관리) 추가 시 fork 이어서 등록
 */
export default function* inpatientSaga() {
  yield all([fork(bedManagementSaga), fork(bedSaga),fork(bedReservationSaga), fork(admissionSaga)]);
}

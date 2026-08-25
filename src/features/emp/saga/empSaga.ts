/**
 * [직원 Saga]
 *
 * Request 액션을 가로채 API 호출 후 Success/Failure 를 put
 *
 * takeLatest: 같은 요청이 연속이면 마지막만 처리
 */
import { call, put, takeLatest } from "redux-saga/effects";
import {
  fetchEmpApi,
  fetchEmpDetailApi,
  fetchEmpRegisterApi,
  fetchEmpUpdateApi,
} from "../api/empApi";
import {
  fetchEmpDetailFailure,
  fetchEmpDetailRequest,
  fetchEmpDetailSuccess,
  fetchEmpFailure,
  fetchEmpRegisterFailure,
  fetchEmpRegisterRequest,
  fetchEmpRegisterSuccess,
  fetchEmpRequest,
  fetchEmpSuccess,
  fetchEmpUpdateFailure,
  fetchEmpUpdateRequest,
  fetchEmpUpdateSuccess,
} from "../slice/empSlice";
import type { Emp } from "../types/empTypes";

/** 목록 조회 */
function* fetchEmpSaga() {
  try {
    const emps: Emp[] = yield call(fetchEmpApi);
    yield put(fetchEmpSuccess(emps));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "직원 목록 조회에 실패했습니다.";
    yield put(fetchEmpFailure(message));
  }
}

/** 상세 조회 — action.payload = empId */
function* fetchEmpDetailSaga(
  action: ReturnType<typeof fetchEmpDetailRequest>,
) {
  try {
    const emp: Emp = yield call(fetchEmpDetailApi, action.payload);
    yield put(fetchEmpDetailSuccess(emp));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "직원 상세 조회에 실패했습니다.";
    yield put(fetchEmpDetailFailure(message));
  }
}

/** 등록 — action.payload = EmpRegisterRequest */
function* fetchEmpRegisterSaga(
  action: ReturnType<typeof fetchEmpRegisterRequest>,
) {
  try {
    const newEmp: Emp = yield call(fetchEmpRegisterApi, action.payload);
    yield put(fetchEmpRegisterSuccess(newEmp));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "직원 등록에 실패했습니다.";
    yield put(fetchEmpRegisterFailure(message));
  }
}

/** 수정 — action.payload = EmpUpdateRequest */
function* fetchEmpUpdateSaga(action: ReturnType<typeof fetchEmpUpdateRequest>) {
  try {
    const updatedEmp: Emp = yield call(fetchEmpUpdateApi, action.payload);
    yield put(fetchEmpUpdateSuccess(updatedEmp));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "직원 수정에 실패했습니다.";
    yield put(fetchEmpUpdateFailure(message));
  }
}

/** rootSaga 에서 fork 되는 엔트리 */
export default function* empSaga() {
  yield takeLatest(fetchEmpRequest.type, fetchEmpSaga);
  yield takeLatest(fetchEmpDetailRequest.type, fetchEmpDetailSaga);
  yield takeLatest(fetchEmpRegisterRequest.type, fetchEmpRegisterSaga);
  yield takeLatest(fetchEmpUpdateRequest.type, fetchEmpUpdateSaga);
}

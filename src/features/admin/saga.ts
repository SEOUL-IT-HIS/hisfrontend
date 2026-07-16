import { call, put, takeLatest } from "redux-saga/effects";
import {
  createEmployee,
  getEmployees,
  updateEmployee,
} from "@/features/admin/api";
import { resolveAdmMessage } from "@/features/admin/messages";
import {
  createEmployeeFailure,
  createEmployeeRequest,
  createEmployeeSuccess,
  fetchEmployeesFailure,
  fetchEmployeesRequest,
  fetchEmployeesSuccess,
  updateEmployeeFailure,
  updateEmployeeRequest,
  updateEmployeeSuccess,
} from "@/features/admin/slice";
import type {
  CreateEmployeeRequest,
  Employee,
  UpdateEmployeeRequest,
} from "@/features/admin/types";
import type { PayloadAction } from "@reduxjs/toolkit";

/**
 * admin saga
 * - API 호출은 여기서만 한다 (가이드 10.3)
 * - 흐름: Request → api → Success / Failure
 */
function* fetchEmployeesSaga() {
  try {
    const list: Employee[] = yield call(getEmployees);
    yield put(fetchEmployeesSuccess(list));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "직원 목록 조회에 실패했습니다.";
    yield put(fetchEmployeesFailure(resolveAdmMessage(message)));
  }
}

function* createEmployeeSaga(action: PayloadAction<CreateEmployeeRequest>) {
  try {
    const created: Employee = yield call(createEmployee, action.payload);
    yield put(createEmployeeSuccess(created));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "직원 등록에 실패했습니다.";
    yield put(createEmployeeFailure(resolveAdmMessage(message)));
  }
}

function* updateEmployeeSaga(
  action: PayloadAction<{ empId: number; payload: UpdateEmployeeRequest }>,
) {
  try {
    const updated: Employee = yield call(
      updateEmployee,
      action.payload.empId,
      action.payload.payload,
    );
    yield put(updateEmployeeSuccess(updated));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "직원 수정에 실패했습니다.";
    yield put(updateEmployeeFailure(resolveAdmMessage(message)));
  }
}

export default function* adminSaga() {
  yield takeLatest(fetchEmployeesRequest.type, fetchEmployeesSaga);
  yield takeLatest(createEmployeeRequest.type, createEmployeeSaga);
  yield takeLatest(updateEmployeeRequest.type, updateEmployeeSaga);
}

import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import { acknowledgeLosAlert, getDashboard } from "@/features/emergency/monitor/api";
import {
  acknowledgeLosAlertFailure,
  acknowledgeLosAlertRequest,
  acknowledgeLosAlertSuccess,
  fetchDashboardFailure,
  fetchDashboardRequest,
  fetchDashboardSuccess,
} from "@/features/emergency/monitor/slice";
import type { Dashboard, LosAlertAcknowledgeRequest } from "@/features/emergency/monitor/types";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function* fetchDashboardSaga() {
  try {
    const dashboard: Dashboard = yield call(getDashboard);
    yield put(fetchDashboardSuccess(dashboard));
  } catch (err) {
    // 현황판 조회에 실패했습니다.
    yield put(fetchDashboardFailure(errorMessage(err, "Failed to load the ER dashboard.")));
  }
}

function* acknowledgeLosAlertSaga(action: PayloadAction<{ alertId: string; request: LosAlertAcknowledgeRequest }>) {
  try {
    yield call(acknowledgeLosAlert, action.payload.alertId, action.payload.request);
    yield put(acknowledgeLosAlertSuccess());
    // 확인한 알림은 미확인 목록/건수에서 빠지므로 현황판을 다시 불러온다.
    yield put(fetchDashboardRequest());
  } catch (err) {
    // 장기체류 알림 확인 처리에 실패했습니다.
    yield put(acknowledgeLosAlertFailure(errorMessage(err, "Failed to acknowledge the long-stay alert.")));
  }
}

export default function* dashboardSaga() {
  yield takeLatest(fetchDashboardRequest.type, fetchDashboardSaga);
  yield takeLatest(acknowledgeLosAlertRequest.type, acknowledgeLosAlertSaga);
}

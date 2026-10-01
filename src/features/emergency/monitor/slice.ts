import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Dashboard, DashboardState, LosAlertAcknowledgeRequest } from "@/features/emergency/monitor/types";

/** dashboard(종합 현황판) slice — UC-MON-01 */
const initialState: DashboardState = {
  data: null,
  loading: false,
  error: "",
  fetchedAt: null,
  acknowledging: false,
  acknowledgeError: "",
};

const dashboardSlice = createSlice({
  name: "emergency/dashboard",
  initialState,
  reducers: {
    fetchDashboardRequest(state) {
      state.loading = true;
      state.error = "";
    },
    fetchDashboardSuccess: {
      reducer(state, action: PayloadAction<{ dashboard: Dashboard; fetchedAt: string }>) {
        state.loading = false;
        state.error = "";
        state.data = action.payload.dashboard;
        state.fetchedAt = action.payload.fetchedAt;
      },
      prepare(dashboard: Dashboard) {
        return { payload: { dashboard, fetchedAt: new Date().toISOString() } };
      },
    },
    // 자동 갱신 중 실패해도 직전 값은 유지한다.
    fetchDashboardFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    acknowledgeLosAlertRequest: {
      reducer(state) {
        state.acknowledging = true;
        state.acknowledgeError = "";
      },
      prepare(alertId: string, request: LosAlertAcknowledgeRequest) {
        return { payload: { alertId, request } };
      },
    },
    acknowledgeLosAlertSuccess(state) {
      state.acknowledging = false;
      state.acknowledgeError = "";
    },
    acknowledgeLosAlertFailure(state, action: PayloadAction<string>) {
      state.acknowledging = false;
      state.acknowledgeError = action.payload;
    },
  },
});

export const {
  fetchDashboardRequest,
  fetchDashboardSuccess,
  fetchDashboardFailure,
  acknowledgeLosAlertRequest,
  acknowledgeLosAlertSuccess,
  acknowledgeLosAlertFailure,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;

// ----- Selector (가이드 10.4) -----
type DashboardRoot = { emergency: { dashboard: DashboardState } };

export const selectDashboard = (state: DashboardRoot) => state.emergency.dashboard.data;
export const selectDashboardLoading = (state: DashboardRoot) => state.emergency.dashboard.loading;
export const selectDashboardError = (state: DashboardRoot) => state.emergency.dashboard.error;
export const selectDashboardFetchedAt = (state: DashboardRoot) => state.emergency.dashboard.fetchedAt;
export const selectLosAlertAcknowledging = (state: DashboardRoot) => state.emergency.dashboard.acknowledging;
export const selectLosAlertAcknowledgeError = (state: DashboardRoot) => state.emergency.dashboard.acknowledgeError;

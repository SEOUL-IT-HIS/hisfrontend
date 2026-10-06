import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/emergency/types";
import type { Dashboard, LosAlert, LosAlertAcknowledgeRequest } from "@/features/emergency/monitor/types";

const DASHBOARD_PATH = "/api/emergency/monitor/dashboard";

/** 응급실 종합 현황판 지표를 조회한다. UC-MON-01 */
export async function getDashboard(): Promise<Dashboard> {
  const { data } = await apiClient.get<ApiResponse<Dashboard>>(DASHBOARD_PATH);
  return data.data;
}

/** 장기체류 알림을 확인 처리한다. UC-MON-02 */
export async function acknowledgeLosAlert(alertId: string, request: LosAlertAcknowledgeRequest): Promise<LosAlert> {
  const { data } = await apiClient.patch<ApiResponse<LosAlert>>(
    `/api/emergency/monitor/long-stay-alerts/${alertId}/acknowledge`,
    request,
  );
  return data.data;
}

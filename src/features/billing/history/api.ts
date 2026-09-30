import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/billing/types";
import type {
  BillingHistoryItem,
  SearchPatient,
  SearchPatientResult
} from "@/features/billing/history/types";

const BILLING_HISTORY_PATH = "/api/billing/history";

/** 환자 이름으로 수납이력 검색 */
export async function searchBillingHistoryApi(
  condition: SearchPatient,
): Promise<SearchPatientResult[]> {
  const { data } = await apiClient.get<ApiResponse<SearchPatientResult[]>>(BILLING_HISTORY_PATH, {
    params: condition,
  });
  return data.data ?? [];
}

/** 환자별 수납이력 전체 조회 */
export async function fetchBillingHistoryByPatientApi(patientId: string): Promise<BillingHistoryItem[]> {
  const { data } = await apiClient.get<ApiResponse<BillingHistoryItem[]>>(
    `${BILLING_HISTORY_PATH}/patient/${patientId}`,
  );
  return data.data ?? [];
}

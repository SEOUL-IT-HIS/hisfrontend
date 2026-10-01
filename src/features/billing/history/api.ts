import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/billing/types";
import type {
  BillingHistoryDetail,
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

/** 수납이력 상세보기 - 결제 완료 billing 한 건의 결제 정보 + 진료 항목 */
export async function fetchBillingHistoryDetailApi(billingId: string): Promise<BillingHistoryDetail> {
  const { data } = await apiClient.get<ApiResponse<BillingHistoryDetail>>(
    `${BILLING_HISTORY_PATH}/${billingId}`,
  );
  return data.data;
}

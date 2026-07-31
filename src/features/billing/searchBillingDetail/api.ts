import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/admin/types";
import type {
  BillingDetail,
  BillingDetailSearchCondition,
} from "@/features/billing/searchBillingDetail/types";

const BILLING_DETAIL_PATH = "/api/billing/detail";

/** 진료비 상세조회 검색 */
export async function searchBillingDetails(
  condition: BillingDetailSearchCondition,
): Promise<BillingDetail[]> {
  const { data } = await apiClient.get<ApiResponse<BillingDetail[]>>(BILLING_DETAIL_PATH, {
    params: condition,
  });
  return data.data ?? [];
}

/** 진료비 상세조회 단건(환자 상세정보) 조회 */
export async function fetchBillingDetail(billingDetailId: string): Promise<BillingDetail> {
  const { data } = await apiClient.get<ApiResponse<BillingDetail>>(
    `${BILLING_DETAIL_PATH}/${billingDetailId}`,
  );
  return data.data;
}

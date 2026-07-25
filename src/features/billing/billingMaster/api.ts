import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/admin/types";
import type {
  BillingMaster,
  BillingMasterCreateRequest,
} from "@/features/billing/billingMaster/types";

const BILLING_MASTER_PATH = "/api/billing/master";

/** 수납 기준정보 목록 조회 */
export async function getBillingMasters(): Promise<BillingMaster[]> {
  const { data } = await apiClient.get<ApiResponse<BillingMaster[]>>(BILLING_MASTER_PATH);
  return data.data ?? [];
}

/** 수납 기준정보 상세 조회 */
export async function getBillingMasterDetail(billingMasterId: string): Promise<BillingMaster> {
  const { data } = await apiClient.get<ApiResponse<BillingMaster>>(
    `${BILLING_MASTER_PATH}/${billingMasterId}`,
  );
  return data.data;
}

/** 수납 기준정보 등록 */
export async function createBillingMaster(
  payload: BillingMasterCreateRequest,
): Promise<BillingMaster> {
  const { data } = await apiClient.post<ApiResponse<BillingMaster>>(BILLING_MASTER_PATH, payload);
  return data.data;
}

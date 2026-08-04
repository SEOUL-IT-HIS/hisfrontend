import api from "@/lib/axios";
import type { ApiResponse } from "@/features/billing/types";
import type {
  BillingMaster,
  BillingMasterCreateRequest,
} from "@/features/billing/billingMaster/types";

const BILLING_MASTER_PATH = "/api/billing/master";

// 전체조회
export const fetchBillingMasterAPI = () => {
  return api.get<ApiResponse<BillingMaster[]>>(BILLING_MASTER_PATH);
};

// 단일 조회
export const fetchBillingMasterDetailAPI = (billingMasterId: string) => {
  return api.get<ApiResponse<BillingMaster>>(`${BILLING_MASTER_PATH}/${billingMasterId}`);
};

// 등록
export const createBillingMasterAPI = (payload: BillingMasterCreateRequest) => {
  return api.post<ApiResponse<BillingMaster>>(BILLING_MASTER_PATH, payload);
};

import api from "@/lib/axios";
import type { ApiResponse } from "@/features/billing/types";
import type {
  BillingMaster,
  BillingMasterCreateRequest,
  BillingMasterUpdateRequest,
} from "@/features/billing/billingMaster/types";

const BILLING_MASTER_PATH = "/api/billing/statistics";

// List
export const fetchBillingMasterAPI = () => {
  return api.get<ApiResponse<BillingMaster[]>>(BILLING_MASTER_PATH);
};

// Detail
export const fetchBillingMasterDetailAPI = (billingMasterId: string) => {
  return api.get<ApiResponse<BillingMaster>>(`${BILLING_MASTER_PATH}/${billingMasterId}`);
};

// Create
export const createBillingMasterAPI = (payload: BillingMasterCreateRequest) => {
  return api.post<ApiResponse<BillingMaster>>(BILLING_MASTER_PATH, payload);
};

// Update
export const updateBillingMasterAPI = (
  billingMasterId: string,
  payload: BillingMasterUpdateRequest,
) => {
  return api.put<ApiResponse<BillingMaster>>(`${BILLING_MASTER_PATH}/${billingMasterId}`, payload);
};

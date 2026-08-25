import api from "@/lib/axios";
import type { BillingMasterCreateRequest } from "./types";

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

// 목록
export const fetchBillingMasterAPI = () => api.get("/api/billing/statistics");

// 상세
export const fetchBillingMasterDetailAPI = (billingMasterId: string) =>
    api.get(`/api/billing/statistics/${billingMasterId}`);

// 등록
export const registerBillingMasterAPI = (data: BillingMasterCreateRequest) =>
    api.post("/api/billing/statistics", data);


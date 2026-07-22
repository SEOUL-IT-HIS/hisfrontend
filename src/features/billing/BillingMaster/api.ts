import api from "@/lib/axios";

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

// 목록
export const fetchBillingMasterAPI = () => api.get("/billing/master");

// 상세
export const fetchBillingMasterDetailAPI = (empno: string) =>
    api.get(`/billing/master/${billingMasterId}`);

// 등록
export const registerBillingMasterAPI = (data: Emp) =>
    api.post("/billing/master", data);


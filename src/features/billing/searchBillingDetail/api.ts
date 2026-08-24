import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/billing/types";
import type {
  BillingDetail,
  BillingDetailAdmission,
  BillingDetailVisit,
  SearchPatient,
  SearchPatientResult
} from "@/features/billing/searchBillingDetail/types";

const BILLING_DETAIL_PATH = "/api/billing/detail";

/** 환자 리스트 검색 */
export async function searchPatientApi(
  condition: SearchPatient,
): Promise<SearchPatientResult[]> {
  const { data } = await apiClient.get<ApiResponse<SearchPatientResult[]>>(BILLING_DETAIL_PATH, {
    params: condition,
  });
  return data.data ?? [];
}

/** 진료비 상세조회 단건(환자 상세정보) 조회 */
export async function fetchBillingDetailApi(billingDetailId: string): Promise<BillingDetail> {
  const { data } = await apiClient.get<ApiResponse<BillingDetail>>(
    `${BILLING_DETAIL_PATH}/${billingDetailId}`,
  );
  return data.data;
}

export async function admissionBillingDetailApi(admissionId: string): Promise<BillingDetailAdmission> {
  const { data } = await apiClient.get<ApiResponse<BillingDetailAdmission>>(
    `${BILLING_DETAIL_PATH}/preview/admission/{admissionId}`,
  );
  return data.data;
}

export async function visitBillingDetailApi(visitId: string): Promise<BillingDetailVisit> {
  const { data } = await apiClient.get<ApiResponse<BillingDetailVisit>>(
    `${BILLING_DETAIL_PATH}/preview/visit/{visitId}`,
  );
  return data.data;
}

/** 수납 상태를 READY -> SUCCESS 로 변경 */
export async function updateBillingStatusApi(billingId: string): Promise<void> {
  await apiClient.patch(`${BILLING_DETAIL_PATH}/${billingId}/billing-status`);
}
import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/emergency/types";
import type { TreatmentCreateRequest, TreatmentRecord } from "@/features/emergency/care/treatment/types";

const TREATMENT_PATH = "/api/emergency/care/treatments";

/** 접수 건의 처치 기록을 조회한다(시행 시각 순). */
export async function getTreatments(receptionId: string): Promise<TreatmentRecord[]> {
  const { data } = await apiClient.get<ApiResponse<TreatmentRecord[]>>(TREATMENT_PATH, { params: { receptionId } });
  return data.data;
}

/** 처치 기록을 등록한다. orderId(GR2 처방 ID) 필수. */
export async function createTreatment(request: TreatmentCreateRequest): Promise<TreatmentRecord> {
  const { data } = await apiClient.post<ApiResponse<TreatmentRecord>>(TREATMENT_PATH, request);
  return data.data;
}

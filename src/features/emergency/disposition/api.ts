import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/emergency/types";
import type { Disposition, DispositionCreateRequest } from "@/features/emergency/disposition/types";

const DISPOSITIONS_PATH = "/api/emergency/dispositions";

/** 응급 퇴실 결정을 등록한다. UC-DISP-01 */
export async function createDisposition(request: DispositionCreateRequest): Promise<Disposition> {
  const { data } = await apiClient.post<ApiResponse<Disposition>>(DISPOSITIONS_PATH, request);
  return data.data;
}

/** 접수 건의 퇴실 결정 이력을 조회한다(최신이 첫 번째). UC-DISP-01 */
export async function getDispositions(receptionId: string): Promise<Disposition[]> {
  const { data } = await apiClient.get<ApiResponse<Disposition[]>>(DISPOSITIONS_PATH, {
    params: { receptionId },
  });
  return data.data;
}

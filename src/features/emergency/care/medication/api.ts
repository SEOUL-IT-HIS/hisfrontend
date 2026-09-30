import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/emergency/types";
import type {
  MedicationAdministration,
  MedicationCreateRequest,
} from "@/features/emergency/care/medication/types";

const MAR_PATH = "/api/emergency/care/medication-administrations";

/** 접수 건의 약물 투여 기록을 조회한다(투여 시각 순). */
export async function getMedicationAdministrations(receptionId: string): Promise<MedicationAdministration[]> {
  const { data } = await apiClient.get<ApiResponse<MedicationAdministration[]>>(MAR_PATH, { params: { receptionId } });
  return data.data;
}

/** 약물 투여 기록을 등록한다. orderId(GR2 처방 ID) 필수. */
export async function createMedicationAdministration(
  request: MedicationCreateRequest,
): Promise<MedicationAdministration> {
  const { data } = await apiClient.post<ApiResponse<MedicationAdministration>>(MAR_PATH, request);
  return data.data;
}

import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/emergency/types";
import type {
  ReceptionIntake,
  ReceptionIntakeCreateRequest,
} from "@/features/emergency/receptionIntake/types";

const RECEPTION_INTAKES_PATH = "/api/emergency/care/reception-intakes";

/** 응급접수 정보를 등록/갱신한다(receptionId 기준 upsert). UC-CARE-01 보조 */
export async function createReceptionIntake(
  request: ReceptionIntakeCreateRequest,
): Promise<ReceptionIntake> {
  const { data } = await apiClient.post<ApiResponse<ReceptionIntake>>(RECEPTION_INTAKES_PATH, request);
  return data.data;
}

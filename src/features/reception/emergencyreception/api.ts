import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/reception/types";
import type {
  EmergencyActiveCheckResult,
  EmergencyReceptionDetail,
  EmergencyReceptionListItem,
  EmergencyReceptionRequest,
} from "./types";

const EMERGENCY_RECEPTION_PATH = "/api/reception/emergency";

/**
 * 응급접수 목록 조회 (응급접수홈 전용)
 * - reception-service ReceptionController.getEmergencyReceptionList()
 * - 당일 접수된 응급 건(취소 포함), 접수일시 최신순. 진료과명/의사명/환자명은 서버가 채워준다.
 */
export async function getEmergencyReceptionList(): Promise<
  EmergencyReceptionListItem[]
> {
  const { data } = await apiClient.get<ApiResponse<EmergencyReceptionListItem[]>>(
    EMERGENCY_RECEPTION_PATH,
  );
  return data.data;
}

/**
 * 응급접수 등록
 * - reception-service ReceptionController.registerEmergencyReception()
 * - 다른 접수 API와 달리 ApiResponse({code,message,data}) 로 감싸지 않고
 *   EmergencyReceptionResponsedto 를 그대로 응답 바디에 내려준다.
 */
export async function registerEmergencyReception(
  request: EmergencyReceptionRequest,
): Promise<EmergencyReceptionDetail> {
  const { data } = await apiClient.post<EmergencyReceptionDetail>(
    EMERGENCY_RECEPTION_PATH,
    request,
  );
  return data;
}

/**
 * 응급접수 중복(활성) 확인 — 등록 직전 사전 확인용.
 * - reception-service ReceptionController.checkActiveEmergencyReception()
 * - 응급 서비스 장애/타임아웃이어도 reception-service가 fail-open으로 200을 내려준다.
 *   (이 호출 자체가 실패하는 경우는 reception-service 쪽 문제이며, 호출부에서 fail-open 처리한다)
 */
export async function checkActiveEmergencyReception(
  patientId: string,
): Promise<EmergencyActiveCheckResult> {
  const { data } = await apiClient.get<ApiResponse<EmergencyActiveCheckResult>>(
    `${EMERGENCY_RECEPTION_PATH}/active-check`,
    { params: { patientId } },
  );
  return data.data;
}

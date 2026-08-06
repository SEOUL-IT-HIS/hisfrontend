/**
 * 수술 스케줄링 API (SL2-2)
 *
 * <p>백엔드 SurgeryController(@RequestMapping("/api/surgery/schedule")) 와 1:1 대응.
 * 상태 변경(취소·진행상태·시작·종료)은 일부 필드만 바꾸므로 PATCH 를 쓴다(§21.8).</p>
 */
import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/surgery/types";
import type {
  AssignSurgeryRequest,
  CancelSurgeryRequest,
  RegisterSurgeryRequest,
  Surgery,
  SurgeryListParams,
  UpdateProgressRequest,
  UpdateSurgeryRequest,
} from "@/features/surgery/schedule/types";

const SCHEDULE_PATH = "/api/surgery/schedule";

/** 배정 대기 중인 진료 요청 목록을 조회한다(status_cd = 00 요청접수). */
export async function getSurgeryRequests(): Promise<Surgery[]> {
  const { data } = await apiClient.get<ApiResponse<Surgery[]>>(
    `${SCHEDULE_PATH}/requests`,
  );
  return data.data;
}

/**
 * 수술을 배정한다(요청접수 → 예약).
 *
 * <p>수술실·마취의·간호사만 바꾸므로 PATCH 를 쓴다(§21.8).</p>
 */
export async function assignSurgery(
  surgeryId: string,
  request: AssignSurgeryRequest,
): Promise<Surgery> {
  const { data } = await apiClient.patch<ApiResponse<Surgery>>(
    `${SCHEDULE_PATH}/${surgeryId}/assign`,
    request,
  );
  return data.data;
}

/** 수술 일정 목록을 조회한다. date 미지정 시 전체. (SL2-25) */
export async function getSurgerySchedules(
  params?: SurgeryListParams,
): Promise<Surgery[]> {
  const { data } = await apiClient.get<ApiResponse<Surgery[]>>(SCHEDULE_PATH, {
    params,
  });
  return data.data;
}

/** 금일 수술 현황을 조회한다. (SL2-40 모니터링) */
export async function getTodaySurgeries(): Promise<Surgery[]> {
  const { data } = await apiClient.get<ApiResponse<Surgery[]>>(
    `${SCHEDULE_PATH}/today`,
  );
  return data.data;
}

export async function getSurgerySchedule(surgeryId: string): Promise<Surgery> {
  const { data } = await apiClient.get<ApiResponse<Surgery>>(
    `${SCHEDULE_PATH}/${surgeryId}`,
  );
  return data.data;
}

/**
 * 수술 요청을 등록한다. (SL2-36)
 *
 * <p><b>수술 화면에서는 호출하지 않는다.</b> 일반 수술 요청은 진료가 보낸다(§21.1).
 * 이 함수와 아래 응급 등록이 남아 있는 이유는 계약을 기록해두기 위해서다 —
 * 두 엔드포인트 모두 patientId·surgeonId·surgeryDt 를 받고, statusCd·emergencyYn 은
 * 보내도 무시한다(서버가 요청접수 00 으로 강제).</p>
 *
 * <p>진료·응급이 각자 features 에서 직접 호출하게 되면 이쪽은 지워도 된다.</p>
 */
export async function registerSurgerySchedule(
  request: RegisterSurgeryRequest,
): Promise<Surgery> {
  const { data } = await apiClient.post<ApiResponse<Surgery>>(
    SCHEDULE_PATH,
    request,
  );
  return data.data;
}

/** 응급 수술 요청을 등록한다. (SL2-44) — 응급실이 보낸다. 위 주석 참고. */
export async function registerEmergencySurgery(
  request: RegisterSurgeryRequest,
): Promise<Surgery> {
  const { data } = await apiClient.post<ApiResponse<Surgery>>(
    `${SCHEDULE_PATH}/emergency`,
    request,
  );
  return data.data;
}

/** 수술 스케줄을 수정한다. (SL2-37) */
export async function updateSurgerySchedule(
  surgeryId: string,
  request: UpdateSurgeryRequest,
): Promise<Surgery> {
  const { data } = await apiClient.put<ApiResponse<Surgery>>(
    `${SCHEDULE_PATH}/${surgeryId}`,
    request,
  );
  return data.data;
}

/**
 * 수술 스케줄을 취소한다. (SL2-33)
 *
 * <p>행을 지우지 않고 취소 상태로 전이시킨다(§21.6). 사유 코드는 선택이다.</p>
 */
export async function cancelSurgerySchedule(
  surgeryId: string,
  request?: CancelSurgeryRequest,
): Promise<Surgery> {
  const { data } = await apiClient.patch<ApiResponse<Surgery>>(
    `${SCHEDULE_PATH}/${surgeryId}/cancel`,
    request,
  );
  return data.data;
}

/** 수술 진행상태를 변경한다. (SL2-39) */
export async function updateSurgeryProgress(
  surgeryId: string,
  request: UpdateProgressRequest,
): Promise<Surgery> {
  const { data } = await apiClient.patch<ApiResponse<Surgery>>(
    `${SCHEDULE_PATH}/${surgeryId}/progress`,
    request,
  );
  return data.data;
}

/** 수술을 시작 처리한다(실제 시작일시 기록). */
export async function startSurgery(surgeryId: string): Promise<Surgery> {
  const { data } = await apiClient.patch<ApiResponse<Surgery>>(
    `${SCHEDULE_PATH}/${surgeryId}/start`,
  );
  return data.data;
}

/** 수술을 종료 처리한다(실제 종료일시 기록). */
export async function endSurgery(surgeryId: string): Promise<Surgery> {
  const { data } = await apiClient.patch<ApiResponse<Surgery>>(
    `${SCHEDULE_PATH}/${surgeryId}/end`,
  );
  return data.data;
}

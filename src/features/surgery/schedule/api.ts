/**
 * 수술 스케줄링 API (SL2-2)
 *
 * <p>백엔드 SurgeryController(@RequestMapping("/api/v1/surgery/schedule")) 와 1:1 대응.
 * 상태 변경(취소·진행상태·시작·종료)은 일부 필드만 바꾸므로 PATCH 를 쓴다(§21.8).</p>
 */
import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/surgery/types";
import type {
  CancelSurgeryRequest,
  RegisterSurgeryRequest,
  Surgery,
  SurgeryListParams,
  UpdateProgressRequest,
  UpdateSurgeryRequest,
} from "@/features/surgery/schedule/types";

const SCHEDULE_PATH = "/api/v1/surgery/schedule";

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

/** 수술 스케줄을 등록한다. (SL2-36) */
export async function registerSurgerySchedule(
  request: RegisterSurgeryRequest,
): Promise<Surgery> {
  const { data } = await apiClient.post<ApiResponse<Surgery>>(
    SCHEDULE_PATH,
    request,
  );
  return data.data;
}

/** 긴급 수술을 등록한다. (SL2-44) */
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

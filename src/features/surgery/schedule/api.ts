/**
 * 수술 스케줄링 API (SL2-2)
 *
 * <p>백엔드 SurgeryController(@RequestMapping("/api/surgery/schedule")) 와 1:1 대응.
 * 상태 변경(취소·진행상태·시작·종료)은 일부 필드만 바꾸므로 PATCH 를 쓴다(§21.8).</p>
 */
import apiClient from "@/lib/axios";
import type { ApiResponse, PageResponse } from "@/features/surgery/types";
import type {
  CancelSurgeryRequest,
  Surgery,
  SurgeryListParams,
  SurgerySearchParams,
  SurgeryStatusHistory,
  UpdateProgressRequest,
} from "@/features/surgery/schedule/types";

const SCHEDULE_PATH = "/api/surgery/schedule";

/** 수술 일정 목록을 조회한다. date 미지정 시 전체. (SL2-25) */
export async function getSurgerySchedules(
  params?: SurgeryListParams,
): Promise<Surgery[]> {
  const { data } = await apiClient.get<ApiResponse<Surgery[]>>(SCHEDULE_PATH, {
    params,
  });
  return data.data ?? [];
}

/**
 * 조건으로 수술을 검색한다. (SL2-314 기록지 조회 / SL2-334 간호기록 조회)
 *
 * <p>{@code /assignments} 를 쓴다 — 목록 조회({@code SCHEDULE_PATH})는 날짜 하나만 받고
 * 페이징도 없어서 검색 화면에 맞지 않는다.</p>
 */
export async function searchSurgeries(
  params?: SurgerySearchParams,
): Promise<PageResponse<Surgery>> {
  const { data } = await apiClient.get<ApiResponse<PageResponse<Surgery>>>(
    `${SCHEDULE_PATH}/assignments`,
    { params },
  );
  return data.data;
}

/**
 * 상태변경 이력을 조회한다. (SL2-282)
 *
 * @param type STATUS(큰 상태 전이) / PROGRESS(당일 진행단계). 비우면 전체
 */
export async function getSurgeryHistory(
  surgeryId: string,
  type?: string,
): Promise<SurgeryStatusHistory[]> {
  const { data } = await apiClient.get<ApiResponse<SurgeryStatusHistory[]>>(
    `${SCHEDULE_PATH}/${surgeryId}/history`,
    { params: type ? { type } : undefined },
  );
  return data.data ?? [];
}

/** 금일 수술 현황을 조회한다. (SL2-40 모니터링) */
export async function getTodaySurgeries(): Promise<Surgery[]> {
  const { data } = await apiClient.get<ApiResponse<Surgery[]>>(
    `${SCHEDULE_PATH}/today`,
  );
  return data.data ?? [];
}

export async function getSurgerySchedule(surgeryId: string): Promise<Surgery> {
  const { data } = await apiClient.get<ApiResponse<Surgery>>(
    `${SCHEDULE_PATH}/${surgeryId}`,
  );
  return data.data;
}

// 수술 요청 등록(SL2-36)·응급 등록(SL2-44)·배정 대기 목록(SL2-225)·일괄 배정(SL2-15)은
// 오더로 옮겼다 — features/surgery/order/api.ts.
//   수술은 오더가 수락(배정)될 때 만들어지므로, 수술을 직접 만드는 함수는 여기 없다.

/**
 * 수술 스케줄을 취소한다. (SL2-33)
 *
 * <p>행을 지우지 않고 취소 상태로 전이시킨다(§21.6). <b>사유 코드는 필수</b>다
 * (SL2-178) — 비워 보내면 백엔드 @NotBlank 가 400 으로 막는다.</p>
 */
export async function cancelSurgerySchedule(
  surgeryId: string,
  request: CancelSurgeryRequest,
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

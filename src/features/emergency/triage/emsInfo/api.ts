import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/emergency/types";
import type { EmsReferral } from "@/features/emergency/triage/emsInfo/types";

/** EMS 정보 조회 API 경로 (백엔드 TriageController @GetMapping("/ems-info")) — UC-TRI-01 / Jira UD2-8 */
const EMS_INFO_PATH = "/api/emergency/triage/ems-info";

/**
 * 119 이송정보를 조회한다.
 * - receptionNo 를 넘기면 해당 접수건만, 생략하면 전체 목록을 반환한다. (백엔드 findByReceptionNo/findAll)
 * - 실패(HTTP 4xx/5xx)는 공통 axios interceptor 가 reject → saga 에서 처리.
 */
export async function getEmsInfo(receptionNo?: string): Promise<EmsReferral[]> {
  const { data } = await apiClient.get<ApiResponse<EmsReferral[]>>(EMS_INFO_PATH, {
    params: receptionNo ? { receptionNo } : undefined,
  });
  return data.data;
}

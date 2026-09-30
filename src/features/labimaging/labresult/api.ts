import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/labimaging/types";
import type {
  LabResultConfirmRequest,
  LabResultCreateRequest,
  LabResultItem,
  LabResultSummary,
  LabResultUpdateRequest,
} from "@/features/labimaging/labresult/types";

/**
 * 검사결과 API 경로
 * (백엔드 LabResultController @RequestMapping("/api/lab-imaging/lab-results"))
 */
const LAB_RESULT_PATH = "/api/lab-imaging/lab-results";

/**
 * 접수 1건의 검사항목을 결과와 함께 조회한다.
 * GET /api/lab-imaging/lab-results/receptions/{receptionNo}
 *
 * ⚠ 결과가 아니라 "검사항목"이 행 단위다. 아직 결과가 없는 항목도 함께 온다(result 없음).
 *   등록 화면이 필요로 하는 건 바로 그 미등록 항목이라, 결과 기준으로 뽑으면 화면이 성립하지 않는다.
 *
 * ⚠ 접수 상세(GET /lab-orders/receptions/{receptionNo})로는 대체할 수 없다.
 *   그쪽은 labItemCodes(코드 문자열)만 주고 항목ID를 주지 않아 등록 대상을 지목할 수 없다.
 */
export async function fetchLabResultItems(
  receptionNo: string,
): Promise<LabResultItem[]> {
  const { data } = await apiClient.get<ApiResponse<LabResultItem[]>>(
    `${LAB_RESULT_PATH}/receptions/${encodeURIComponent(receptionNo)}`,
  );
  return data.data;
}

/**
 * 검사 결과를 등록한다.
 * POST /api/lab-imaging/lab-results → 201 + LabResultSummaryDto
 *
 * ⚠ 검사항목 1건에 결과 1건이다. 이미 등록된 항목이면 400 + LAB036.
 * ⚠ 비정상 여부(abnormalYn)와 결과상태는 요청에 담지 않는다. 서버가 정한다.
 */
export async function createLabResult(
  request: LabResultCreateRequest,
): Promise<LabResultSummary> {
  const { data } = await apiClient.post<ApiResponse<LabResultSummary>>(
    LAB_RESULT_PATH,
    request,
  );
  return data.data;
}

/**
 * 확정 전 결과를 수정한다.
 * PUT /api/lab-imaging/lab-results/{labResultId} → 200 + LabResultSummaryDto
 *
 * ⚠ 이미 확정된 결과를 수정하려 하면 400 + LAB040 으로 거절된다.
 *   화면에서도 확정 건은 폼을 열지 않지만, 최종 판단은 서버가 한다.
 */
export async function updateLabResult(
  labResultId: string,
  request: LabResultUpdateRequest,
): Promise<LabResultSummary> {
  const { data } = await apiClient.put<ApiResponse<LabResultSummary>>(
    `${LAB_RESULT_PATH}/${encodeURIComponent(labResultId)}`,
    request,
  );
  return data.data;
}

/**
 * 결과를 확정한다. 결과상태 01(등록) → 02(확정).
 * POST /api/lab-imaging/lab-results/{labResultId}/confirm → 200 + LabResultSummaryDto
 *
 * ⚠ PUT 이 아니라 POST 다. 값을 바꾸는 게 아니라 상태를 한 방향으로 넘기는 행위다.
 *   (일정 재조정 POST /lab-schedules/{id}/reschedule 과 같은 규칙)
 * ⚠ 이미 확정된 건은 400 + LAB041. 되돌릴 수 없다.
 */
export async function confirmLabResult(
  labResultId: string,
  request: LabResultConfirmRequest,
): Promise<LabResultSummary> {
  const { data } = await apiClient.post<ApiResponse<LabResultSummary>>(
    `${LAB_RESULT_PATH}/${encodeURIComponent(labResultId)}/confirm`,
    request,
  );
  return data.data;
}

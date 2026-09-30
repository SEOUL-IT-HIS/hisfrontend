import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/labimaging/types";
import type {
  ImageReadingAssignRequest,
  ImageReadingConfirmRequest,
  ImageReadingFindingsRequest,
  ImageReadingSummary,
} from "@/features/labimaging/imaginginterpretation/types";

/**
 * 영상판독 API 경로
 * (백엔드 ImageReadingController @RequestMapping("/api/lab-imaging/image-readings"))
 */
const IMAGE_READING_PATH = "/api/lab-imaging/image-readings";

/**
 * 판독 워크리스트를 조회한다.
 * GET /api/lab-imaging/image-readings/worklist → 200 + ImageReadingSummaryDto[]
 *
 * ⚠ 접수·오더별 조회가 아니다. 영상파일이 1건 이상 등록된 촬영항목 전체를 응급 우선으로
 *   내려준다(findOrCreate). 특정 오더의 항목만 보려면 응답의 imageOrderId 로 걸러야 한다.
 *   (ImageReadingWorkPanel 참고)
 */
export async function fetchReadingWorklist(): Promise<ImageReadingSummary[]> {
  const { data } = await apiClient.get<ApiResponse<ImageReadingSummary[]>>(
    `${IMAGE_READING_PATH}/worklist`,
  );
  return data.data;
}

/**
 * 촬영항목ID로 판독 상세를 조회한다. 없으면 서버가 대기(01) 상태로 만들어 돌려준다(findOrCreate).
 * GET /api/lab-imaging/image-readings/{imageOrderItemId} → 200 + ImageReadingSummaryDto
 */
export async function fetchReadingByOrderItemId(
  imageOrderItemId: string,
): Promise<ImageReadingSummary> {
  const { data } = await apiClient.get<ApiResponse<ImageReadingSummary>>(
    `${IMAGE_READING_PATH}/${encodeURIComponent(imageOrderItemId)}`,
  );
  return data.data;
}

/**
 * 판독 담당자를 배정한다. 판독상태 01(대기) → 02(판독중).
 * POST /api/lab-imaging/image-readings/{imageReadingId}/assign → 200 + ImageReadingSummaryDto
 *
 * ⚠ 이미 판독중인 건도 담당자 변경(재배정)으로 허용된다. 확정(03)된 건은 400 + LAB062.
 */
export async function assignReading(
  imageReadingId: string,
  request: ImageReadingAssignRequest,
): Promise<ImageReadingSummary> {
  const { data } = await apiClient.post<ApiResponse<ImageReadingSummary>>(
    `${IMAGE_READING_PATH}/${encodeURIComponent(imageReadingId)}/assign`,
    request,
  );
  return data.data;
}

/**
 * 확정 전 판독의 소견을 입력/수정한다.
 * PUT /api/lab-imaging/image-readings/{imageReadingId}/findings → 200 + ImageReadingSummaryDto
 *
 * ⚠ 이미 확정된 판독을 수정하려 하면 400 + LAB062 로 거절된다.
 */
export async function updateFindings(
  imageReadingId: string,
  request: ImageReadingFindingsRequest,
): Promise<ImageReadingSummary> {
  const { data } = await apiClient.put<ApiResponse<ImageReadingSummary>>(
    `${IMAGE_READING_PATH}/${encodeURIComponent(imageReadingId)}/findings`,
    request,
  );
  return data.data;
}

/**
 * 판독을 확정(전자서명)한다. 판독상태 → 03(완료).
 * POST /api/lab-imaging/image-readings/{imageReadingId}/confirm → 200 + ImageReadingSummaryDto
 *
 * ⚠ PUT 이 아니라 POST 다. 값을 바꾸는 게 아니라 상태를 한 방향으로 넘기는 행위다.
 *   (LabResultApi.confirmLabResult 와 같은 규칙)
 * ⚠ 소견이 비어 있으면 400 + LAB063, 이미 확정된 건은 400 + LAB062. 되돌릴 수 없다.
 */
export async function confirmReading(
  imageReadingId: string,
  request: ImageReadingConfirmRequest,
): Promise<ImageReadingSummary> {
  const { data } = await apiClient.post<ApiResponse<ImageReadingSummary>>(
    `${IMAGE_READING_PATH}/${encodeURIComponent(imageReadingId)}/confirm`,
    request,
  );
  return data.data;
}

import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/labimaging/types";
import type {
  ConsentCreateRequest,
  ConsentSummary,
} from "@/features/labimaging/imagingacquisition/types";

/**
 * 동의 API 경로
 * (백엔드 ConsentController @RequestMapping("/api/lab-imaging/consents"))
 *
 * "/api/*" 로 시작하므로 next.config rewrite 가 lab-imaging-service 로 프록시한다.
 */
const CONSENT_PATH = "/api/lab-imaging/consents";

/**
 * 영상오더 1건의 동의 이력을 조회한다. (ZP2-80)
 * GET /api/lab-imaging/consents?imageOrderId={imageOrderId} → 200 + ConsentSummaryDto[]
 *
 * ⚠ 철회된 건도 함께 내려온다. 이력 화면이라 그대로 보여주고,
 *   "유효한 동의가 있는가"는 types.ts 의 hasValidConsent 로 판단한다.
 */
export async function fetchConsentsByImageOrderId(
  imageOrderId: string,
): Promise<ConsentSummary[]> {
  const { data } = await apiClient.get<ApiResponse<ConsentSummary[]>>(CONSENT_PATH, {
    params: { imageOrderId },
  });
  return data.data;
}

/**
 * 동의를 등록한다. (ZP2-84)
 * POST /api/lab-imaging/consents → 201 + ConsentSummaryDto
 *
 * ⚠ 같은 오더에 같은 유형의 철회 전 동의가 이미 있으면 400 + LAB031 로 실패한다.
 */
export async function createConsent(
  request: ConsentCreateRequest,
): Promise<ConsentSummary> {
  const { data } = await apiClient.post<ApiResponse<ConsentSummary>>(
    CONSENT_PATH,
    request,
  );
  return data.data;
}

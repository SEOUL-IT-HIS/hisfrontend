import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/labimaging/types";
import type {
  MicrobiologyResultCreateRequest,
  MicrobiologyResultSummary,
  MicrobiologyResultUpdateRequest,
} from "@/features/labimaging/microbiologyresult/types";
import type { LabResultConfirmRequest } from "@/features/labimaging/labresult/types";

/**
 * 미생물검사결과 API — UC-RST-02 (ZP2-14)
 * 백엔드 MicrobiologyResultController 와 1:1.
 */
const MICROBIOLOGY_RESULT_PATH = "/api/lab-imaging/microbiology-results";

/** GET /microbiology-results/receptions/{receptionNo} — 0~1건 */
export async function fetchMicrobiologyResults(
  receptionNo: string,
): Promise<MicrobiologyResultSummary[]> {
  const { data } = await apiClient.get<ApiResponse<MicrobiologyResultSummary[]>>(
    `${MICROBIOLOGY_RESULT_PATH}/receptions/${encodeURIComponent(receptionNo)}`,
  );
  return data.data;
}

export async function createMicrobiologyResult(
  request: MicrobiologyResultCreateRequest,
): Promise<MicrobiologyResultSummary> {
  const { data } = await apiClient.post<ApiResponse<MicrobiologyResultSummary>>(
    MICROBIOLOGY_RESULT_PATH,
    request,
  );
  return data.data;
}

export async function updateMicrobiologyResult(
  microbiologyResultId: string,
  request: MicrobiologyResultUpdateRequest,
): Promise<MicrobiologyResultSummary> {
  const { data } = await apiClient.put<ApiResponse<MicrobiologyResultSummary>>(
    `${MICROBIOLOGY_RESULT_PATH}/${encodeURIComponent(microbiologyResultId)}`,
    request,
  );
  return data.data;
}

/** 확정 요청 본문은 일반검사와 같은 모양({ confirmedById }) — 서버도 같은 DTO 를 쓴다 */
export async function confirmMicrobiologyResult(
  microbiologyResultId: string,
  request: LabResultConfirmRequest,
): Promise<MicrobiologyResultSummary> {
  const { data } = await apiClient.post<ApiResponse<MicrobiologyResultSummary>>(
    `${MICROBIOLOGY_RESULT_PATH}/${encodeURIComponent(microbiologyResultId)}/confirm`,
    request,
  );
  return data.data;
}

import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/labimaging/types";
import type {
  SpecimenAcceptanceRequest,
  SpecimenAcceptanceSummary,
  SpecimenCreateRequest,
  SpecimenSummary,
} from "@/features/labimaging/labspecimen/types";

/**
 * 검체 API 경로
 * (백엔드 SpecimenController @RequestMapping("/api/lab-imaging/specimens"))
 */
const SPECIMEN_PATH = "/api/lab-imaging/specimens";

/**
 * 접수 1건의 검체 목록을 조회한다.
 * GET /api/lab-imaging/specimens?receptionNo={receptionNo}
 *
 * ⚠ 판정 여부(judgedYn)는 보내지 않는다. 백엔드에 필터가 있지만 일부러 안 쓴다.
 *   판정이 끝난 검체도 화면에 회색으로 남겨 "3건 중 2건 판정" 을 보여줘야 하는데,
 *   서버에서 걸러 받으면 판정한 줄이 사라져 그 화면이 성립하지 않는다.
 *   접수 하나의 검체는 보통 1~3건이라 전체를 받아도 부담이 없다.
 *
 * TODO(ZP2-79 검체 이력 조회, 후반 작업): 접수를 넘나드는 이력 화면이 생기면
 *   judgedYn 을 쓰는 별도 조회 함수를 여기에 추가한다. (백엔드는 이미 지원)
 */
export async function fetchSpecimensByReceptionNo(
  receptionNo: string,
): Promise<SpecimenSummary[]> {
  const { data } = await apiClient.get<ApiResponse<SpecimenSummary[]>>(
    SPECIMEN_PATH,
    { params: { receptionNo } },
  );
  return data.data;
}

/**
 * 검체 채취정보를 등록한다.
 * POST /api/lab-imaging/specimens → 201 + SpecimenSummaryDto
 *
 * ⚠ 검체바코드는 요청에 담지 않는다. 서버가 채번해서 응답으로 내려준다.
 */
export async function createSpecimen(
  request: SpecimenCreateRequest,
): Promise<SpecimenSummary> {
  const { data } = await apiClient.post<ApiResponse<SpecimenSummary>>(
    SPECIMEN_PATH,
    request,
  );
  return data.data;
}

/**
 * 검체를 인수하면서 적합/부적합을 판정한다.
 * POST /api/lab-imaging/specimens/{specimenId}/acceptance → 201 + SpecimenAcceptanceSummaryDto
 *
 * ⚠ 대상 검체는 경로변수다. 이미 존재하는 검체를 지목하는 행위라 본문에 담지 않는다.
 *
 * ⚠ 서버가 막는 조합이 있다. 화면에서 미리 걸러도 최종 판단은 서버가 한다.
 *   - 부적합인데 사유 없음 / 적합인데 사유 있음 / 적합인데 재채취 요청 → 400 + LAB998
 *   - 이미 판정된 검체 → 400 + LAB022 (검체 1건당 판정 1건)
 */
export async function acceptSpecimen(
  specimenId: string,
  request: SpecimenAcceptanceRequest,
): Promise<SpecimenAcceptanceSummary> {
  const { data } = await apiClient.post<ApiResponse<SpecimenAcceptanceSummary>>(
    `${SPECIMEN_PATH}/${encodeURIComponent(specimenId)}/acceptance`,
    request,
  );
  return data.data;
}

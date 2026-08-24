import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/labimaging/types";
import type {
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
 * ⚠ 접수번호를 주면 백엔드가 judgedYn 필터를 무시하고 그 접수의 검체만 반환한다.
 *   워크리스트 오른쪽 작업 폼은 "이 접수의 검체"만 보면 되므로 이 형태를 쓴다.
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

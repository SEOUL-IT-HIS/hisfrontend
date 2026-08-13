/**
 * 수술 안전 체크리스트 API (SL2-35 / SL2-46·47·48 / SL2-49)
 *
 * <p>백엔드 SurgeryChecklistController(@RequestMapping("/api/surgery")) 와 1:1 대응.</p>
 *
 * <p>경로가 두 갈래인 이유 — 조회·등록은 어느 수술의 체크리스트인지가 필요해
 * {@code /{surgeryId}/checklist} 로 중첩하고, 수정은 항목 ID 만으로 대상이 정해지므로
 * {@code /checklist/{checklistId}} 로 평평하게 둔다(§21.8). 두 번째 칸이 고정 문자열이냐
 * 값이냐로 갈려 서로 충돌하지 않는다.</p>
 *
 * <p>삭제 API 가 없는 이유 — 체크리스트는 수술 안전 확인의 기록이라 지우지 않는다.
 * 잘못 등록했다면 completedYn 을 N 으로 되돌린다(§21.6).</p>
 */
import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/surgery/types";
import type {
  CreateChecklistRequest,
  SurgeryChecklist,
  UpdateChecklistRequest,
} from "@/features/surgery/checklist/types";

const SURGERY_PATH = "/api/surgery";

/** 해당 수술의 체크리스트 전 단계를 조회한다. (SL2-35) */
export async function getChecklist(
  surgeryId: string,
): Promise<SurgeryChecklist[]> {
  const { data } = await apiClient.get<ApiResponse<SurgeryChecklist[]>>(
    `${SURGERY_PATH}/${surgeryId}/checklist`,
  );
  // 아직 한 단계도 작성하지 않았으면 빈 배열이 정상이다
  return data.data ?? [];
}

/** 체크리스트 단계를 등록한다. (SL2-46 Sign In / SL2-47 Time Out / SL2-48 Sign Out) */
export async function createChecklistItem(
  surgeryId: string,
  request: CreateChecklistRequest,
): Promise<SurgeryChecklist> {
  const { data } = await apiClient.post<ApiResponse<SurgeryChecklist>>(
    `${SURGERY_PATH}/${surgeryId}/checklist`,
    request,
  );
  return data.data;
}

/** 체크리스트 완료 여부를 변경한다. (SL2-49) */
export async function updateChecklistItem(
  checklistId: string,
  request: UpdateChecklistRequest,
): Promise<SurgeryChecklist> {
  const { data } = await apiClient.patch<ApiResponse<SurgeryChecklist>>(
    `${SURGERY_PATH}/checklist/${checklistId}`,
    request,
  );
  return data.data;
}

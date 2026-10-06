import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/emergency/types";
import type {
  Bed,
  BedAssignment,
  BedAssignmentCreateRequest,
  BedReleaseRequest,
} from "@/features/emergency/resource/bed/types";

const BEDS_PATH = "/api/emergency/resources/beds";
const BED_ASSIGNMENTS_PATH = "/api/emergency/resources/bed-assignments";

/** 병상 목록을 조회한다(구역/상태 필터 선택). UC-RES-02 */
export async function getBeds(zoneCode?: string, status?: string): Promise<Bed[]> {
  const { data } = await apiClient.get<ApiResponse<Bed[]>>(BEDS_PATH, {
    params: { zoneCode, status },
  });
  return data.data;
}

/** 접수 건에 병상을 배정한다. UC-RES-02 */
export async function assignBed(request: BedAssignmentCreateRequest): Promise<BedAssignment> {
  const { data } = await apiClient.post<ApiResponse<BedAssignment>>(BED_ASSIGNMENTS_PATH, request);
  return data.data;
}

/** 접수의 현재(해제 안 된) 병상 배정을 조회한다. 없으면 null. 새로고침·환자 전환 뒤에도 Release 를 보여주려고 쓴다. UC-RES-02 */
export async function getCurrentBedAssignment(receptionId: string): Promise<BedAssignment | null> {
  const { data } = await apiClient.get<ApiResponse<BedAssignment | null>>(`${BED_ASSIGNMENTS_PATH}/current`, {
    params: { receptionId },
  });
  return data.data;
}

/** 병상 배정을 해제한다(환자 퇴실/전실 시). UC-RES-02 */
export async function releaseBed(assignmentId: string, request: BedReleaseRequest): Promise<BedAssignment> {
  const { data } = await apiClient.patch<ApiResponse<BedAssignment>>(
    `${BED_ASSIGNMENTS_PATH}/${assignmentId}/release`,
    request,
  );
  return data.data;
}

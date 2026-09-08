import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/emergency/types";
import type { Bed, BedAssignment, BedAssignmentCreateRequest } from "@/features/emergency/resource/bed/types";

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

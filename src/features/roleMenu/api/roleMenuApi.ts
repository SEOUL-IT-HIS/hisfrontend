/**
 * [역할별 메뉴 권한 API]
 * admin-service REST 호출만 담당 (UI/Redux 모름)
 *
 * - 조회 GET /api/role-menu/list/{roleId}
 * - 저장 PUT /api/role-menu/save/{roleId}
 *
 * 응답은 ApiResponse 래퍼 → data 필드만 반환
 */
import apiClient from "@/lib/axios";
import type {
  ApiResponse,
  RoleMenu,
  RoleMenuSaveRequest,
} from "../types/roleMenuTypes";

/** 역할 하나의 메뉴 권한 목록 (사용중인 메뉴 전부 + canRead) */
export async function fetchRoleMenuApi(roleId: string): Promise<RoleMenu[]> {
  const response = await apiClient.get<ApiResponse<RoleMenu[]>>(
    `/api/role-menu/list/${roleId}`,
  );
  return response.data.data ?? [];
}

/**
 * 역할 하나의 메뉴 권한 일괄 저장
 * - Path: roleId
 * - Body: menuIds
 *
 * 응답 data 는 null 이라 돌려줄 게 없다.
 */
export async function fetchRoleMenuSaveApi(
  roleMenuData: RoleMenuSaveRequest,
): Promise<void> {
  const { roleId, menuIds } = roleMenuData;
  await apiClient.put<ApiResponse<null>>(
    `/api/role-menu/save/${roleId}`,
    { menuIds },
  );
}
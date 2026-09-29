/**
 * [역할별 메뉴 권한 API]
 * admin-service REST 호출만 담당 (UI/Redux 모름)
 *
 * - 조회 GET /api/admin/role-menu/list/{roleId}
 * - 저장 PUT /api/admin/role-menu/save/{roleId}
 *
 * 같은 Permissions 화면의 Accounts 탭 (IH2-113)
 * - 계정 목록 GET /api/admin/account/list          (관리자 01·개인정보보호 책임자 02)
 * - 잠금 해제 PUT /api/admin/account/unlock/{empId} (관리자 01 만)
 *
 * 응답은 ApiResponse 래퍼 → data 필드만 반환
 */
import apiClient from "@/lib/axios";
import type {
  AccountRow,
  ApiResponse,
  RoleMenu,
  RoleMenuSaveRequest,
} from "../types/roleMenuTypes";

/** 역할 하나의 메뉴 권한 목록 (사용중인 메뉴 전부 + canRead) */
export async function fetchRoleMenuApi(roleId: string): Promise<RoleMenu[]> {
  const response = await apiClient.get<ApiResponse<RoleMenu[]>>(
    `/api/admin/role-menu/list/${roleId}`,
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
    `/api/admin/role-menu/save/${roleId}`,
    { menuIds },
  );
}

/** 전체 계정 목록 — 잠긴 계정이 먼저 온다 */
export async function fetchAccountListApi(): Promise<AccountRow[]> {
  const response = await apiClient.get<ApiResponse<AccountRow[]>>(
    "/api/admin/account/list",
  );
  return response.data.data ?? [];
}

/** 계정 잠금 해제 — 관리자(01)가 아니면 서버가 403 으로 거절한다 */
export async function unlockAccountApi(empId: string): Promise<void> {
  await apiClient.put<ApiResponse<null>>(`/api/admin/account/unlock/${empId}`);
}
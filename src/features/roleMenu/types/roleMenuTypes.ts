/**
 * [역할별 메뉴 권한 타입]
 * 백엔드 RoleMenuDto / RoleMenuSaveDto 와 1:1 대응
 */

/** 공통 API 응답 포맷 */
export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

/**
 * GET /api/admin/role-menu/list/{roleId} 응답 한 줄
 *
 * 주의: ROLE_MENU 에 행이 있는 메뉴만 오는 게 아니라
 * 사용중인 메뉴 전부(43개)가 온다. 권한이 없으면 canRead 가 "N".
 */
export type RoleMenu = {
  menuId: string;
  /** 상위 메뉴 ID. 최상위면 null */
  parentMenuId: string | null;
  menuName: string;
  /** 그룹 헤더 메뉴(외래, 검사영상 등)는 null */
  menuUrl: string | null;
  sortOrder: number;
  /** "Y" | "N" — useYn 과 같은 방식으로 문자열이다 */
  canRead: string;
};

/**
 * PUT /api/admin/role-menu/save/{roleId} 요청
 *
 * menuIds 는 "추가할 것"이 아니라 "저장 후의 최종 상태"다.
 * 여기 없는 메뉴는 기존에 권한이 있었더라도 해제된다.
 */
export type RoleMenuSaveRequest = {
  roleId: string;
  menuIds: string[];
};

/**
 * GET /api/admin/account/list 응답 한 줄 (Permissions > Accounts 탭, IH2-113)
 * 백엔드 AuthDto 중 화면에서 쓰는 값만 적었다. 비밀번호는 서버가 비워서 보낸다.
 */
export type AccountRow = {
  empId: string;
  loginId: string;
  empName: string | null;
  /** 쉼표로 이어진 역할 코드 (예: "03" 또는 "01,02"). 없으면 "" */
  roleCodes: string | null;
  /** 연속으로 비밀번호를 틀린 횟수. 5가 되면 잠긴다 */
  failCount: number | null;
  /** 잠긴 시각. null 이면 잠기지 않은 계정 (UTC 문자열, 예: "2026-09-28T05:49:02.179Z") */
  lockedAt: string | null;
};
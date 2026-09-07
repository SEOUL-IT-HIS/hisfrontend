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
 * GET /api/role-menu/list/{roleId} 응답 한 줄
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
 * PUT /api/role-menu/save/{roleId} 요청
 *
 * menuIds 는 "추가할 것"이 아니라 "저장 후의 최종 상태"다.
 * 여기 없는 메뉴는 기존에 권한이 있었더라도 해제된다.
 */
export type RoleMenuSaveRequest = {
  roleId: string;
  menuIds: string[];
};
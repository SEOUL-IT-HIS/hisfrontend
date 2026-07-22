// ============================================================
// Menu 타입 정의 — features/system
// ============================================================

/** admin-service ApiResponse 공통 래퍼 */
export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

/** GET /api/menu flat row (백엔드 MenuEntity) */
export type MenuRow = {
  menuId: number;
  parentMenuId: number | null;
  menuCode: string;
  menuName: string;
  menuUrl: string | null;
  sortOrder: number | null;
  useYn: string | null;
  areaKey: string | null;
  serviceCode: string | null;
};

/** Redux / UI 트리 노드 — components/sidebar/Sidebar.tsx */
export type MenuTreeNode = MenuRow & {
  children: MenuTreeNode[];
};

export type MenuApiResponse = ApiResponse<MenuRow[]>;

/** MENU 테이블 flat 행 — GET /api/menus 계약 */

export type MenuItem = {
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

/** FE에서 parentMenuId 로 조립한 트리 노드 */
export type MenuTreeNode = MenuItem & {
  children: MenuTreeNode[];
};

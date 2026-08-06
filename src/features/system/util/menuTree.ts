import type { MenuRow, MenuTreeNode } from "../types/menuTypes";

export function toMenuTree(flatRows: MenuRow[]): MenuTreeNode[] {
  // id로 메뉴를 바로 찾기 위한 저장소 (예: menuById[1] → "관리" 메뉴)
  const menuById: Record<number, MenuTreeNode & { children: MenuTreeNode[] }> = {};

  // parentMenuId가 null인 메뉴만 모음 → sidebar.tsx에서 items.map()의 시작점
  const topMenus: MenuTreeNode[] = [];

  // ── 1단계: row마다 "빈 children"을 가진 메뉴 객체를 먼저 전부 만든다 ──
  // parentMenuId 연결은 아직 하지 않음. id → 객체 매핑만 준비.
  for (const row of flatRows) {
    menuById[row.menuId] = {
      menuId: row.menuId,
      parentMenuId: row.parentMenuId,
      menuCode: row.menuCode,
      menuName: row.menuName,
      menuUrl: row.menuUrl,
      sortOrder: row.sortOrder,
      useYn: row.useYn,
      areaKey: row.areaKey,
      serviceCode: row.serviceCode,
      children: [],         // 2단계에서 parentMenuId 보고 여기에 자식 push
    };
  }

  // ── 2단계: parentMenuId를 보고 "누구 밑에 붙일지" 연결 ──
  for (const row of flatRows) {
    const menu = menuById[row.menuId];

    // parentMenuId ===  null→ 최상위 메뉴 (예: "관리")
    if (row.parentMenuId === null) {
      topMenus.push(menu);
      continue;
    }

    // parentMenuId가 있으면 → 부모 menuById[parentMenuId].children에 자신을 추가
    // 예: menuId=2, parentMenuId=1 → menuById[1].children.push(menuById[2])
    const parentMenu = menuById[row.parentMenuId];
    if (parentMenu) {
      parentMenu.children.push(menu);
    }
    // parentMenu가 없으면 (잘못된 parentMenuId) → 해당 row는 트리에서 제외
  }

  return topMenus;
}

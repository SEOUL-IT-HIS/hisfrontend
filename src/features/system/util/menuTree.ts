import type { MenuRow, MenuTreeNode } from "../types/menuTypes";

export function toMenuTree(flatRows: MenuRow[]): MenuTreeNode[] {
  // id로 메뉴를 바로 찾기 위한 저장소 (예: menuById[1] → "관리" 메뉴)
  const menuById: Record<string, MenuTreeNode & { children: MenuTreeNode[] }> = {};

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

/**
 * 로그인한 사용자가 볼 수 있는 메뉴만 남긴다.
 *
 * menuCodes 는 로그인할 때 서버가 내려주는 쉼표 문자열이다.
 * 예: "ADM_USER,ADM_PERMISSION,RCP_RECEPTION"
 *
 * 값이 비어 있으면(null 이거나 빈 문자열) **거르지 않고 전부 보여준다.**
 * 사이드바가 통째로 비어버리면 사용자가 아무것도 못 하고 원인도 알기 어렵기 때문이다.
 * 지금은 URL 직접 입력을 막는 기능이 없어서, 이 필터는 보안 장치가 아니라
 * "안 쓰는 메뉴를 감춰주는" 표시 기능에 가깝다.
 */
export function filterMenuTreeByCodes(
  tree: MenuTreeNode[],
  menuCodes: string | null | undefined,
): MenuTreeNode[] {
  if (!menuCodes || menuCodes.trim() === "") {
    return tree;
  }

  // "A,B,C" → 빠르게 찾을 수 있는 Set 으로 바꾼다.
  // 배열이면 메뉴 하나 볼 때마다 처음부터 훑어야 해서 Set 을 쓴다.
  const allowedCodes = new Set(
    menuCodes
      .split(",")
      .map((code) => code.trim())
      .filter((code) => code !== ""),
  );

  // 쉼표만 있거나 공백뿐이라 결국 아무것도 안 남은 경우도 위와 같이 전부 보여준다.
  if (allowedCodes.size === 0) {
    return tree;
  }

  return keepAllowedNodes(tree, allowedCodes);
}

/**
 * 트리를 위에서 아래로 훑으며 남길 것만 골라 새 배열을 만든다.
 *
 * 부모를 남기는 기준이 자식과 다르다는 점이 핵심이다.
 * 권한은 보통 실제 화면(맨 아래 메뉴)에만 붙는데, 부모를 자기 코드만 보고 지워버리면
 * 허용된 자식까지 같이 사라져서 화면에 못 들어간다.
 * 그래서 **살아남은 자식이 하나라도 있으면 부모도 남긴다.**
 *
 * 원본을 고치지 않고 새 객체({ ...node })를 만들어 담는다.
 * 이 트리는 Redux 안에 들어 있는 값이라 직접 바꾸면 안 되기 때문이다.
 */
function keepAllowedNodes(
  nodes: MenuTreeNode[],
  allowedCodes: Set<string>,
): MenuTreeNode[] {
  const result: MenuTreeNode[] = [];

  for (const node of nodes) {
    // 자식부터 먼저 거른다. 그래야 "살아남은 자식이 있는지"를 알 수 있다.
    const keptChildren = keepAllowedNodes(node.children, allowedCodes);

    if (allowedCodes.has(node.menuCode) || keptChildren.length > 0) {
      result.push({ ...node, children: keptChildren });
    }
  }

  return result;
}

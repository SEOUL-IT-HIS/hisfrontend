import type { MenuItem, MenuTreeNode } from "@/features/system/types";

function sortByOrder(a: MenuTreeNode, b: MenuTreeNode) {
  return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
}

/**
 * flat 메뉴 목록 → L0/L1 트리
 * - parentMenuId == null → 루트(L0)
 * - 그 외 → 부모 children
 */
export function buildMenuTree(flat: MenuItem[]): MenuTreeNode[] {
  const nodes = new Map<number, MenuTreeNode>();

  for (const item of flat) {
    nodes.set(item.menuId, { ...item, children: [] });
  }

  const roots: MenuTreeNode[] = [];

  for (const node of nodes.values()) {
    if (node.parentMenuId == null) {
      roots.push(node);
      continue;
    }
    const parent = nodes.get(node.parentMenuId);
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  for (const node of nodes.values()) {
    node.children.sort(sortByOrder);
  }
  roots.sort(sortByOrder);

  return roots;
}

function matchesPath(pathname: string, href: string | null | undefined) {
  if (!href) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** 현재 경로에 해당하는 L0 업무영역 메뉴 */
export function findWorkAreaMenuByPath(
  tree: MenuTreeNode[],
  pathname: string,
): MenuTreeNode | undefined {
  const byAreaHome = tree.find((item) => matchesPath(pathname, item.menuUrl));
  if (byAreaHome) return byAreaHome;

  return tree.find((item) =>
    item.children.some((child) => matchesPath(pathname, child.menuUrl)),
  );
}

/** 현재 경로에 해당하는 L1 child */
export function findChildMenuByPath(
  tree: MenuTreeNode[],
  pathname: string,
): MenuTreeNode | undefined {
  for (const root of tree) {
    const child = root.children.find((c) => matchesPath(pathname, c.menuUrl));
    if (child) return child;
  }
  return undefined;
}

export function isActivePath(pathname: string, href: string | null | undefined) {
  return matchesPath(pathname, href);
}

export function isWorkAreaActive(pathname: string, item: MenuTreeNode) {
  if (isActivePath(pathname, item.menuUrl)) return true;
  return item.children.some((child) => isActivePath(pathname, child.menuUrl));
}

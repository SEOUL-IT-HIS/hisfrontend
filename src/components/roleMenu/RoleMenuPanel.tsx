"use client";

/**
 * [역할별 메뉴 권한 패널]
 *
 * 선택된 역할의 메뉴 목록을 체크박스로 보여주고 저장한다.
 *
 * 메뉴는 부모-자식 구조(최대 3단계)라 트리 순서대로 펼쳐 들여쓰기로 표시한다.
 * MENU.SORT_ORDER 는 "같은 부모 안에서의 순서"라, 전체를 sortOrder 로만 정렬하면
 * 서로 다른 부모의 1번들이 섞여버린다.
 *
 * 체크 상태(checkedMenuIds)는 화면이 아니라 Redux 에 있다 — roleMenuSlice 주석 참고.
 */
import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, Panel } from "@/components/common";
import type { RoleType } from "@/features/emp/types/roleType";
import {
  fetchRoleMenuSaveRequest,
  toggleRoleMenu,
} from "@/features/roleMenu/slice/roleMenuSlice";
import type { RoleMenu } from "@/features/roleMenu/types/roleMenuTypes";
import type { AppDispatch, RootState } from "@/store/store";

type RoleMenuPanelProps = {
  /** 왼쪽에서 고른 역할. 아직 안 골랐으면 null */
  role: RoleType | null;
};

/** 화면에 그릴 한 줄 — 메뉴와 그 메뉴가 몇 번째 깊이인지 */
type MenuRow = {
  menu: RoleMenu;
  depth: number;
};

/**
 * 평평한 목록을 부모-자식 순서대로 펼친다.
 *
 * parentMenuId 가 parentId 인 것들을 sortOrder 순으로 돌면서,
 * 각 메뉴 바로 뒤에 그 메뉴의 자식들을 이어 붙인다(재귀).
 * 최상위는 parentMenuId 가 null 이므로 parentId=null, depth=0 으로 시작한다.
 */
function flattenMenus(
  menus: RoleMenu[],
  parentId: string | null,
  depth: number,
): MenuRow[] {
  const rows: MenuRow[] = [];
  const children = menus
    .filter((menu) => menu.parentMenuId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  for (const menu of children) {
    rows.push({ menu, depth });
    rows.push(...flattenMenus(menus, menu.menuId, depth + 1));
  }
  return rows;
}

export default function RoleMenuPanel({ role }: RoleMenuPanelProps) {
  const dispatch = useDispatch<AppDispatch>();
  const roleMenus = useSelector((state: RootState) => state.roleMenu.roleMenus);
  const checkedMenuIds = useSelector(
    (state: RootState) => state.roleMenu.checkedMenuIds,
  );
  const loading = useSelector((state: RootState) => state.roleMenu.loading);
  const error = useSelector((state: RootState) => state.roleMenu.error);
  const saved = useSelector((state: RootState) => state.roleMenu.saved);

  /** roleMenus 가 바뀔 때만 트리를 다시 만든다 (체크박스 클릭마다 재계산하지 않도록) */
  const menuRows = useMemo(() => flattenMenus(roleMenus, null, 0), [roleMenus]);

  function onSave() {
    if (role === null) return;
    dispatch(
      fetchRoleMenuSaveRequest({
        roleId: role.roleId,
        menuIds: checkedMenuIds,
      }),
    );
  }

  // 역할 미선택
  if (role === null) {
    return (
      <Panel dashed>
        <div className="flex min-h-0 flex-1 items-center justify-center px-6 text-center text-sm text-slate-400">
          Select a role to manage its menu permissions.
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      {/* 헤더: 역할명 + 허용 개수 + 저장 버튼 */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            {role.roleName}
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            {checkedMenuIds.length} of {roleMenus.length} menus allowed
          </p>
        </div>
        <Button onClick={onSave} disabled={loading}>
          {loading ? "Saving…" : "Save"}
        </Button>
      </div>

      {error ? (
        <div className="px-5 pt-4">
          <Alert variant="error">{error}</Alert>
        </div>
      ) : null}
      {saved ? (
        <div className="px-5 pt-4">
          <Alert variant="success">Permissions saved.</Alert>
        </div>
      ) : null}

      {/* 메뉴 목록 */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {menuRows.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">No menus.</p>
        ) : (
          <ul className="flex flex-col">
            {menuRows.map(({ menu, depth }) => (
              <li key={menu.menuId}>
                {/* 들여쓰기(depth)로 부모-자식 관계를 표시한다 */}
                <label
                  className="flex cursor-pointer items-center gap-2 rounded-lg py-1.5 pr-2 text-sm text-slate-700 hover:bg-slate-50"
                  style={{ paddingLeft: depth * 20 + 8 }}
                >
                  <input
                    type="checkbox"
                    checked={checkedMenuIds.includes(menu.menuId)}
                    onChange={() => dispatch(toggleRoleMenu(menu.menuId))}
                    className="h-4 w-4 shrink-0 accent-sky-600"
                  />
                  <span
                    className={
                      depth === 0 ? "font-semibold text-slate-800" : undefined
                    }
                  >
                    {menu.menuName}
                  </span>
                  {menu.menuUrl ? (
                    <span className="truncate text-xs text-slate-400">
                      {menu.menuUrl}
                    </span>
                  ) : null}
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}

"use client";

/**
 * [역할별 메뉴 권한 화면]
 *
 * 구성:
 * - 왼쪽: 역할 목록 (ROLE 테이블에서 사용중인 것만) + 행 선택
 * - 오른쪽: RoleMenuPanel (선택 역할의 메뉴 체크박스 + 저장)
 *
 * 데이터 흐름:
 * 1) mount 시 역할 목록 조회
 *    (참조 데이터라 Redux 없이 화면이 들고 있는다 — EmpList 가 roles 를 다루는 방식과 동일)
 * 2) 역할 클릭 → fetchRoleMenuRequest → saga → API → Redux roleMenus/checkedMenuIds
 * 3) 오른쪽 패널이 Redux 를 구독해 체크박스를 그린다
 *
 * 권한 배정의 두 축 중 이 화면은 "역할 → 메뉴" 축을 담당한다.
 * "직원 → 역할" 축은 직원관리(EmpUpdateForm)에서 배정한다.
 */
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Panel } from "@/components/common";
import RoleMenuPanel from "@/components/roleMenu/RoleMenuPanel";
import { fetchRoleListApi } from "@/features/emp/api/roleApi";
import type { RoleType } from "@/features/emp/types/roleType";
import { fetchRoleMenuRequest } from "@/features/roleMenu/slice/roleMenuSlice";
import type { AppDispatch } from "@/store/store";

export default function RoleMenuList() {
  const dispatch = useDispatch<AppDispatch>();

  const [roles, setRoles] = useState<RoleType[]>([]);
  /** 왼쪽에서 선택한 역할 PK — 오른쪽 패널에 전달 */
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  // 화면 진입 시 역할 목록 조회
  useEffect(() => {
    async function loadRoles() {
      const roleList = await fetchRoleListApi();
      setRoles(roleList);
    }
    void loadRoles();
  }, []);

  const selectedRole =
    roles.find((role) => role.roleId === selectedRoleId) ?? null;

  /** 역할을 고르면 그 역할의 메뉴 권한을 조회한다 */
  function selectRole(roleId: string) {
    setSelectedRoleId(roleId);
    dispatch(fetchRoleMenuRequest(roleId));
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-sky-600">
            ADMIN
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            Permissions
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Select a role to set which menus it can access.
          </p>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)]">
        {/* ========== 왼쪽: 역할 목록 ========== */}
        <Panel>
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Roles</h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Click a role to edit its permissions
              </p>
            </div>
            <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-white">
              {roles.length}
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {roles.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">
                No roles.
              </p>
            ) : (
              <ul className="flex flex-col">
                {roles.map((role) => {
                  const selected = role.roleId === selectedRoleId;
                  return (
                    <li key={role.roleId}>
                      <button
                        type="button"
                        onClick={() => selectRole(role.roleId)}
                        className={
                          selected
                            ? "relative flex w-full items-center gap-2 px-5 py-3.5 text-left text-sm font-semibold text-sky-700 transition-colors"
                            : "relative flex w-full items-center gap-2 px-5 py-3.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
                        }
                      >
                        {selected ? (
                          <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-sky-500" />
                        ) : null}
                        <span className="truncate">{role.roleName}</span>
                        <span className="ml-auto shrink-0 text-xs text-slate-400">
                          {role.roleCode}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Panel>

        {/* ========== 오른쪽: 메뉴 권한 패널 ========== */}
        {/* 패널은 로컬 state 가 없고 전부 Redux 를 보므로 key 가 필요 없다 */}
        <RoleMenuPanel role={selectedRole} />
      </div>
    </div>
  );
}

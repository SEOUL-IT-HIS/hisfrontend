"use client";

/**
 * [Permissions > Accounts 탭] 계정 잠금 현황 + 잠금 해제 (IH2-113)
 *
 * - 비밀번호를 5번 연속 틀리면 서버가 계정을 잠근다 (IH2-114). 관리자(01) 계정은 잠기지 않는다.
 * - 목록: GET /api/admin/account/list  → 잠긴 계정이 먼저 온다
 * - 해제: PUT /api/admin/account/unlock/{empId}
 *
 * 보는 사람: 관리자(01)·개인정보보호 책임자(02). 그 외 역할은 서버가 403 을 준다.
 * Unlock 버튼: 관리자(01)에게만 보인다. (서버도 01 만 허용하므로 버튼 숨김은 편의용)
 *
 * 비밀번호 초기화 (IH2-116)
 * - 비밀번호를 잊은 직원을 초기 비밀번호(1111)로 되돌린다. 잠금도 같이 풀린다.
 * - PUT /api/admin/account/reset-password/{empId}
 * - Reset password 버튼: 관리자(01)에게만, 그리고 관리자 계정이 아닌 행에만 보인다.
 *   (팀원 공용 관리자 계정이 초기화되면 전원 로그인이 막히므로 서버도 거절한다)
 *
 * 이 탭에서만 쓰는 데이터라 Redux 에 넣지 않고 화면이 들고 있는다 (RoleMenuList 의 roles 와 같은 방식).
 */
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Alert, Button, Input, Panel } from "@/components/common";
import type { RoleType } from "@/features/emp/types/roleType";
import {
  fetchAccountListApi,
  resetPasswordApi,
  unlockAccountApi,
} from "@/features/roleMenu/api/roleMenuApi";
import type { AccountRow } from "@/features/roleMenu/types/roleMenuTypes";
import type { RootState } from "@/store/store";

/** ROLE.ROLE_CODE — 시스템 관리자. Unlock 버튼은 이 역할에게만 보인다 */
const ROLE_CODE_ADMIN = "01";

/** 이 횟수만큼 틀리면 서버가 잠근다 (admin-service AuthServiceImpl.MAX_FAIL_COUNT 와 같은 값) */
const MAX_FAIL_COUNT = 5;

type AccountLockPanelProps = {
  /** 역할 코드를 이름으로 바꿔 보여주려고 받는다 (RoleMenuList 가 이미 불러온 목록) */
  roles: RoleType[];
};

/**
 * 잠긴 시각 표시용.
 * 서버는 UTC(끝에 Z)로 보내므로 그대로 자르면 9시간이 어긋난다.
 * new Date() 로 읽으면 브라우저가 한국 시간으로 바꿔준다.
 */
function formatLockedAt(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day} ${hour}:${minute}`;
}

/** "03" 또는 "01,02" → "Doctor" 또는 "System Admin, Privacy Officer" */
function toRoleNames(roles: RoleType[], roleCodes: string | null): string {
  if (!roleCodes) return "-";
  const names: string[] = [];
  for (const code of roleCodes.split(",")) {
    const role = roles.find((r) => r.roleCode === code);
    names.push(role ? role.roleName : code);
  }
  return names.join(", ");
}

export default function AccountLockPanel({ roles }: AccountLockPanelProps) {
  const authUser = useSelector((state: RootState) => state.auth.user);

  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [lockedOnly, setLockedOnly] = useState(false);
  /** 지금 해제 요청 중인 직원 ID — 그 행의 버튼만 "Unlocking..." 으로 바꾼다 */
  const [unlockingEmpId, setUnlockingEmpId] = useState<string | null>(null);
  /** 지금 비밀번호 초기화 요청 중인 직원 ID — 그 행의 버튼만 "Resetting..." 으로 바꾼다 */
  const [resettingEmpId, setResettingEmpId] = useState<string | null>(null);
  /** 해제·초기화 중 하나라도 진행 중이면 모든 버튼을 잠깐 막는다 */
  const busy = unlockingEmpId != null || resettingEmpId != null;

  // roleCodes 는 "01" 또는 "01,03" 같은 쉼표 문자열이다
  const isAdmin = (authUser?.roleCodes ?? "").split(",").includes(ROLE_CODE_ADMIN);

  // 탭을 열면 계정 목록 조회
  useEffect(() => {
    fetchAccountListApi()
      .then((list) => setAccounts(list))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load accounts."))
      .finally(() => setLoading(false));
  }, []);

  /** Unlock 버튼 — 해제 후 목록을 다시 불러온다 */
  async function handleUnlock(account: AccountRow) {
    const name = account.empName ?? account.loginId;
    if (!window.confirm(`Unlock ${name} (${account.loginId})?\nThe failed sign-in count will be reset to 0.`)) {
      return;
    }

    setUnlockingEmpId(account.empId);
    setError(null);
    setMessage(null);
    try {
      await unlockAccountApi(account.empId);
      setAccounts(await fetchAccountListApi());
      setMessage(`${name} (${account.loginId}) has been unlocked.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to unlock the account.");
    } finally {
      setUnlockingEmpId(null);
    }
  }

  /** Reset password 버튼 — 초기 비밀번호로 되돌린 뒤 목록을 다시 불러온다 (잠금도 풀려서 보인다) */
  async function handleResetPassword(account: AccountRow) {
    const name = account.empName ?? account.loginId;
    if (
      !window.confirm(
        `Reset the password of ${name} (${account.loginId}) to the initial password (1111)?\n` +
          "The account will also be unlocked. Tell the employee to change it after signing in.",
      )
    ) {
      return;
    }

    setResettingEmpId(account.empId);
    setError(null);
    setMessage(null);
    try {
      await resetPasswordApi(account.empId);
      setAccounts(await fetchAccountListApi());
      setMessage(`The password of ${name} (${account.loginId}) has been reset to 1111.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reset the password.");
    } finally {
      setResettingEmpId(null);
    }
  }

  /** 이 행이 관리자(01) 계정인가 — 관리자 계정은 초기화 버튼을 보여주지 않는다 */
  function isAdminAccount(account: AccountRow): boolean {
    return (account.roleCodes ?? "").split(",").includes(ROLE_CODE_ADMIN);
  }

  const lockedCount = accounts.filter((a) => a.lockedAt != null).length;

  // 검색어·"Locked only" 로 거른 목록 (서버 재조회 없이 화면에서 거른다)
  const word = keyword.trim().toLowerCase();
  const visibleAccounts = accounts.filter((a) => {
    if (lockedOnly && a.lockedAt == null) return false;
    if (word === "") return true;
    return (
      a.loginId.toLowerCase().includes(word) ||
      (a.empName ?? "").toLowerCase().includes(word)
    );
  });

  return (
    <Panel>
      {/* 헤더: 설명 + 잠긴 수 + 필터 */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-white px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-slate-900">Accounts</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Locks after {MAX_FAIL_COUNT} failed sign-ins · System Admin accounts are never locked
          </p>
        </div>
        <span
          className={
            lockedCount > 0
              ? "rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/10"
              : "rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10"
          }
        >
          {lockedCount} locked
        </span>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={lockedOnly}
            onChange={(e) => setLockedOnly(e.target.checked)}
          />
          Locked only
        </label>
        <div className="w-48">
          <Input
            value={keyword}
            placeholder="Login ID / Name"
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
      </div>

      {error ? (
        <div className="px-5 pt-4">
          <Alert variant="error">{error}</Alert>
        </div>
      ) : null}

      {message ? (
        <div className="px-5 pt-4">
          <Alert variant="success">{message}</Alert>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 backdrop-blur">
            <tr className="text-xs uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3 font-medium">Login ID</th>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Failed</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Locked At</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-slate-400">
                  Loading accounts...
                </td>
              </tr>
            ) : visibleAccounts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-slate-400">
                  {lockedOnly ? "No locked accounts." : "No accounts."}
                </td>
              </tr>
            ) : (
              visibleAccounts.map((account) => {
                const locked = account.lockedAt != null;
                return (
                  <tr key={account.empId}>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-700">
                      {account.loginId}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">{account.empName ?? "-"}</td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {toRoleNames(roles, account.roleCodes)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {account.failCount ?? 0}/{MAX_FAIL_COUNT}
                    </td>
                    <td className="px-5 py-3.5">
                      {locked ? (
                        <span className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/10">
                          Locked
                        </span>
                      ) : (
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {formatLockedAt(account.lockedAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-2">
                        {locked && isAdmin ? (
                          <Button
                            variant="danger"
                            onClick={() => handleUnlock(account)}
                            disabled={busy}
                          >
                            {unlockingEmpId === account.empId ? "Unlocking..." : "Unlock"}
                          </Button>
                        ) : null}
                        {isAdmin && !isAdminAccount(account) ? (
                          <Button
                            variant="secondary"
                            onClick={() => handleResetPassword(account)}
                            disabled={busy}
                          >
                            {resettingEmpId === account.empId ? "Resetting..." : "Reset password"}
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

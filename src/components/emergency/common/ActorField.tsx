"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { FormField, Input } from "@/components/common";
import { CODE_GROUP, ER_DEPT_CODE } from "@/features/emergency/codes";
import {
  fetchAllCommonCodesRequest,
  selectCommonCodeLoaded,
  selectCommonCodeLoading,
  selectCommonCodesByGroup,
} from "@/features/emergency/commonCode/slice";
import { useActorId, useLoginUser, useStaff, type ActorKind, type StaffOption } from "@/features/emergency/common/staff";

type ActorFieldProps = {
  label: string;
  /** 직접 고르거나 입력한 값. 로그인 사용자를 쓰는 칸이면 로그인 정보가 없을 때만 쓰인다 */
  value: string;
  onChange: (empId: string) => void;
  /**
   * "DOCTOR": 의사 목록에서 고른다(기본은 로그인한 사람이 의사일 때 그 사람).
   * "STAFF": 의사·간호사 목록에서 고른다(기본은 로그인한 사람).
   * 없으면 로그인한 사용자가 처리자다.
   */
  role?: ActorKind;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

// components/common/Select 와 같은 모양 — 그룹(optgroup)을 쓰려고 직접 그린다
const SELECT_CLASS =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 disabled:text-slate-500";

interface DeptGroup {
  key: string;
  label: string;
  people: StaffOption[];
}

/** 부서별로 묶는다 — 응급의학과가 맨 위, 부서가 없는 직원은 맨 아래 */
function groupByDepartment(people: StaffOption[], deptName: (code: string) => string): DeptGroup[] {
  const byDept = new Map<string, StaffOption[]>();
  for (const person of people) {
    const key = person.deptCode ?? "";
    byDept.set(key, [...(byDept.get(key) ?? []), person]);
  }
  const keys = [...byDept.keys()].sort((a, b) => {
    if (a === ER_DEPT_CODE) return -1;
    if (b === ER_DEPT_CODE) return 1;
    if (a === "") return 1;
    if (b === "") return -1;
    return a.localeCompare(b);
  });
  return keys.map((key) => ({
    key,
    label: key === "" ? "No department" : key === ER_DEPT_CODE ? `${deptName(key)} (ER)` : deptName(key),
    people: byDept.get(key) ?? [],
  }));
}

/**
 * 처리자(기록자·결정자·처방의·시행자 등) 칸.
 * 저장하는 값은 사람이 아무렇게나 적은 글자가 아니라 admin 직원 ID(empId)다.
 * - 기본: 로그인한 사용자를 그대로 쓴다. 이름만 읽기 전용으로 보여주고 입력하지 않는다.
 * - role="DOCTOR": 의사 드롭다운. 로그인한 사람이 의사면 처음부터 선택되어 있다. 구두처방처럼 간호사가 의사 대신 입력하는 칸에 쓴다.
 * - role="STAFF": 의사·간호사 드롭다운. 처음에는 로그인한 사람이고, 실제로 행위를 한 사람이 다르면 바꿔 고른다.
 * 목록은 부서별로 묶어 응급의학과를 맨 위에 보여준다(다른 과 의사·간호사도 협진·당직으로 참여할 수 있어 막지 않는다).
 * 로그인 정보나 직원 목록을 못 받는 환경(단독 실행·세션 문제)에서는 직접 입력칸(또는 로그인 사용자)으로 대체한다.
 * 화면 밖에서 쓸 값은 같은 인자로 useActorId 를 호출해 얻는다.
 */
export default function ActorField({ label, value, onChange, role, required = false, disabled, className = "" }: ActorFieldProps) {
  const dispatch = useDispatch<AppDispatch>();
  const login = useLoginUser();
  const wantsList = role === "DOCTOR" || role === "STAFF";
  const { doctors, nurses, loading } = useStaff(wantsList);
  const actorId = useActorId(value, role);
  const commonCodeLoaded = useSelector(selectCommonCodeLoaded);
  const commonCodeLoading = useSelector(selectCommonCodeLoading);
  const deptCodes = useSelector(selectCommonCodesByGroup(CODE_GROUP.DEPT));

  // 부서 이름은 admin 공통코드(DEPT_CD)에서 읽는다
  useEffect(() => {
    if (wantsList && !commonCodeLoaded && !commonCodeLoading) dispatch(fetchAllCommonCodesRequest());
  }, [dispatch, wantsList, commonCodeLoaded, commonCodeLoading]);

  const people = role === "DOCTOR" ? doctors : [...doctors, ...nurses];

  const loginReadOnly = (
    <FormField label={label} required={required} className={className}>
      <Input value={login.empName} disabled readOnly />
    </FormField>
  );

  // 로그인 사용자가 곧 처리자인 칸
  if (!wantsList && login.signedIn) return loginReadOnly;

  if (wantsList && (loading || people.length > 0)) {
    const deptName = (code: string) => deptCodes.find((c) => c.codeValue === code)?.codeName ?? code;
    const groups = groupByDepartment(people, deptName);
    const known = people.some((p) => p.empId === actorId);
    // 목록에 없는 값도 사라지지 않게 남겨 둔다: 로그인한 사람(관리자 계정 등) 또는 예전 값
    const extraLabel = actorId === login.empId ? `${login.empName} (me)` : actorId;
    const optionLabel = (p: StaffOption) =>
      role === "STAFF" ? `${p.empName} (${p.empNo}) · ${p.role === "DOCTOR" ? "Doctor" : "Nurse"}` : `${p.empName} (${p.empNo})`;
    return (
      <FormField label={label} required={required} className={className}>
        <select
          value={actorId}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || loading}
          className={SELECT_CLASS}
        >
          <option value="">{loading ? "Loading staff..." : role === "DOCTOR" ? "Select doctor" : "Select staff"}</option>
          {actorId && !known ? <option value={actorId}>{extraLabel}</option> : null}
          {groups.map((group) => (
            <optgroup key={group.key || "none"} label={group.label}>
              {group.people.map((p) => (
                <option key={p.empId} value={p.empId}>
                  {optionLabel(p)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </FormField>
    );
  }

  // 직원 목록을 못 받았다: 로그인한 사람이 있으면 그 사람으로, 없으면 직접 입력
  if (role === "STAFF" && login.signedIn) return loginReadOnly;

  return (
    <FormField label={label} required={required} className={className}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={role === "DOCTOR" ? "Doctor ID (doctor list unavailable)" : "Staff ID"}
        disabled={disabled}
        maxLength={36}
      />
    </FormField>
  );
}

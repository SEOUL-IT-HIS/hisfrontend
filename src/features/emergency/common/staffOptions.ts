import { ER_DEPT_CODE } from "@/features/emergency/codes";
import type { ActorKind, StaffOption } from "@/features/emergency/common/staff";

/** 드롭다운 한 줄 */
export interface PickerOption {
  value: string;
  name: string;
  /** 검색에 쓰는 글자(이름 + 사번). 화면에는 보이지 않을 수 있다 */
  searchText: string;
  /** 화면에 보여줄 사번 — 같은 이름이 둘 이상일 때만 채운다 */
  empNo?: string;
  /** 짧은 꼬리표(Doctor / Nurse) — 의사·간호사가 섞인 목록에서만 */
  tag?: string;
  tagTone?: "doctor" | "nurse";
  /** 로그인한 본인 */
  isMe?: boolean;
}

/** 부서 한 묶음 */
export interface PickerGroup {
  key: string;
  label: string;
  /** 응급의학과 */
  highlight: boolean;
  options: PickerOption[];
}

export interface PickerModel {
  /** 목록 맨 위에 따로 놓는 줄 — 직원 목록에 없는 로그인 사용자(관리자 계정 등)나 예전 값 */
  pinned: PickerOption[];
  groups: PickerGroup[];
}

/** 부서별로 묶는다 — 응급의학과가 맨 위, 부서가 없는 직원은 맨 아래 */
export function groupByDepartment(
  people: StaffOption[],
  deptName: (code: string) => string,
  toOption: (person: StaffOption) => PickerOption,
): PickerGroup[] {
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
    key: key || "none",
    label: key === "" ? "No department" : key === ER_DEPT_CODE ? `${deptName(key)} (ER)` : deptName(key),
    highlight: key === ER_DEPT_CODE,
    options: (byDept.get(key) ?? []).map(toOption),
  }));
}

/**
 * 처리자 드롭다운에 보여줄 목록을 만든다.
 * - 사번은 평소에는 숨기고, 같은 이름이 둘 이상일 때만 그 사람들에게 보여준다. 닫힌 칸에는 부서가 보이지 않으므로
 *   같은 과인지와 상관없이 목록 전체에서 이름이 겹치는지를 본다.
 * - kind 가 "STAFF" 일 때만 Doctor / Nurse 꼬리표를 붙인다(의사 전용 목록에서는 필요 없다).
 * - 지금 값(actorId)이 목록에 없으면(관리자 계정 등) 맨 위에 따로 남겨 사라지지 않게 한다.
 */
export function buildStaffPickerModel(args: {
  people: StaffOption[];
  kind: ActorKind;
  actorId: string;
  login: { empId: string; empName: string };
  deptName: (code: string) => string;
}): PickerModel {
  const { people, kind, actorId, login, deptName } = args;

  const nameCount = new Map<string, number>();
  for (const person of people) nameCount.set(person.empName, (nameCount.get(person.empName) ?? 0) + 1);

  const toOption = (person: StaffOption): PickerOption => ({
    value: person.empId,
    name: person.empName,
    searchText: `${person.empName} ${person.empNo}`.toLowerCase(),
    empNo: (nameCount.get(person.empName) ?? 0) > 1 ? person.empNo : undefined,
    tag: kind === "STAFF" ? (person.role === "DOCTOR" ? "Doctor" : "Nurse") : undefined,
    tagTone: person.role === "DOCTOR" ? "doctor" : "nurse",
    isMe: person.empId === login.empId,
  });

  const pinned: PickerOption[] = [];
  if (actorId && !people.some((person) => person.empId === actorId)) {
    const isMe = actorId === login.empId;
    const name = isMe ? login.empName : actorId;
    pinned.push({ value: actorId, name, searchText: name.toLowerCase(), isMe });
  }

  return { pinned, groups: groupByDepartment(people, deptName, toOption) };
}

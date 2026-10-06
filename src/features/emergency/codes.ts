/**
 * 응급(EMG) 공통코드 그룹·값 — 백엔드 EmgCodes 와 같은 값으로 유지한다.
 * admin 관례에 맞춰 그룹코드는 끝이 _CD, 코드값은 숫자 2자리(2026-09-30 결정).
 * admin 에 그룹이 없을 때는 각 기능 types.ts 의 폴백 옵션을 쓴다.
 * 값으로 분기하는 로직(병상 상태, 최초/재평가, 스크리닝 종류·결과, 동의 유예/보호자 등)은 여기 상수를 쓴다.
 */
export const CODE_GROUP = {
  ZONE: "ER_ZONE_CD",
  BED_STATUS: "ER_BED_STATUS_CD",
  BED_TYPE: "ER_BED_TYPE_CD",
  DISPOSITION_TYPE: "ER_DISPOSITION_TYPE_CD",
  /** admin 에 이미 있는 그룹(KTAS 01~05) */
  KTAS_LEVEL: "TRIAGE_CD",
  ASSESSMENT_TYPE: "ER_ASSESSMENT_TYPE_CD",
  ISOLATION_TYPE: "ER_ISOLATION_TYPE_CD",
  SCREENING_TYPE: "SCREENING_TYPE_CD",
  SCREENING_RESULT: "SCREENING_RESULT_CD",
  NOTE_TYPE: "ER_NOTE_TYPE_CD",
  /** admin 에 이미 있는 그룹. 응급은 01·02·05만 쓴다 */
  CONSENT_TYPE: "CONSENT_TYPE_CD",
  CONSENT_STATUS: "ER_CONSENT_STATUS_CD",
  CONSENT_BY: "CONSENT_BY_CD",
  TREATMENT_TYPE: "ER_TREATMENT_TYPE_CD",
  CPR_EVENT_TYPE: "CPR_EVENT_TYPE_CD",
  CPR_OUTCOME: "CPR_OUTCOME_CD",
  ADMISSION_STATUS: "ADMISSION_REQUEST_STATUS_CD",
  TRANSFER_HOSPITAL: "TRANSFER_HOSPITAL_CD",
  /** admin 에 이미 있는 그룹 */
  ADMIN_ROUTE: "ADMIN_ROUTE_CD",
  /** admin 에 이미 있는 그룹(진료과·병동) — 입원요청에서 씀 */
  DEPT: "DEPT_CD",
  WARD: "WARD_CD",
  /** 처방코어(OPD)가 쓰는 admin 그룹 — 응급 처방 등록에서 씀 */
  ORDER_PRIORITY: "ORDER_PRIORITY_CD",
  ORDER_TIMING: "ORDER_TIMING_CD",
  /** 약품 제형 — admin 그룹(외래·입원 처방도 같은 그룹을 쓴다). 응급 처방 등록의 약품 항목에서 씀 */
  DOSAGE_FORM: "DOSAGE_FORM_CD",
  /** admin 에 이미 있는 그룹(검사 종류 01~08). 외래·병동·LAB 이 같은 값을 검사 항목 코드로 쓴다 */
  LAB_TEST: "TEST_TYPE_CD",
} as const;

/** 응급의학과의 admin 부서 코드(DEPT_CD 10, Emergency Medicine) — 의사·간호사 목록에서 응급 직원을 맨 위에 보여줄 때 쓴다 */
export const ER_DEPT_CODE = "10";

export const BED_STATUS = {
  EMPTY: "01",
  OCCUPIED: "02",
  CLEANING: "03",
  OUT_OF_SERVICE: "04",
} as const;

export const DISPOSITION = {
  HOME: "01",
  ADMIT: "02",
  TRANSFER: "03",
  DEATH: "04",
  DAMA: "05",
} as const;

export const ASSESSMENT_TYPE = {
  INITIAL: "01",
  REASSESS: "02",
} as const;

export const SCREENING_TYPE = {
  SEPSIS: "01",
  STROKE: "02",
} as const;

export const SCREENING_RESULT = {
  NEGATIVE: "01",
  POSITIVE: "02",
  INCONCLUSIVE: "03",
} as const;

export const CONSENT_STATUS = {
  AGREED: "01",
  REFUSED: "02",
  DEFERRED: "03",
} as const;

export const CONSENT_BY = {
  SELF: "01",
  GUARDIAN: "02",
} as const;

/** 응급이 쓰는 동의서 종류: 01 수술, 02 마취, 05 침습적 시술 (admin CONSENT_TYPE_CD 의 일부) */
export const CONSENT_TYPE_ALLOWED: ReadonlyArray<string> = ["01", "02", "05"];

export const ADMISSION_STATUS = {
  REQUESTED: "01",
  BED_ASSIGNED: "02",
  REJECTED: "03",
} as const;

/** "01" → 1. KTAS 등급처럼 코드값이 숫자 문자열일 때 화면에 "Level 1" 로 보여주기 위해 쓴다. */
export function codeToNumber(code: string | null | undefined): number | string {
  if (!code) return "";
  const n = Number(code);
  return Number.isNaN(n) ? code : n;
}

/** 공통코드 항목 중 화면 선택지에 필요한 필드만 */
type CodeItemLike = { codeValue: string; codeName: string; useYn?: string };

/**
 * 드롭다운 옵션 만들기 — admin 공통코드 캐시에 그룹이 있으면 그 값(사용 중인 것만)을, 없으면 폴백을 쓴다.
 * value 는 저장되는 코드값(codeValue), label 은 화면에 보이는 이름(codeName).
 */
export function toCodeOptions(
  codes: ReadonlyArray<CodeItemLike>,
  fallback: ReadonlyArray<{ value: string; label: string }>,
): Array<{ value: string; label: string }> {
  return codes.length > 0
    ? codes.filter((c) => c.useYn !== "N").map((c) => ({ value: c.codeValue, label: c.codeName }))
    : [...fallback];
}

export function optionLabel(options: ReadonlyArray<{ value: string; label: string }>, value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

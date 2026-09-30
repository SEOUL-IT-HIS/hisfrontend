/**
 * 응급 퇴실 결정 — UC-DISP-01 (Jira UD2-39)
 * 백엔드 DispositionDto / DispositionCreateRequestDto 미러링.
 */
export interface Disposition {
  id: string;
  receptionId: string;
  dispositionTypeCode: string;
  decidedById: string;
  decidedAt: string;
}

/** 백엔드 DispositionCreateRequestDto 미러링 */
export interface DispositionCreateRequest {
  encounterId: string;
  dispositionType: string;
  decidedById?: string;
}

/** 공통코드 그룹 DISPOSITION_TYPE_CD. admin 에 그룹이 없을 때 폴백(값은 숫자 2자리). */
export const DISPOSITION_TYPE_GROUP_CODE = "DISPOSITION_TYPE_CD";

export const DISPOSITION_TYPE_FALLBACK_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  // 귀가
  { value: "01", label: "Home" },
  // 입원
  { value: "02", label: "Admit" },
  // 전원
  { value: "03", label: "Transfer" },
  // 사망
  { value: "04", label: "Death" },
  // 자의퇴원
  { value: "05", label: "Discharge Against Medical Advice" },
];

export interface DispositionState {
  /** 접수 건별 최신 퇴실 결정 (GET ?receptionId= 응답의 첫 건 = 최신) */
  byReceptionId: Record<string, Disposition>;
  loading: boolean;
  error: string;
  submitting: boolean;
  submitError: string;
}

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
  /** 최신 결정을 다른 유형으로 바꿀 수 있는지 — 후속 조치 전(입원요청 없음·거부됨, 전원 소견서 없음)일 때만 true */
  changeable: boolean;
  /**
   * 이 접수의 퇴실 진행 단계(최신 결정에만 내려온다): NONE / OPEN / WAITING_WARD / DONE.
   * DONE 이면 병상 배정·KTAS·활력징후·격리·위험 스크리닝·처방 등록을 화면에서 미리 막는다.
   */
  stage?: string | null;
}

/** 백엔드 DispositionCreateRequestDto 미러링 */
export interface DispositionCreateRequest {
  encounterId: string;
  dispositionType: string;
  decidedById?: string;
}

/** 공통코드 그룹 ER_DISPOSITION_TYPE_CD. admin 에 그룹이 없을 때 폴백(값은 숫자 2자리). */
export const DISPOSITION_TYPE_GROUP_CODE = "ER_DISPOSITION_TYPE_CD";

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

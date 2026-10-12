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
  /** 오접수·중복 접수(06)일 때만: 사유 유형(DUPLICATE / ERRONEOUS), 사유, 중복일 때 남긴 접수 ID */
  voidReasonType?: string | null;
  voidReason?: string | null;
  keptReceptionId?: string | null;
}

/** 백엔드 DispositionCreateRequestDto 미러링 */
export interface DispositionCreateRequest {
  encounterId: string;
  dispositionType: string;
  decidedById?: string;
  /** 오접수·중복 접수(06)일 때만: 사유 유형(필수), 사유(필수, 500자 이내), 중복일 때 남길 접수 ID(선택) */
  voidReasonType?: string;
  voidReason?: string;
  keptReceptionId?: string;
}

/** 퇴실 유형 06 — 오접수·중복 접수. 접수를 닫고 접수 서비스에 알려 접수가 취소 처리한다(최종 결정이라 바꿀 수 없다) */
export const DISPOSITION_VOID_CODE = "06";

/** 오접수·중복 접수의 사유 유형(값은 서버·접수 서비스와 합의한 값) */
export const VOID_REASON_TYPE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "DUPLICATE", label: "Duplicate registration" },
  { value: "ERRONEOUS", label: "Registration error" },
];

/** 사유 글자 수 상한(서버·접수 서비스와 같다) */
export const VOID_REASON_MAX_LENGTH = 500;

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
  // 오접수·중복 접수 (admin 공통코드에 06 이 추가돼야 서버가 받는다)
  { value: "06", label: "Erroneous / duplicate registration" },
];

export interface DispositionState {
  /** 접수 건별 최신 퇴실 결정 (GET ?receptionId= 응답의 첫 건 = 최신) */
  byReceptionId: Record<string, Disposition>;
  loading: boolean;
  error: string;
  submitting: boolean;
  submitError: string;
}

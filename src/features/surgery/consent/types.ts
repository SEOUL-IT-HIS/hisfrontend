/**
 * 수술 동의서 타입 (SL2-42)
 *
 * <p>백엔드 ConsentDto 와 1:1 대응. 시스템은 종이 동의서 원본을 저장하지 않고
 * 동의 여부·서명자·서명일만 관리한다(§21.5). 빈 양식(PDF)은 admin-service
 * 문서양식관리 소관이라 여기서 다루지 않는다.</p>
 */
import type { CodeValue } from "@/features/surgery/types";

/** 동의서 (CONSENT) */
export type Consent = {
  consentId: string;
  surgeryId: string;
  /**
   * 직원(병원관리) 서비스 소유 — 식별자만 보유한다(§21.9)
   *
   * authorStaffIdFk 였던 것을 바꿨다. 컬럼명 author_staff_id_fk 를 그대로
   * 옮긴 이름이었는데, 그 컬럼 자체가 §14.1 FK 규칙(`{참조테이블명}_id`)에서 벗어난
   * 것이라 백엔드에서 author_staff_id 로 정리했다. API 키는 §13 대로 camelCase 다.
   */
  authorStaffId: string | null;
  /** SURG_CONSENT_CD: 01수술/02마취/03비용견적 */
  consentTypeCd: CodeValue;
  /** 서명자 성명 — 이 화면에서 직접 입력받는 원본이라 저장한다(§14.1 예외) */
  signedBy: string;
  /** DATE — yyyy-MM-dd (§14.2 `_dt`) */
  signedDt: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * 동의 확인 기록 (SL2-53)
 *
 * <p>surgeryId 를 보내지 않는 이유 — 경로변수가 우선이라 백엔드가 덮어쓴다.
 * 세 항목은 백엔드 @NotBlank/@NotNull 대상이라 비우면 SUR038 로 거절된다(SL2-218).</p>
 *
 * <p>서명자 관계(signerRelationCd)는 2026-08-10 제거했다 — 프로젝트 범위를
 * "동의 여부 확인"으로 축소하기로 정해졌고, admin 의 RELATION_CD 코드그룹도 함께 내려갔다.
 * 본인/법정대리인 구분은 종이 동의서에서 관리한다(§21.5).</p>
 */
export type CreateConsentRequest = {
  consentTypeCd: CodeValue;
  signedBy: string;
  /** yyyy-MM-dd */
  signedDt: string;
  /** 선택 — 안 보내면 백엔드가 null 로 둔다(§21.9) */
  authorStaffId?: string | null;
};

// ---------------------------------------------------------------------------
// Redux 상태
// ---------------------------------------------------------------------------

/**
 * 동의서 화면 상태
 *
 * <p>consents 는 수술 단위 목록(SL2-54), patientConsents 는 환자 단위 이력(SL2-222)이라
 * 조회 기준이 달라 분리해 둔다.</p>
 */
export type ConsentState = {
  consents: Consent[];
  patientConsents: Consent[];
  loading: boolean;
  saving: boolean;
  /** SUR### 코드 또는 완성 문구 — 노출 직전 resolveSurgeryMessage 로 변환한다(§15.2) */
  error: string;
};

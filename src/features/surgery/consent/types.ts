/**
 * 수술 동의서 타입 (SL2-42)
 *
 * <p>백엔드 ConsentDto 와 1:1 대응. 시스템은 종이 동의서 원본을 저장하지 않고
 * <b>받았는지 여부만</b> 관리한다(§21.5). 빈 양식(PDF)은 admin-service
 * 문서양식관리 소관이라 여기서 다루지 않는다.</p>
 */
import type { CodeValue, YnFlag } from "@/features/surgery/types";

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
  /**
   * 동의서 수령 여부.
   *
   * <p>서명자(signedBy)·서명일(signedDt)을 대신한다(2026-09-03). 종이에 이미 적혀
   * 있는 값을 화면에서 다시 타이핑하게 하고 있었고, 시스템이 실제로 필요한 것은
   * "받았는가" 하나였다. 언제 체크했는지는 createdAt·updatedAt 에 남는다.</p>
   *
   * <p><b>N 인 행이 존재할 수 있다</b> — 체크를 해제하면 행을 지우지 않고 N 으로
   * 둔다(§21.6). 그래서 "동의서가 있다"가 아니라 "signedYn 이 Y 다"로 판단해야 한다.</p>
   */
  signedYn: YnFlag;
  createdAt: string;
  updatedAt: string;
};

/**
 * 동의 확인 기록 (SL2-53) — <b>체크 한 번이 이 요청이다.</b>
 *
 * <p>surgeryId 를 보내지 않는 이유 — 경로변수가 우선이라 백엔드가 덮어쓴다.</p>
 *
 * <p><b>같은 종류를 다시 보내면 갱신된다.</b> 예전에는 중복이면 SUR044 로 거절했는데,
 * 체크를 되돌리는 것이 정상 동작이 되면서 "있으면 갱신"으로 바뀌었다. 그래서 체크와
 * 해제가 같은 요청이고, 같은 값을 두 번 보내도 결과가 같다.</p>
 *
 * <p>서명자 관계(signerRelationCd)는 2026-08-10, 서명자·서명일은 2026-09-03 제거했다.
 * 본인/법정대리인 구분과 서명 시각은 종이 동의서에서 관리한다(§21.5).</p>
 */
export type CreateConsentRequest = {
  consentTypeCd: CodeValue;
  /** 안 보내면 백엔드가 Y 로 본다. 해제할 때만 "N" 을 보낸다 */
  signedYn?: YnFlag;
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

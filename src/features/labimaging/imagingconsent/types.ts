/**
 * 조영제/침습검사 동의(imagingconsent) 타입 — UC-IMG-05 (Jira ZP2-28)
 *
 * 필드명은 백엔드 DTO 를 그대로 미러링한다.
 * - ConsentCreateRequestDto / ConsentSummaryDto / ConsentWithdrawRequestDto
 *   (kr.co.seoulit.his.labimagingservice.imagingconsent.dto)
 *
 * ⚠ 동의 철회는 5차 Phase 9-3 에서 붙었다 (1차 배포 때 이월했던 기능). POST /consents/{id}/withdrawal
 */

/** 동의 등록 요청 — 백엔드 ConsentCreateRequestDto */
export interface ConsentCreateRequest {
  /** 대상 영상오더ID (UUID) */
  imageOrderId: string;
  /** 환자ID (patient-service 내부 식별자, 참조/검증용) */
  patientId: string;
  /** 동의서유형코드 (공통코드 CONSENT_TYPE_CD — 예: CONTRAST, INVASIVE) */
  consentTypeCode: string;
  /** 동의서양식ID (admin-service DOCUMENT_TEMPLATE 논리 참조) */
  documentTemplateId: string;
  /** 동의여부 */
  consentYn: "Y" | "N";
  /** 동의일자 (YYYY-MM-DD) */
  consentDt: string;
  /** 서명자명 (환자 또는 법정대리인) */
  signedByName: string;
  /** 확인자ID */
  witnessId: string;
  /** 거부 사유 — 거부(N)일 때만 서버가 저장한다 (5차 Phase 9-2) */
  refusalNote?: string;
}

/** 동의 철회 요청 (5차 Phase 9-3). 철회일시는 서버 시각, 처리자는 로그인 사용자 */
export interface ConsentWithdrawRequest {
  /** 철회사유코드 (공통코드 CONSENT_WITHDRAW_CD) */
  withdrawnReasonCode: string;
  /** 로그인 세션이 있으면 서버가 무시한다 */
  withdrawnById: string;
}

/** 철회 응답 — code 가 LAB097 이면 "이미 촬영된 영상은 유지" 안내를 보여준다 (D14) */
export interface ConsentWithdrawResult {
  consent: ConsentSummary;
  code: string;
}

/** 동의 요약 (목록/단건 공용) — 백엔드 ConsentSummaryDto */
export interface ConsentSummary {
  consentId: string;
  imageOrderId: string;
  consentTypeCode: string;
  consentYn: "Y" | "N";
  consentDt: string;
  signedByName: string;
  witnessId: string;
  withdrawnYn: "Y" | "N";
  /** 철회 전이면 없음 */
  withdrawnAt?: string;
  /** 철회 전이면 없음 */
  withdrawnReasonCode?: string;
  /** 철회 처리자 — 철회 전이면 없음 */
  withdrawnById?: string;
  /** 거부 사유 — 거부 건만 */
  refusalNote?: string;
}

/** 동의여부 표시용 옵션. 공통코드가 아니라 API 계약상 고정값이라 상수로 둔다. */
export const CONSENT_YN_OPTIONS: ReadonlyArray<{ value: "Y" | "N"; label: string }> = [
  { value: "Y", label: "Consented" },
  { value: "N", label: "Declined" },
];

/**
 * 오더에 유효한 동의가 있는지 판단한다.
 *
 * ⚠ "촬영을 진행해도 되는가"의 최종 판정은 아니다. 어떤 촬영항목이 동의를 필요로 하는지
 *   (IMAGE_ORDER_ITEM 기준)가 아직 정해지지 않았다. 지금은 "받아둔 유효한 동의가 있는가"만 본다.
 *   백엔드 ConsentService.getConsentsByImageOrderId 주석과 같은 기준이다.
 */
export function hasValidConsent(consents: ConsentSummary[]): boolean {
  return consents.some((c) => c.consentYn === "Y" && c.withdrawnYn === "N");
}

/** 동의(imagingconsent) slice 상태 */
export interface ConsentState {
  /** 선택한 오더의 동의 이력 */
  consents: ConsentSummary[];
  consentsLoading: boolean;
  consentsError: string;

  /**
   * consents 가 어느 오더의 것인지.
   *
   * ⚠ 이 값이 없으면 다른 오더를 고른 직후 한 프레임 동안 이전 오더의 이력이 그대로 보인다.
   *   효과(useEffect)는 렌더가 끝난 뒤에 돌아서 resetConsentState 가 첫 렌더를 못 막는다.
   *   동의 화면에서 다른 환자의 "유효한 동의 있음"이 스치면 안 되므로,
   *   화면이 대상 오더와 이 값을 대조해 일치할 때만 판정한다.
   */
  loadedImageOrderId: string | null;

  /** 동의 등록 진행 상태 */
  creating: boolean;
  createError: string;
  /** 마지막 등록 성공 결과 — 성공 안내에 쓴다 */
  lastCreated: ConsentSummary | null;

  /** 동의 철회 진행 상태 (5차 Phase 9-3) */
  withdrawing: boolean;
  withdrawError: string;
  /** 마지막 철회 응답 코드 — LAB093 / LAB097(촬영 영상 유지 안내) */
  lastWithdrawCode: string | null;
  /** 마지막으로 철회된 동의ID — 워크리스트 재조회 키 (배지·단계 갱신) */
  lastWithdrawnConsentId: string | null;
}

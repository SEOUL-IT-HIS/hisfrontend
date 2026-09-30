/**
 * 동의 기록 — 종이 동의서를 받은 사실만 기록한다 (Jira UD2-25)
 * 백엔드 ConsentRecordDto / ConsentRecordCreateRequestDto 미러링. 서명·파일은 저장하지 않는다.
 */
export interface ConsentRecord {
  id: string;
  receptionId: string;
  consentTypeCode: string;
  consentStatusCode: string;
  consentedByCode: string;
  consenterName: string | null;
  reason: string | null;
  receivedAt: string;
  recordedById: string;
  recordedAt: string;
}

/** 백엔드 ConsentRecordCreateRequestDto 미러링 */
export interface ConsentRecordCreateRequest {
  encounterId: string;
  consentTypeCode: string;
  consentStatusCode: string;
  consentedByCode: string;
  consenterName?: string;
  reason?: string;
  receivedAt?: string;
  recordedById: string;
}

/** 공통코드 그룹 (admin 반영 전에는 아래 폴백 사용) */
export const CONSENT_TYPE_GROUP_CODE = "CONSENT_TYPE";
export const CONSENT_STATUS_GROUP_CODE = "CONSENT_STATUS";
export const CONSENT_BY_GROUP_CODE = "CONSENT_BY";

type Option = { value: string; label: string };

export const CONSENT_TYPE_FALLBACK_OPTIONS: ReadonlyArray<Option> = [
  // 수술
  { value: "SURGERY", label: "Surgery" },
  // 마취
  { value: "ANESTHESIA", label: "Anesthesia" },
  // 수혈
  { value: "TRANSFUSION", label: "Transfusion" },
  // 시술
  { value: "PROCEDURE", label: "Procedure" },
  // 개인정보 활용
  { value: "PRIVACY", label: "Personal Data Use" },
];

export const CONSENT_STATUS_FALLBACK_OPTIONS: ReadonlyArray<Option> = [
  // 동의
  { value: "AGREED", label: "Agreed" },
  // 거부
  { value: "REFUSED", label: "Refused" },
  // 유예 (의식불명 등으로 사후 동의 예정)
  { value: "DEFERRED", label: "Deferred" },
];

export const CONSENT_BY_FALLBACK_OPTIONS: ReadonlyArray<Option> = [
  // 본인
  { value: "SELF", label: "Patient" },
  // 보호자
  { value: "GUARDIAN", label: "Guardian" },
];

/** 값에 따라 필수가 되는 입력 (백엔드 검증과 동일) */
export const CONSENT_STATUS_DEFERRED = "DEFERRED";
export const CONSENT_BY_GUARDIAN = "GUARDIAN";

export interface ConsentState {
  items: ConsentRecord[];
  loading: boolean;
  error: string;
  submitting: boolean;
  submitError: string;
}

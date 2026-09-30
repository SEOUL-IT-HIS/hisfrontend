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
export const CONSENT_TYPE_GROUP_CODE = "CONSENT_TYPE_CD";
export const CONSENT_STATUS_GROUP_CODE = "ER_CONSENT_STATUS_CD";
export const CONSENT_BY_GROUP_CODE = "CONSENT_BY_CD";

type Option = { value: string; label: string };

export const CONSENT_TYPE_FALLBACK_OPTIONS: ReadonlyArray<Option> = [
  // 수술
  { value: "01", label: "Surgical Consent" },
  // 마취
  { value: "02", label: "Anesthesia Consent" },
  // 침습적 시술
  { value: "05", label: "Invasive Procedure Consent" },
];

export const CONSENT_STATUS_FALLBACK_OPTIONS: ReadonlyArray<Option> = [
  // 동의
  { value: "01", label: "Agreed" },
  // 거부
  { value: "02", label: "Refused" },
  // 유예 (의식불명 등으로 사후 동의 예정)
  { value: "03", label: "Deferred" },
];

export const CONSENT_BY_FALLBACK_OPTIONS: ReadonlyArray<Option> = [
  // 본인
  { value: "01", label: "Patient" },
  // 보호자
  { value: "02", label: "Guardian" },
];

/** 값에 따라 필수가 되는 입력 (백엔드 검증과 동일) */
export const CONSENT_STATUS_DEFERRED = "03";
export const CONSENT_BY_GUARDIAN = "02";

/** 응급이 쓰는 동의서 종류(admin CONSENT_TYPE_CD 중 01 수술·02 마취·05 침습적 시술) */
export const CONSENT_TYPE_ALLOWED: ReadonlyArray<string> = ["01", "02", "05"];

export interface ConsentState {
  items: ConsentRecord[];
  loading: boolean;
  error: string;
  submitting: boolean;
  submitError: string;
}

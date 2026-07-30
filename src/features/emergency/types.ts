/**
 * emergency 서비스 도메인 공통 API 응답 포맷 (개발표준가이드 11.3)
 * 백엔드 common/ApiResponse.java 와 1:1 대응한다.
 * (참고: kr.co.seoulit.his.emergencyservice.common.ApiResponse)
 *
 * code 는 문자열("SUCCESS" 또는 "EMG_BAD_REQUEST" 등 에러코드)로 내려온다.
 */
export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

/**
 * EMS(119) 이송정보 — UC-TRI-01 (Jira UD2-8)
 * 백엔드 EmsReferralDto 필드를 그대로 미러링한다.
 * (kr.co.seoulit.his.emergencyservice.triage.dto.EmsReferralDto)
 */
export interface EmsReferral {
  id: string;
  receptionNo: string;
  emsAgencyName: string;
  vitalsOnScene: string;
  prehospitalTreatment: string;
  /** LocalDateTime → ISO 8601 문자열 */
  transmittedAt: string;
}

/** EMS 정보 조회 slice 상태 */
export interface EmsInfoState {
  items: EmsReferral[];
  loading: boolean;
  error: string;
  /** 조회 버튼을 한 번이라도 눌렀는지 (초기 진입과 "조회 결과 없음"을 구분) */
  searched: boolean;
}

/**
 * KTAS 등급 분류/재평가 — UC-TRI-02/03 (Jira UD2-9, UD2-43)
 * 백엔드 TriageAssessmentDto 미러링.
 */
export interface TriageAssessment {
  id: string;
  receptionNo: string;
  ktasLevelCode: string;
  /** "INITIAL" | "REASSESS" */
  assessmentTypeCode: string;
  assessedById: string;
  assessedAt: string;
  reason: string;
}

/** 백엔드 KtasCreateRequestDto 미러링 */
export interface KtasCreateRequest {
  patientId?: string;
  encounterId: string;
  ktasScore: string;
  assessmentTypeCode?: string;
  assessedById?: string;
  reason?: string;
}

/** 백엔드 KtasUpdateRequestDto 미러링 — PUT /ktas/{id} (재평가, 이력 신규 행으로 저장됨) */
export interface KtasUpdateRequest {
  ktasScore?: string;
  assessedById?: string;
  reason?: string;
}

/** KTAS 등급 선택 옵션. TODO: ADM commonCodes KTAS_LEVEL 연동 전까지 임시 상수 */
export const KTAS_LEVEL_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "1", label: "1단계 (소생)" },
  { value: "2", label: "2단계 (긴급)" },
  { value: "3", label: "3단계 (응급)" },
  { value: "4", label: "4단계 (준응급)" },
  { value: "5", label: "5단계 (비응급)" },
];

export interface KtasState {
  items: TriageAssessment[];
  loading: boolean;
  error: string;
  searched: boolean;
  submitting: boolean;
  submitError: string;
}

/**
 * 초기 환자상태 평가(활력징후/EWS) — UC-TRI-04 (Jira UD2-10)
 * 백엔드 EwsRecordDto 미러링.
 */
export interface EwsRecord {
  id: string;
  receptionNo: string;
  systolicBp: number | null;
  heartRate: number | null;
  respRate: number | null;
  temperature: number | null;
  spo2: number | null;
  gcs: number | null;
  ewsScore: number | null;
  measuredById: string;
  measuredAt: string;
}

/** 백엔드 VitalAssessmentCreateRequestDto.VitalItemDto 미러링 */
export interface VitalItem {
  systolicBp?: number;
  heartRate?: number;
  respRate?: number;
  temperature?: number;
  spo2?: number;
  gcs?: number;
  ewsScore?: number;
}

/** 백엔드 VitalAssessmentCreateRequestDto 미러링 */
export interface VitalAssessmentCreateRequest {
  encounterId: string;
  measuredById?: string;
  vitals: VitalItem[];
}

export interface VitalsState {
  items: EwsRecord[];
  loading: boolean;
  error: string;
  searched: boolean;
  submitting: boolean;
  submitError: string;
}

/**
 * 감염병 격리 관리 — UC-TRI-05 (Jira UD2-11)
 * 백엔드 IsolationAssessmentDto 미러링.
 */
export interface IsolationAssessment {
  id: string;
  receptionNo: string;
  isolationTypeCode: string;
  requiredYn: string;
  decidedById: string;
  decidedAt: string;
  releasedAt: string | null;
}

/** 백엔드 IsolationCreateRequestDto 미러링 */
export interface IsolationCreateRequest {
  patientId?: string;
  encounterId: string;
  isolationTypeCode: string;
  requiredYn?: "Y" | "N";
  decidedById?: string;
}

/** 격리 유형 옵션. TODO: ADM commonCodes 연동 전까지 임시 상수 (요구사항 명시된 4종) */
export const ISOLATION_TYPE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "CONTACT", label: "접촉주의" },
  { value: "DROPLET", label: "비말주의" },
  { value: "AIRBORNE", label: "공기주의" },
  { value: "PROTECTIVE", label: "역격리(보호격리)" },
];

export interface IsolationState {
  items: IsolationAssessment[];
  loading: boolean;
  error: string;
  searched: boolean;
  submitting: boolean;
  submitError: string;
}

/**
 * 패혈증-뇌졸중 위험도 스크리닝 — UC-TRI-06 (Jira UD2-12)
 * 백엔드 RiskScreeningDto 미러링.
 */
export interface RiskScreening {
  id: string;
  receptionNo: string;
  screeningTypeCode: string;
  score: number | null;
  resultCode: string | null;
  screenedById: string;
  screenedAt: string;
}

/** 백엔드 RiskScreeningCreateRequestDto 미러링 */
export interface RiskScreeningCreateRequest {
  encounterId: string;
  screenType: "SEPSIS" | "STROKE";
  score?: number;
  resultCode?: "NEGATIVE" | "POSITIVE" | "INCONCLUSIVE";
  screenedById?: string;
}

export const SCREEN_TYPE_OPTIONS: ReadonlyArray<{ value: "SEPSIS" | "STROKE"; label: string }> = [
  { value: "SEPSIS", label: "패혈증" },
  { value: "STROKE", label: "뇌졸중" },
];

export const SCREEN_RESULT_OPTIONS: ReadonlyArray<{ value: "NEGATIVE" | "POSITIVE" | "INCONCLUSIVE"; label: string }> = [
  { value: "NEGATIVE", label: "음성" },
  { value: "POSITIVE", label: "양성" },
  { value: "INCONCLUSIVE", label: "판정보류" },
];

export interface RiskScreeningState {
  items: RiskScreening[];
  loading: boolean;
  error: string;
  searched: boolean;
  submitting: boolean;
  submitError: string;
}

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

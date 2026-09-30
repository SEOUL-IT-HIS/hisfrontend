/**
 * 퇴실 후속 조치 — 입원 요청(UC-DISP-02, Jira UD2-40)·전원 소견서(UC-DISP-03, Jira UD2-41)
 * 백엔드 AdmissionRequestDto / TransferNoteDto 미러링. 퇴실 결정(dispositionId)에 붙는다.
 * 입원요청은 응급이 병동으로 직접 Kafka 이벤트를 보내고, 상태는 병동 회신(병상 배정/거부)으로 바뀐다.
 */
export interface AdmissionRequest {
  id: string;
  dispositionId: string;
  targetDeptCode: string | null;
  requestStatusCode: string;
  requestedAt: string;
}

export interface AdmissionCreateRequest {
  /** 진료과(공통코드 DEPT_CD 값) */
  targetDeptCode?: string;
  /** 희망 병동(공통코드 WARD_CD 값) */
  wardPrefer?: string;
}

export interface TransferNote {
  id: string;
  dispositionId: string;
  targetHospitalCode: string;
  content: string;
  writtenById: string;
  writtenAt: string;
}

export interface TransferNoteCreateRequest {
  targetHospitalCode: string;
  content: string;
  writtenById: string;
}

/** 입원요청 상태 폴백 — 공통코드 ADMISSION_REQUEST_STATUS_CD 와 같은 값 */
export const ADMISSION_STATUS_FALLBACK_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "01", label: "Requested" },
  { value: "02", label: "Bed Assigned" },
  { value: "03", label: "Rejected" },
];

/** 전원 대상 병원 폴백(샘플) — 공통코드 TRANSFER_HOSPITAL_CD 와 같은 값 */
export const TRANSFER_HOSPITAL_FALLBACK_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "01", label: "Seoul National University Hospital" },
  { value: "02", label: "Samsung Medical Center" },
  { value: "03", label: "Asan Medical Center" },
  { value: "04", label: "Severance Hospital" },
  { value: "05", label: "Seoul St. Mary's Hospital" },
  { value: "06", label: "Other Hospital" },
];

export interface FollowUpState {
  admissionsByDispositionId: Record<string, AdmissionRequest[]>;
  transfersByDispositionId: Record<string, TransferNote[]>;
  loading: boolean;
  error: string;
  submitting: boolean;
  submitError: string;
}

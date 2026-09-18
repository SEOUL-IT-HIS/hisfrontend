export interface ClinicalNote {
  id: string;
  receptionId: string;
  noteTypeCode: string;
  content: string;
  recordedById: string;
  recordedAt: string;
  signedAt: string | null;
}

export interface ClinicalNoteCreateRequest {
  encounterId: string;
  noteTypeCode: string;
  content: string;
  recordedById: string;
}

/** 백엔드 CareServiceImpl.VALID_NOTE_TYPES 하드코딩 값과 동일 (EMG 내부 전용 분류, admin 공통코드 아님) */
export const NOTE_TYPE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  // 초진
  { value: "INITIAL", label: "Initial Note" },
  // 재평가
  { value: "REASSESSMENT", label: "Reassessment" },
  // 처치
  { value: "PROCEDURE", label: "Procedure" },
  // 컨설트회신
  { value: "CONSULT_REPLY", label: "Consult Reply" },
  // 퇴실요약
  { value: "DISCHARGE_SUMMARY", label: "Discharge Summary" },
];

export interface ClinicalNoteState {
  items: ClinicalNote[];
  loading: boolean;
  error: string;
  searched: boolean;
  submitting: boolean;
  submitError: string;
}

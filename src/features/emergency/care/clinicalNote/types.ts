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

/** 진료기록 종류 폴백 — 공통코드 ER_NOTE_TYPE_CD 와 같은 값(숫자 2자리) */
export const NOTE_TYPE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  // 초진
  { value: "01", label: "Initial Note" },
  // 재평가
  { value: "02", label: "Reassessment" },
  // 처치
  { value: "03", label: "Procedure" },
  // 퇴실요약
  { value: "04", label: "Discharge Summary" },
];

export interface ClinicalNoteState {
  items: ClinicalNote[];
  loading: boolean;
  error: string;
  searched: boolean;
  submitting: boolean;
  submitError: string;
}

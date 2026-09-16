export interface ClinicalNote {
  id: string;
  receptionId: string;
  content: string;
  recordedById: string;
  recordedAt: string;
  signedAt: string | null;
}

export interface ClinicalNoteCreateRequest {
  encounterId: string;
  content: string;
  recordedById: string;
}

export interface ClinicalNoteState {
  items: ClinicalNote[];
  loading: boolean;
  error: string;
  searched: boolean;
  submitting: boolean;
  submitError: string;
}

/**
 * CPR 타임라인 기록 — UC-CARE-05 (Jira UD2-23)
 * 백엔드 CprEventDto / CprTimelineCreateRequestDto 미러링. CPR 한 건(세션)에 이벤트 여러 개가 시간순으로 붙는다.
 */
export interface CprTimelineItem {
  id: string;
  eventAt: string;
  eventTypeCode: string;
  detail: string | null;
  recordedById: string;
}

export interface CprEvent {
  id: string;
  receptionId: string;
  startedAt: string;
  endedAt: string | null;
  outcomeCode: string | null;
  timelines: CprTimelineItem[];
}

export interface CprEventItemRequest {
  eventAt?: string;
  eventTypeCode: string;
  detail?: string;
  recordedById: string;
}

export interface CprCreateRequest {
  encounterId: string;
  outcomeCode?: string;
  events: CprEventItemRequest[];
}

/** CPR 이벤트 종류 폴백 — 공통코드 CPR_EVENT_TYPE_CD 와 같은 값(숫자 2자리) */
export const CPR_EVENT_TYPE_FALLBACK_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "01", label: "Compression" },
  { value: "02", label: "Defibrillation" },
  { value: "03", label: "Medication" },
  { value: "04", label: "Airway" },
  { value: "05", label: "Ventilation" },
  { value: "06", label: "Rhythm Check" },
];

/** CPR 결과 폴백 — 공통코드 CPR_OUTCOME_CD 와 같은 값 */
export const CPR_OUTCOME_FALLBACK_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "01", label: "ROSC" },
  { value: "02", label: "Expired" },
  { value: "03", label: "Transfer" },
];

export interface CprState {
  items: CprEvent[];
  loading: boolean;
  error: string;
  submitting: boolean;
  submitError: string;
}

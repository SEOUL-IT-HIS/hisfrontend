/**
 * 연계 발신 이력 타입 — UC-RST-06 결과전송(ZP2-120) / UC-COM-03 청구 발행(ZP2-124) (5차 Phase 6)
 * 백엔드 interfacelog/send/dto/InterfaceSendLogDto, common/dto/PageResponse 와 1:1.
 */

/** SEND_EVENT_TYPE_CD */
export const SEND_EVENT_TYPE = {
  RESULT: "01",
  BILLING: "02",
} as const;

/** TRANSMIT_STATUS_CD */
export const SEND_STATUS = {
  PENDING: "01",
  SENT: "02",
  FAILED: "03",
} as const;

export interface InterfaceSendLog {
  interfaceSendLogId: string;
  eventTypeCode: string;
  /** 재발행해도 같다 (수신측 멱등키) */
  eventId: string | null;
  /** 결과ID / 검사항목ID / 영상촬영항목ID */
  referenceId: string;
  /** 수신처 (SYSTEM_SOURCE_CD) */
  systemCode: string | null;
  sendStatusCode: string;
  retryCount: number | null;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string | null;
  /** 표시용 — 접수번호(결과) 또는 접수ID(청구) */
  receptionRef: string | null;
  itemCode: string | null;
  /** 원문 JSON — 상세 조회에서만 채워진다 */
  payload: string | null;
}

/** 조회 조건. 모두 선택. from/to 는 yyyy-MM-dd */
export interface InterfaceSendLogSearch {
  eventTypeCode: string;
  sendStatusCode: string;
  from: string;
  to: string;
  /** 0부터 (서버 기준) */
  page: number;
  size: number;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface InterfaceSendLogState {
  search: InterfaceSendLogSearch;
  list: PageResponse<InterfaceSendLog> | null;
  loading: boolean;
  loadError: string;
  detail: InterfaceSendLog | null;
  detailLoading: boolean;
  detailError: string;
  resending: boolean;
  resendError: string;
  /** 재전송 요청이 접수된 이력ID — 화면 안내용 */
  lastResentId: string | null;
}

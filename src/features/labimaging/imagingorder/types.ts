/**
 * 영상(imageOrder) 오더 접수 타입 (UC-IMG-01 / Jira ZP2-19)
 *
 * 필드명은 백엔드 DTO 를 그대로 미러링한다. (요청서 2.2 최우선 원칙)
 * - ImageOrderCreateRequestDto / ImageOrderItemRequestDto / ImageOrderCreateResponseDto
 *   (kr.co.seoulit.his.labimagingservice.imagingorder.dto)
 *   ※ 항목 리스트 필드명은 백엔드와 동일하게 orderItems 를 유지한다.
 *
 * TODO: GR2 처방코어 계약(Q-ROUTE-OWNER/Q-EXAM) 확정 시 Request 필드 재검토
 *       (요청서 1.3 — 현재는 v3 기존 필드 그대로 유지, 계약 확정 후 별도 작업)
 */

/** 촬영항목 (IMAGE_ORDER_ITEM) — 백엔드 ImageOrderItemRequestDto */
export interface ImageOrderItemRequest {
  /** 촬영항목코드 (예: "CT_BRAIN") */
  imageItemCode: string;
}

/** 영상 오더 접수 요청 — 백엔드 ImageOrderCreateRequestDto */
export interface ImageOrderCreateRequest {
  /** 외부시스템 오더 원본번호 (UNIQUE). 서버 채번이 아니라 호출자가 넘기는 필수값 (요청서 1.2) */
  imageOrderNo: string;
  /** 연계시스템코드 (예: "GR2") */
  systemCode: string;
  /** 환자번호 (참조 식별자) */
  patientNo: string;
  /** 처방의번호 (참조 식별자, NULL 허용) */
  physicianNo?: string;
  /** 진료구분코드 (예: "OUTPATIENT") */
  treatTypeCode: string;
  /** 응급여부. API 계약(JSON)은 "Y"/"N" 문자열 유지 (요청서 1.4) */
  urgencyYn: "Y" | "N";
  /** 접수담당자ID */
  receivedById: string;
  /** 촬영항목 목록 (최소 1건) */
  orderItems: ImageOrderItemRequest[];
}

/**
 * 영상 오더 접수 응답 — 백엔드 ImageOrderCreateResponseDto
 * 실제 응답 필드만 정의한다. (요청서 1.4)
 */
export interface ImageOrderCreateResponse {
  imageOrderId: string;
  imageOrderNo: string;
  /** 오더상태코드 — enum 고정 금지, string 유지 (요청서 1.4) */
  orderStatusCode: string;
  imageReceptionId: string;
  receptionNo: string;
  /** 접수상태코드 — string 유지 */
  receptionStatusCode: string;
}

/**
 * 영상 접수 요약 — 백엔드 ImageOrderSummaryDto (목록/단건 공용).
 * - 목록: GET /api/lab-imaging/image-orders/receptions        (미일정 접수 = 일정등록 대상)
 * - 단건: GET /api/lab-imaging/image-orders/receptions/{receptionNo}
 */
export interface ImageReceptionSummary {
  imageOrderId: string;
  imageOrderNo: string;
  patientNo: string;
  orderStatusCode: string;
  imageReceptionId: string;
  receptionNo: string;
  receptionStatusCode: string;
}

/** 영상 오더/접수 slice 상태 */
export interface ImageOrderState {
  creating: boolean;
  createError: string;
  lastCreated: ImageOrderCreateResponse | null;

  /** 접수 목록(미일정) 조회 결과 */
  receptions: ImageReceptionSummary[];
  receptionsLoading: boolean;
  receptionsError: string;

  /** 접수 단건(상세/일정등록 컨텍스트) */
  selectedReception: ImageReceptionSummary | null;
  receptionLoading: boolean;
  receptionError: string;
}

/**
 * ⚠ TREAT_TYPE_OPTIONS 하드코딩 상수는 제거했다. (2026-08-04 — 상세 사유는 laborder/types.ts 참고)
 *   이제 CommonCodeSelect(groupCode="RCPT_TYPE_CD") 으로 admin 에서 직접 불러온다.
 *
 * 응급여부 표시용 옵션 (계약상 "Y"/"N")
 * — 이쪽은 공통코드가 아니라 API 계약상 고정값이라 상수로 유지한다.
 */
export const URGENCY_YN_OPTIONS: ReadonlyArray<{ value: "Y" | "N"; label: string }> = [
  { value: "N", label: "일반" },
  { value: "Y", label: "긴급" },
];

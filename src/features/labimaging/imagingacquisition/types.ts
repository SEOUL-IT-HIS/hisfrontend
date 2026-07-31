/**
 * 영상(imagingAcquisition) 오더 접수 타입 (UC-IMG-01 / Jira ZP2-19)
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

/** 영상 오더 접수 slice 상태 */
export interface ImagingAcquisitionState {
  creating: boolean;
  createError: string;
  lastCreated: ImageOrderCreateResponse | null;
}

/**
 * 진료구분 표시용 임시 옵션.
 * TODO: admin-service 공통코드 조회 API 연동 전 임시값. 연동 후 상수 제거하고 API 로 대체.
 */
export const TREAT_TYPE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "OUTPATIENT", label: "외래" },
  { value: "INPATIENT", label: "입원" },
  { value: "EMERGENCY", label: "응급" },
];

/** 응급여부 표시용 옵션 (계약상 "Y"/"N") */
export const URGENCY_YN_OPTIONS: ReadonlyArray<{ value: "Y" | "N"; label: string }> = [
  { value: "N", label: "일반" },
  { value: "Y", label: "긴급" },
];

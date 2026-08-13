/**
 * 검사(labOrder) 오더 접수 타입 (UC-SPC-01 / Jira ZP2-12)
 *
 * 필드명은 백엔드 DTO 를 그대로 미러링한다. (요청서 2.2 최우선 원칙)
 * - LabOrderCreateRequestDto / LabOrderItemRequestDto / LabOrderCreateResponseDto
 *   (kr.co.seoulit.his.labimagingservice.laborder.dto)
 *
 * TODO: GR2 처방코어 계약(Q-ROUTE-OWNER/Q-EXAM) 확정 시 Request 필드 재검토
 *       (요청서 1.3 — 현재는 v3 기존 필드 그대로 유지, 계약 확정 후 별도 작업)
 */

/** 검사항목 (LAB_ORDER_ITEM) — 백엔드 LabOrderItemRequestDto */
export interface LabOrderItemRequest {
  /** 검사항목코드 (예: "CBC") */
  labItemCode: string;
}

/** 검사 오더 접수 요청 — 백엔드 LabOrderCreateRequestDto */
export interface LabOrderCreateRequest {
  /** 외부시스템 오더 원본번호 (UNIQUE). 서버 채번이 아니라 호출자가 넘기는 필수값 (요청서 1.2) */
  labOrderNo: string;
  /** 연계시스템코드 (예: "GR2") */
  systemCode: string;
  /** 환자번호 (화면 표시용 업무번호) */
  patientNo: string;
  /** 환자ID (patient-service 내부 식별자, 참조/검증용) */
  patientId: string;
  /** 처방의번호 (화면 표시용 업무번호, NULL 허용) */
  physicianNo?: string;
  /** 처방의ID (참조용, 선택) */
  physicianId?: string;
  /** 진료구분코드 (예: "OUTPATIENT") */
  treatTypeCode: string;
  /**
   * 응급여부.
   * 백엔드는 내부적으로 Boolean(YnConverter)이지만 API 계약(JSON)은 "Y"/"N" 문자열 유지 (요청서 1.4)
   */
  urgencyYn: "Y" | "N";
  /** 접수담당자ID */
  receivedById: string;
  /** 검사항목 목록 (최소 1건) */
  orderItems: LabOrderItemRequest[];
}

/**
 * 검사 오더 접수 응답 — 백엔드 LabOrderCreateResponseDto
 * 실제 응답 필드만 정의한다. (요청서 1.4 — Swagger 확정 스펙 대조 후 확정)
 */
export interface LabOrderCreateResponse {
  labOrderId: string;
  labOrderNo: string;
  /** 오더상태코드 — enum 고정 금지, string 유지 (요청서 1.4) */
  orderStatusCode: string;
  labReceptionId: string;
  receptionNo: string;
  /** 접수상태코드 — string 유지 */
  receptionStatusCode: string;
}

/**
 * 검사 접수 요약 — 백엔드 LabOrderSummaryDto (목록/단건 공용).
 * - 목록: GET /api/lab-imaging/lab-orders/receptions        (미일정 접수 = 일정등록 대상)
 * - 단건: GET /api/lab-imaging/lab-orders/receptions/{receptionNo}
 */
export interface LabReceptionSummary {
  labOrderId: string;
  labOrderNo: string;
  patientNo: string;
  orderStatusCode: string;
  labReceptionId: string;
  receptionNo: string;
  receptionStatusCode: string;
}

/** 검사 오더/접수 slice 상태 */
export interface LabOrderState {
  /** 접수 생성 진행 중 여부 */
  creating: boolean;
  /** 접수 생성 실패 메시지 (LAB### 코드 또는 문구) */
  createError: string;
  /** 마지막 생성 성공 결과 */
  lastCreated: LabOrderCreateResponse | null;

  /** 접수 목록(미일정) 조회 결과 */
  receptions: LabReceptionSummary[];
  receptionsLoading: boolean;
  receptionsError: string;

  /** 접수 단건(상세/일정등록 컨텍스트) */
  selectedReception: LabReceptionSummary | null;
  receptionLoading: boolean;
  receptionError: string;
}

/**
 * ⚠ TREAT_TYPE_OPTIONS 하드코딩 상수는 제거했다. (2026-08-04)
 *   admin 에 등록된 RCPT_TYPE_CD 의 실제 코드값은 "01"/"02"/"03"/"04" 인데
 *   여기 있던 임시값은 "OUTPATIENT"/"INPATIENT"/"EMERGENCY" 라 서버 검증(LAB017)에 걸린다.
 *   이제 CommonCodeSelect(groupCode="RCPT_TYPE_CD") 으로 admin 에서 직접 불러온다.
 *
 * 응급여부 표시용 옵션 (계약상 "Y"/"N")
 * — 이쪽은 공통코드가 아니라 API 계약상 고정값이라 상수로 유지한다.
 */
export const URGENCY_YN_OPTIONS: ReadonlyArray<{ value: "Y" | "N"; label: string }> = [
  { value: "N", label: "일반" },
  { value: "Y", label: "긴급" },
];

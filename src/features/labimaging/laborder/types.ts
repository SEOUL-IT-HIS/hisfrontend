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
  /** 검사항목코드 (예: "01") */
  labItemCode: string;
}

/** 검사 오더 접수 요청 — 백엔드 LabOrderCreateRequestDto */
export interface LabOrderCreateRequest {
  /** 외부시스템 오더 원본번호 (UNIQUE). 서버 채번이 아니라 호출자가 넘기는 필수값 (요청서 1.2) */
  labOrderNo: string;
  /** 연계시스템코드 (예: "GR2") */
  systemCode: string;
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

/*
 * LabReceptionSummary(접수 목록 행 타입)는 삭제했다. (2026-08-14)
 * 목록 화면이 워크리스트로 바뀌면서 LabWorklistItem 이 그 자리를 대신한다.
 */

// ============================================================
// 워크리스트 (검사 업무 화면)
// ============================================================

/**
 * 다음에 해야 할 일 — 백엔드 laborder/dto/WorklistStep enum 미러링.
 *
 * ⚠ 프론트에서 계산하지 않는다. "담당자가 바뀌어도 다음에 뭘 해야 할지 목록에서 바로 보인다"가
 *   워크리스트의 목적인데, 판단 규칙이 화면마다 흩어지면 검사 화면과 영상 화면이
 *   서로 다르게 판단하기 시작한다. 서버가 정한 값을 그대로 표시만 한다.
 */
export type WorklistStep =
  | "SCHEDULE"
  | "SPECIMEN"
  | "RECOLLECT"
  | "ACCEPTANCE"
  | "RESULT";

/** 워크리스트 1행 — 백엔드 LabWorklistItemDto */
export interface LabWorklistItem {
  labReceptionId: string;
  receptionNo: string;
  labOrderNo: string;
  /** 환자ID — 화면 표시용이 아니라 하위 작업(검체 등록 등) 요청에 담는 값 */
  patientId: string;
  urgencyYn: "Y" | "N";
  /** 접수일시 — 목록 정렬 기준(오래된 건이 위) */
  receivedAt: string;

  /** 검사 예정일시. 일정 미등록이면 없음 */
  scheduledAt?: string;
  /** 등록된 검체 수 */
  specimenCount: number;
  /** 적합성 판정이 끝난 검체 수 */
  judgedCount: number;
  /** 해소되지 않은 재채취 요청이 있는지 */
  recollectionRequestedYn: "Y" | "N";
  nextStep: WorklistStep;

  /** ACCEPTED = 처리 대상, EXCLUDED = 제외됨 */
  receptionStatusCode: string;
  exclusionReason?: string;
  excludedAt?: string;
}

/**
 * 워크리스트 필터. 백엔드 GET /worklist?receptionStatusCode= 와 대응한다.
 * "ALL" 이면 파라미터를 보내지 않는다.
 */
export type WorklistStatusFilter = "ACCEPTED" | "EXCLUDED" | "ALL";

export const WORKLIST_FILTER_OPTIONS: ReadonlyArray<{
  value: WorklistStatusFilter;
  label: string;
}> = [
  { value: "ACCEPTED", label: "Active" },
  { value: "EXCLUDED", label: "Excluded" },
  { value: "ALL", label: "All" },
];

/** 다음 단계 한글 표시. 백엔드 WorklistStep enum 과 값을 맞춘다. */
export const WORKLIST_STEP_LABELS: Record<WorklistStep, string> = {
  SCHEDULE: "Schedule",
  SPECIMEN: "Specimen",
  RECOLLECT: "Recollection",
  ACCEPTANCE: "Fitness Check",
  RESULT: "Result",
};

/** 접수 제외 요청 — 백엔드 ReceptionExclusionRequestDto */
export interface ReceptionExclusionRequest {
  exclusionReason: string;
}

/** 검사 오더/접수 slice 상태 */
export interface LabOrderState {
  /** 접수 생성 진행 중 여부 */
  creating: boolean;
  /** 접수 생성 실패 메시지 (LAB### 코드 또는 문구) */
  createError: string;
  /** 마지막 생성 성공 결과 */
  lastCreated: LabOrderCreateResponse | null;

  /**
   * 일정 화면으로 넘길 컨텍스트. 목록|상세에서 고른 접수를 재조회 없이 들고 있는다.
   * 표시에 필요한 최소 정보만 담는다.
   */
  selectedReception: LabReceptionContext | null;

  /** 접수 상세 조회 결과 (검사항목 포함) */
  receptionDetail: LabReceptionDetail | null;
  receptionLoading: boolean;
  receptionError: string;

  /** 워크리스트 목록 */
  worklist: LabWorklistItem[];
  worklistLoading: boolean;
  worklistError: string;

  /**
   * 워크리스트에서 선택한 접수번호. 오른쪽 작업 폼이 이 값을 보고 대상을 정한다.
   * 목록 갱신 후에도 선택이 풀리지 않도록 행 객체가 아니라 접수번호만 들고 있는다.
   */
  selectedReceptionNo: string | null;

  /** 제외/복구 처리 상태 */
  exclusionSubmitting: boolean;
  exclusionError: string;
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
  { value: "N", label: "Routine" },
  { value: "Y", label: "Urgent" },
];

/*
 * 일정 등록 여부 필터(ReceptionScheduledFilter / RECEPTION_FILTER_OPTIONS)는 삭제했다. (2026-08-14)
 * 워크리스트는 접수상태(처리 대상/제외됨/전체)로 거르므로 WorklistStatusFilter 를 쓴다.
 * 일정 등록 여부는 필터가 아니라 진행 상태 뱃지로 표시된다.
 *
 * ⚠ 영상(imagingorder)은 아직 워크리스트가 없어 같은 이름의 타입을
 *   features/labimaging/imagingorder/types.ts 에 그대로 두었다.
 */

/**
 * 일정 화면으로 넘길 접수 컨텍스트.
 * 목록(Summary)에서 고르든 상세(Detail)에서 고르든 이 세 값이면 충분해서,
 * 두 타입이 공통으로 확장한다. (selectLabReception 액션의 payload 타입)
 */
export interface LabReceptionContext {
  labReceptionId: string;
  receptionNo: string;
}

/**
 * 검사 접수 상세 — 백엔드 LabReceptionDetailDto
 * 목록(LabReceptionSummary)과 달리 검사항목(labItemCodes)을 담는다.
 */
export interface LabReceptionDetail extends LabReceptionContext {
  /** 환자ID — 표시용이 아니라 환자명을 조회하는 열쇠 */
  patientId: string;
  labOrderNo: string;
  /** 진료구분코드 (공통코드 RCPT_TYPE_CD) */
  treatTypeCode: string;
  urgencyYn: "Y" | "N";
  physicianNo?: string;
  /** 검사항목코드 목록 (공통코드 TEST_TYPE_CD) */
  labItemCodes: string[];
  receivedAt: string;
  /** 검사 예정일시. 일정 미등록이면 없음 */
  scheduledAt?: string;
  /** 오더상태코드 — 서비스 내부 Enum (ORDER_STATUS_LABELS 로 한글 변환) */
  orderStatusCode: string;
  /** 접수상태코드 — 서비스 내부 Enum (RECEPTION_STATUS_LABELS 로 한글 변환) */
  receptionStatusCode: string;
  receivedById: string;
}

/**
 * 오더상태코드 한글 표시.
 * 백엔드 common/status/OrderStatus enum 과 값을 맞춘다. (RECEIVED / COMPLETED / ERROR)
 *
 * ⚠ 공통코드가 아니라 서비스 내부 Enum 이라 admin 조회로는 못 가져온다.
 *   백엔드 enum 에 값이 추가되면 여기도 같이 추가해야 한다.
 */
export const ORDER_STATUS_LABELS: Record<string, string> = {
  RECEIVED: "Received",
  COMPLETED: "Completed",
  ERROR: "Error",
};

/**
 * 접수상태코드 한글 표시.
 * 백엔드 common/status/ReceptionStatus enum 과 값을 맞춘다. (ACCEPTED)
 */
export const RECEPTION_STATUS_LABELS: Record<string, string> = {
  ACCEPTED: "Accepted",
};

/** 코드값을 한글 라벨로. 사전에 없으면 원본 코드를 그대로 보여준다(누락을 숨기지 않기 위함). */
export function toStatusLabel(labels: Record<string, string>, code: string) {
  return labels[code] ?? code;
}

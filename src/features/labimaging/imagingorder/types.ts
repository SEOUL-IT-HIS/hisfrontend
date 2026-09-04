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
  /** 환자ID (patient-service 내부 식별자, 참조/검증용) */
  patientId: string;
  /** 처방의번호 (화면 표시용 업무번호, NULL 허용) */
  physicianNo?: string;
  /** 처방의ID (참조용, 선택) */
  physicianId?: string;
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
export interface ImageReceptionSummary extends ImageReceptionContext {
  imageOrderId: string;
  imageOrderNo: string;
  /**
   * 환자ID (patient-service 내부 식별자).
   * 하위 작업(동의 등록 등)의 요청 본문에 담고, 화면의 환자명 조회에도 쓴다.
   */
  patientId: string;
  orderStatusCode: string;
  imageReceptionId: string;
  receptionNo: string;
  receptionStatusCode: string;
  /** 최종 일정의 촬영 예정일시. 일정 미등록이면 없음(undefined) */
  scheduledAt?: string;
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
  /** 일정 화면으로 넘길 컨텍스트 (검사 쪽과 동일 규약) */
  selectedReception: ImageReceptionContext | null;

  /**
   * 워크리스트에서 고른 행의 접수번호. 빈 문자열이면 선택 없음.
   * ⚠ 위 selectedReception 과 다른 상태다. 합치지 않는 이유는 slice 주석 참고.
   */
  selectedWorklistReceptionNo: string;

  /** 워크리스트 조회 결과 */
  worklist: ImageWorklistItem[];
  worklistLoading: boolean;
  worklistError: string;

  /** 제외/복구 진행 상태 */
  exclusionSubmitting: boolean;
  exclusionError: string;

  /** 접수 상세 조회 결과 (촬영항목 포함) */
  receptionDetail: ImageReceptionDetail | null;
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
  { value: "N", label: "Routine" },
  { value: "Y", label: "Urgent" },
];

/**
 * 접수 목록 필터. 백엔드 GET /receptions?scheduledYn= 파라미터와 대응한다.
 * (검사 쪽 laborder/types.ts 와 동일 규약)
 */
export type ReceptionScheduledFilter = "ALL" | "Y" | "N";

/** 접수 목록 필터 버튼 옵션 */
export const RECEPTION_FILTER_OPTIONS: ReadonlyArray<{
  value: ReceptionScheduledFilter;
  label: string;
}> = [
  { value: "N", label: "Not scheduled" },
  { value: "Y", label: "Scheduled" },
  { value: "ALL", label: "All" },
];

// ============================================================
// 워크리스트 (영상 업무 화면)
// ============================================================

/**
 * 다음에 해야 할 일 — 백엔드 imagingorder/dto/ImageWorklistStep enum 미러링.
 *
 * ⚠ 프론트에서 계산하지 않는다. 서버가 정한 값을 표시만 한다.
 *   판단 규칙이 화면마다 흩어지면 검사 화면과 영상 화면이 서로 다르게 판단하기 시작한다.
 *
 * ⚠ 검사(WorklistStep)와 단계가 다르다. 영상에는 검체가 없어 적합성 판정이 성립하지 않고,
 *   대신 조영제·침습검사 동의가 촬영 앞을 막는 단계로 들어간다.
 */
export type ImageWorklistStep = "SCHEDULE" | "CONSENT" | "ACQUISITION" | "READING";

export const IMAGE_WORKLIST_STEP_LABELS: Record<ImageWorklistStep, string> = {
  SCHEDULE: "Schedule",
  CONSENT: "Consent",
  ACQUISITION: "Acquisition",
  READING: "Reading",
};

/** 워크리스트 1행 — 백엔드 ImageWorklistItemDto */
export interface ImageWorklistItem {
  imageReceptionId: string;
  receptionNo: string;
  imageOrderNo: string;
  /**
   * ⚠ 화면에 표시하는 값이 아니라 동의 작업이 쓰는 열쇠다.
   *   CONSENT 는 접수가 아니라 오더에 붙어서(CONSENT.image_order_id),
   *   ConsentWorkPanel 이 이 값으로 동의를 조회·등록한다.
   */
  imageOrderId: string;
  /** 환자ID — 화면 표시용이 아니라 하위 작업(동의 등록 등) 요청에 담는 값 */
  patientId: string;
  urgencyYn: "Y" | "N";
  /** 접수일시 — 목록 정렬 기준(오래된 건이 위) */
  receivedAt: string;

  /**
   * ⚠ 촬영항목 중 "가장 이른" 예정일시다. (2026-09-03 — 일정이 항목 단위로 바뀜)
   *   목록 한 줄에 시각 하나만 보여줘야 하고, 알고 싶은 건 "이 환자가 언제 오는가"라 첫 촬영 시각이 답이다.
   */
  scheduledAt?: string;
  /** 촬영항목 수 */
  imageItemCount: number;
  /** 일정이 잡힌 촬영항목 수 */
  scheduledItemCount: number;
  /** 유효한(철회되지 않은) 동의가 하나라도 있는지 */
  consentYn: "Y" | "N";
  /** 등록된 영상파일 수. ⚠ 촬영 등록 기능(ZP2-21) 전까지 항상 0 이다. */
  imageFileCount: number;
  nextStep: ImageWorklistStep;

  /** ACCEPTED = 처리 대상, EXCLUDED = 제외됨 */
  receptionStatusCode: string;
  exclusionReason?: string;
  excludedAt?: string;
}

/**
 * 워크리스트 필터. 백엔드 GET /worklist?receptionStatusCode= 와 대응한다.
 * "ALL" 이면 파라미터를 보내지 않는다.
 */
export type ImageWorklistStatusFilter = "ACCEPTED" | "EXCLUDED" | "ALL";

export const IMAGE_WORKLIST_FILTER_OPTIONS: ReadonlyArray<{
  value: ImageWorklistStatusFilter;
  label: string;
}> = [
  { value: "ACCEPTED", label: "Active" },
  { value: "EXCLUDED", label: "Excluded" },
  { value: "ALL", label: "All" },
];

/** 접수 제외 요청 — 백엔드 ReceptionExclusionRequestDto (검사와 같은 DTO 를 쓴다) */
export interface ImageReceptionExclusionRequest {
  exclusionReason: string;
}

/**
 * 일정 화면으로 넘길 접수 컨텍스트. (검사 쪽 laborder/types.ts 와 동일 규약)
 */
export interface ImageReceptionContext {
  imageReceptionId: string;
  receptionNo: string;
}

/**
 * 영상 접수 상세 — 백엔드 ImageReceptionDetailDto
 * 목록(ImageReceptionSummary)과 달리 촬영항목(imageItemCodes)을 담는다.
 */
export interface ImageReceptionDetail extends ImageReceptionContext {
  /** 환자ID — 표시용이 아니라 환자명을 조회하는 열쇠 */
  patientId: string;
  imageOrderNo: string;
  /** 진료구분코드 (공통코드 RCPT_TYPE_CD) */
  treatTypeCode: string;
  urgencyYn: "Y" | "N";
  physicianNo?: string;
  /** 촬영항목코드 목록 (공통코드 IMG_ITEM_CD) */
  imageItemCodes: string[];
  receivedAt: string;
  /** 촬영 예정일시. 일정 미등록이면 없음 */
  scheduledAt?: string;
  orderStatusCode: string;
  receptionStatusCode: string;
  receivedById: string;
}

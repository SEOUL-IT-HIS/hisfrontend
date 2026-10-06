/**
 * 응급 처방(검사·약품) — 처방코어(OPD) 연동 (BFF: /api/emergency/orders)
 * 백엔드 OrderDto / OrderCreateRequestDto / OrderCancelRequestDto / OrderDispatchDto 미러링.
 * 처방 원장은 처방코어가 소유하고 응급은 호출만 한다(처방 내용을 응급 DB에 저장하지 않는다).
 * 영상(방사선) 오더는 처방코어가 받지 않아 제외한다 — 처방 종류는 "검사"·"약품"만 쓴다.
 */
export const ORDER_ITEM_TYPE = {
  LAB: "검사",
  DRUG: "약품",
} as const;

export type OrderItemType = (typeof ORDER_ITEM_TYPE)[keyof typeof ORDER_ITEM_TYPE];

/**
 * 약제(PHM) 전송을 화면에서 쓰는지. 약제 서비스가 이번 범위에서 빠져 false 다 —
 * 전송해도 받는 곳이 없는데 처방코어는 SENT 로 표시해서 약제로 넘어간 것처럼 보인다.
 * 약제 서비스가 돌아오면 백엔드 app.order.pharmacy-enabled 와 함께 true 로 바꾼다.
 * 약품 처방 등록과 투약(MAR) 기록은 이 값과 상관없이 그대로 쓴다.
 */
export const PHARMACY_DISPATCH_ENABLED = false;

export interface OrderItem {
  prescriptionType: string;
  itemCode: string;
  itemName: string;
  dosage?: number | null;
  dosageFormCd?: string | null;
  frequency?: string | null;
  durationDays?: string | null;
  detailInfo?: string | null;
  /** 응답 전용 */
  itemId?: string | null;
  sendStatus?: string | null;
  labOrderId?: string | null;
  /** LAB 이 검사 전송을 거절한 사유(예: 유효하지 않은 환자ID, 이미 접수된 오더) */
  rejectReason?: string | null;
  /** 검사 결과 — 처방코어가 받아 둔 값을 열 때마다 읽어 온다(응급 DB에 저장하지 않는다). 결과가 아직 없으면 비어 있다 */
  resultReportedAt?: string | null;
  resultDetails?: LabResultDetail[] | null;
}

/** 검사 결과 한 줄 */
export interface LabResultDetail {
  seq?: number | null;
  detailCode?: string | null;
  detailName?: string | null;
  resultValue?: string | null;
  resultUnit?: string | null;
  referenceRange?: string | null;
  /** L(낮음) / H(높음) / N(정상) 등 LAB 이 준 값 */
  abnormalFlag?: string | null;
}

export interface Order {
  /** 처방ID(처방코어 prescriptionId, UUID 36자) — 투약·처치 기록의 orderId 로 쓴다 */
  orderId: string;
  /** 접수ID(receptionId). 조회 응답에는 없을 수 있다 */
  encounterId: string | null;
  status: string | null;
  orderMethod: string | null;
  /** 처방방법 이름(예: Electronic / Verbal) — 처방코어가 내려준다 */
  orderMethodName?: string | null;
  priorityCode: string | null;
  timingCode: string | null;
  verbalYn: string | null;
  /** 구두처방을 확정한 일시·의사(확정 뒤에만) */
  verbalConfirmedAt?: string | null;
  verbalConfirmedBy?: string | null;
  prescribedBy: string | null;
  prescribedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  items: OrderItem[] | null;
  /** 처방코어가 알려주는 전송 상태(목록·조회): 검사는 항목 요약, 약제는 처방 단위. PENDING / SENT / FAILED. 검사 항목이 없으면 labSendStatus 는 null */
  labSendStatus: string | null;
  pharmacySendStatus: string | null;
  /** 등록 때 dispatchNow=true 인 경우만: SENT / FAILED / NOT_APPLICABLE */
  labDispatchStatus: string | null;
  pharmacyDispatchStatus: string | null;
}

export interface OrderCreateRequest {
  /** 접수ID(receptionId) */
  encounterId: string;
  prescribedBy: string;
  priorityCode: string;
  timingCode: string;
  /** Y/N — 처방코어가 지원하기 전에는 일반 처방으로 등록된다 */
  verbalYn?: string;
  /** true 면 등록 직후 검사/약제 전송까지 한다 */
  dispatchNow?: boolean;
  items: OrderItem[];
}

export interface OrderCancelRequest {
  cancelReason: string;
  userId: string;
}

/** 약품 검색 결과 — 처방코어 약품 마스터. itemCode 는 마스터의 ediCode(처방 항목 코드로 쓴다) */
export interface MedicationItem {
  itemCode: string;
  itemName: string;
  /** 제형 이름(예: 정제, 주사제) */
  formName: string | null;
  manufacturer: string | null;
  category: string | null;
}

export interface OrderDispatch {
  orderId: string;
  /** LAB / PHARMACY */
  target: string;
  status: string;
}

/** 처방 우선순위 폴백 — 공통코드 ORDER_PRIORITY_CD (STAT = 01) */
export const ORDER_PRIORITY_FALLBACK_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "01", label: "STAT" },
];

/** 처방 시점 폴백 — 공통코드 ORDER_TIMING_CD */
export const ORDER_TIMING_FALLBACK_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "01", label: "Scheduled" },
  { value: "02", label: "As Needed (PRN)" },
  { value: "03", label: "Once" },
];

export const ORDER_ITEM_TYPE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: ORDER_ITEM_TYPE.LAB, label: "Lab Test" },
  { value: ORDER_ITEM_TYPE.DRUG, label: "Drug" },
];

export type OrderListStatus = "loading" | "loaded" | "error";

export interface OrderState {
  /**
   * 접수ID별 처방. 처방코어의 receptionId 목록 조회(items 없는 가벼운 목록)로 채우고,
   * 이 화면에서 등록했거나 단건 조회로 불러온 처방의 항목·전송 결과는 목록을 다시 불러와도 유지한다.
   */
  ordersByReceptionId: Record<string, Order[]>;
  /** 접수별 목록 조회 상태(loading/loaded/error). 아직 안 불러왔으면 키가 없다 */
  listStatusByReception: Record<string, OrderListStatus>;
  listError: string;
  /** 약품 검색 결과(마지막 검색) */
  medications: MedicationItem[];
  medicationsLoading: boolean;
  medicationsError: string;
  submitting: boolean;
  submitError: string;
  /** 취소·전송·조회를 진행 중인 처방ID (없으면 "") */
  busyOrderId: string;
  actionError: string;
}

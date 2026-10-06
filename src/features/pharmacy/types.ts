export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/** 백엔드 Spring Page 응답 (목록 API 공통) */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
}

export interface MedicationDto {
  medicationId: number;
  medicationName: string;
  itemSeq: string | null;
  itemEngName: string | null;
  entpName: string | null;
  etcOtcName: string | null;
  classNo: string | null;
  className: string | null;
  formCodeName: string | null;
  /** admin 공통코드 DOSAGE_FORM_CD 값("01" 알약/캡슐·"02" 수액·"03" 주사) */
  dosageFormCd: string | null;
  chart: string | null;
  itemPermitDate: string | null;
  ediCode: string | null;
  stdCd: string | null;
}

export interface MedicationRegisterRequest {
  medicationName: string;
  itemSeq?: string;
  itemEngName?: string;
  entpName?: string;
  etcOtcName?: string;
  classNo?: string;
  className?: string;
  formCodeName?: string;
  /** admin 공통코드 DOSAGE_FORM_CD 값("01" 알약/캡슐·"02" 수액·"03" 주사) — 필수, 드롭다운으로 선택 */
  dosageFormCd: string;
  chart?: string;
  itemPermitDate?: string;
  ediCode?: string;
  stdCd?: string;
}

export interface Medication {
  medicationId: number;
  medicationName: string;
  itemSeq: string | null;
  itemEngName: string | null;
  entpName: string | null;
  etcOtcName: string | null;
  classNo: string | null;
  className: string | null;
  formCodeName: string | null;
  dosageFormCd: string | null;
  chart: string | null;
  itemPermitDate: string | null;
  ediCode: string | null;
  stdCd: string | null;
}

export type MedicationRegisterForm = MedicationRegisterRequest;

/** 약품 재고 (HL2-5) — GET /api/pharmacy/inventories */
export interface InventoryDto {
  medicationStockId: string;
  medicationId: string;
  medicationName: string | null;
  lotNo: string;
  expirationDt: string | null;
  storageLocationId: string;
  currentQty: number;
}

/** 약품 입고 (HL2-7 조회용) */
export interface ReceiptDto {
  medicationId: string;
  medicationName: string | null;
  lotNo: string;
  expirationDt: string | null;
  receiptDt: string;
  storageLocationId: string;
  supplierId: string;
  quantity: number;
  unitPrice: number | null;
}

/** 약품 입고 등록 — 실제 백엔드(ReceiptController) 요청 형식에 맞춤 */
export interface ReceiptItemRegisterRequest {
  medicationId: string;
  lotNo: string;
  expirationDt: string;
  manufactureDt?: string;
  unitCd: string;
  receiptQty: number;
  unitPrice?: number;
}

export interface ReceiptRegisterRequest {
  supplierId: string;
  storageLocationId: string;
  receiptDt: string;
  receivedById: string;
  items: ReceiptItemRegisterRequest[];
}

/** 약품 출고 (HL2-8 등록 / HL2-9 조회) */
export interface IssuanceDto {
  medicationId: string;
  medicationName: string | null;
  lotNo: string;
  storageLocationId: string;
  quantity: number;
  issuedAt: string;
}

export interface IssuanceRegisterRequest {
  medicationId: string;
  quantity: number;
}

/** 약품 폐기 (HL2-10 관리 / 폐기 조회) */
export interface DisposalDto {
  medicationId: string;
  quantity: number;
  reason: string;
}

export interface DisposalRegisterRequest {
  medicationId: string;
  quantity: number;
  reason: string;
}

/** 처방전 (HL2-17) — GET /api/pharmacy/prescriptions */
export interface PrescriptionListItem {
  prescriptionLinkId: string;
  prescriptionId: string;
  patientId: string;
  physicianId: string;
  departmentId: string;
  createdAt: string;
  /** 처방전 처리 상태 — RECEIVED(접수) / DISPENSED(조제완료) / REJECTED(조제거절) */
  status: string;
}

export interface PrescriptionItem {
  prescriptionItemLinkId: string;
  medicationId: string;
  dosageQty: number;
  dosageFormCd: string;
  /** 활성 조제가 있으면 그 조제상세 ID(반납 처리 때 필요), 조제 전/조제취소된 상태면 null */
  dispensingItemId: string | null;
  /** 실제 조제된 수량. dispensingItemId와 마찬가지로 조제 전이면 null */
  dispensedQty: number | null;
}

/** 불출 상태 요약 — 처방전 상세에서 바로 보여주기 위한 것 */
export interface ReleaseInfo {
  medicationReleaseId: string;
  /** PATIENT(환자 본인) / GUARDIAN(보호자) / WARD(병동) */
  recipientTypeCd: string;
  /** RELEASED(불출됨) / CANCELLED(불출취소됨 — 같은 조제 건으로는 다시 불출 불가) */
  releaseStatusCd: string;
}

export interface PrescriptionDetail extends PrescriptionListItem {
  /** 거절 사유. REJECTED 상태일 때만 값이 있다. */
  rejectReason: string | null;
  items: PrescriptionItem[];
  /** 가장 최근 조제 건의 불출 상태. 조제 전이거나 아직 불출 안 했으면 null */
  release: ReleaseInfo | null;
}

/** 조제거절 — PATCH /api/pharmacy/prescriptions/{id}/reject */
export interface PrescriptionRejectRequest {
  prescriptionLinkId: string;
  reason: string;
}

/** 조제취소 — PATCH /api/pharmacy/prescriptions/{id}/cancel-dispense */
export interface DispensingCancelRequest {
  prescriptionLinkId: string;
  reason: string;
}

/** 불출 처리 (HL2-20) — POST /api/pharmacy/releases */
export interface ReleaseRegisterRequest {
  prescriptionLinkId: string;
  recipientTypeCd: string;
}

export interface ReleaseRegisterResponse {
  medicationReleaseId: string;
}

/**
 * 불출 취소 (HL2-21) — PATCH /api/pharmacy/releases/{id}/cancel
 * prescriptionLinkId는 API 요청 바디에는 안 들어가고, 처리 후 처방전 상세를 다시
 * 불러오기 위해 saga에서만 쓴다.
 */
export interface ReleaseCancelRequest {
  medicationReleaseId: string;
  reason: string;
  prescriptionLinkId: string;
}

/**
 * 반납 처리 (HL2-22) — POST /api/pharmacy/returns
 * prescriptionLinkId는 API 요청 바디에는 안 들어가고, 처리 후 처방전 상세를 다시
 * 불러오기 위해 saga에서만 쓴다.
 */
export interface MedicationReturnRegisterRequest {
  dispensingItemId: string;
  returnQty: number;
  reason: string;
  prescriptionLinkId: string;
}

export interface MedicationReturnRegisterResponse {
  medicationReturnItemId: string;
}

/**
 * 반납약품폐기 (HL2-23) — POST /api/pharmacy/returns/{returnItemId}/disposals
 * prescriptionLinkId는 API 요청 바디에는 안 들어가고, 처리 후 처방전 상세를 다시
 * 불러오기 위해 saga에서만 쓴다.
 */
export interface ReturnedDisposalRegisterRequest {
  medicationReturnItemId: string;
  disposalQty: number;
  reason: string;
  prescriptionLinkId: string;
}

/** 마약류(특수약품) 입고/출고/폐기 — 기존 입고/출고/폐기 요청에 처리자/입회자만 더함 */
export interface ControlledDrugReceiptRequest {
  receipt: ReceiptRegisterRequest;
  staffId: string;
  witnessStaffIds: string[];
}

export interface ControlledDrugIssuanceRequest {
  issuance: IssuanceRegisterRequest;
  staffId: string;
  witnessStaffIds: string[];
}

export interface ControlledDrugDisposalRequest {
  disposal: DisposalRegisterRequest;
  staffId: string;
  witnessStaffIds: string[];
}

/** 마약류 기록 조회 — GET /api/pharmacy/controlled-drugs/records */
export interface ControlledDrugRecordDto {
  controlledDrugRecordId: string;
  inventoryMovementId: string;
  movementQty: number;
  staffId: string;
  /** PHM_STOCK_TX_TYPE 공통코드 값 — 01=입고, 02=출고, 03=폐기 */
  controlledTxCd: string;
  witnessStaffIds: string[];
}

export interface PharmacyState {
  medicationList: Medication[];
  loading: boolean;
  error: string | null;

  importCount: number | null;
  importLoading: boolean;
  importError: string | null;

  inventoryList: InventoryDto[];
  inventoryLoading: boolean;
  inventoryError: string | null;

  receiptList: ReceiptDto[];
  receiptLoading: boolean;
  receiptError: string | null;

  receiptRegisterLoading: boolean;
  receiptRegisterError: string | null;

  issuanceList: IssuanceDto[];
  issuanceLoading: boolean;
  issuanceError: string | null;

  prescriptionList: PrescriptionListItem[];
  prescriptionLoading: boolean;
  prescriptionError: string | null;

  prescriptionDetail: PrescriptionDetail | null;
  prescriptionDetailLoading: boolean;
  prescriptionDetailError: string | null;

  prescriptionActionLoading: boolean;
  prescriptionActionError: string | null;

  disposalLoading: boolean;
  disposalError: string | null;

  releaseLoading: boolean;
  releaseError: string | null;

  returnLoading: boolean;
  returnError: string | null;
  /** 가장 최근에 등록한 반납 건의 ID. 반납약품폐기 단계로 바로 이어가기 위해 잠깐 들고 있는다. */
  lastReturnItemId: string | null;

  controlledDrugRegisterLoading: boolean;
  controlledDrugRegisterError: string | null;

  controlledDrugRecordList: ControlledDrugRecordDto[];
  controlledDrugRecordLoading: boolean;
  controlledDrugRecordError: string | null;
}

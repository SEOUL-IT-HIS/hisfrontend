export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/** 백엔드 Spring Page 응답 (목록 API 공통) */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
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

/** 공급처 마스터 — 입고 등록 화면의 공급처 선택(Select)이 사용 */
export interface SupplierDto {
  supplierId: string;
  supplierName: string;
  contactPhone: string | null;
}

export interface SupplierRegisterRequest {
  supplierName: string;
  contactPhone?: string;
}

/** 보관위치 마스터 — 입고 등록 화면의 보관위치 선택(Select)이 사용 */
export interface StorageLocationDto {
  storageLocationId: string;
  locationName: string;
}

export interface StorageLocationRegisterRequest {
  locationName: string;
}

/** 약품 상세(품목 중심 워크스페이스)의 최근 입출고 내역 — GET /api/pharmacy/inventories/medications/{id}/movements */
export interface InventoryMovementDto {
  inventoryMovementId: string;
  /** PHM_STOCK_TX_TYPE 공통코드 — 01=입고, 02=출고, 03=폐기, 04=조제, 05=조제취소, 06=반납 */
  stockTxTypeCd: string;
  movementQty: number;
  beforeQty: number;
  afterQty: number;
  lotNo: string;
  storageLocationId: string;
  sourceFormTypeCd: string;
  movementAt: string;
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
  /** 처리한 직원 ID(로그인한 사용자). 일반 출고는 필수이고, 마약류 출고는 staffId가 처리자라 비워서 보낸다. */
  issuedById?: string;
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
  /** 처리한 직원 ID(로그인한 사용자). 일반 폐기는 필수이고, 마약류 폐기는 staffId가 처리자라 비워서 보낸다. */
  disposedById?: string;
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
  /** 조제완료 건의 불출 상태 — RELEASED(불출됨) / CANCELLED(불출취소됨) / null(불출 전, 또는 조제완료가 아님) */
  releaseStatusCd: string | null;
}

/** 처방전 목록의 단계 필터 — 백엔드 stage 파라미터 값. ALL이면 전체. */
export type PrescriptionStage =
  | "ALL"
  | "RECEIVED"
  | "DISPENSED"
  | "RELEASED"
  | "RELEASE_CANCELLED"
  | "REJECTED";

export interface PrescriptionListQuery {
  /** 0부터 시작(백엔드 기준) */
  page: number;
  stage: PrescriptionStage;
}

/** 처방항목 하나가 조제될 때 사용된 로트 한 줄(재고가 모자라 여러 로트로 나뉘면 여러 줄). 반납은 이 단위로 처리한다. */
export interface DispensingLot {
  dispensingItemId: string;
  lotNo: string;
  expirationDt: string | null;
  dispensedQty: number;
  /** 이미 반납된 수량 */
  returnedQty: number;
}

export interface PrescriptionItem {
  prescriptionItemLinkId: string;
  medicationId: string;
  medicationName: string | null;
  ediCode: string | null;
  /** 1회 투여량 */
  dosageQty: number;
  dosageFormCd: string;
  frequency: string | null;
  durationDays: string | null;
  detailInfo: string | null;
  /** 조제하면 차감될 예정 수량(1회량 x 횟수 x 일수) */
  expectedQty: number;
  /** true면 횟수/일수를 숫자 하나로 못 읽어 그 구간을 1로 계산한 것 — 사람이 확인해야 한다 */
  qtyAmbiguous: boolean;
  /** 이 약품의 현재 전체 재고 합계 */
  availableQty: number;
  /** 실제 조제된 총 수량. 조제 전이면 null */
  dispensedQty: number | null;
  /** 조제에 사용된 로트별 내역. 조제 전이면 빈 목록 */
  dispensingLots: DispensingLot[];
}

/** 불출 상태 요약 — 처방전 상세에서 바로 보여주기 위한 것 */
export interface ReleaseInfo {
  medicationReleaseId: string;
  /** PATIENT(환자 본인) / GUARDIAN(보호자) / WARD(병동) */
  recipientTypeCd: string;
  /** RELEASED(불출됨) / CANCELLED(불출취소됨 — 같은 조제 건으로는 다시 불출 불가) */
  releaseStatusCd: string;
  releasedAt: string;
  /** 불출을 처리한 약사의 직원 ID. 이전 데이터면 null */
  releasedById: string | null;
  /** 병동 불출 때 받은 병동 직원의 직원 ID */
  receivedById: string | null;
  /** 보호자 불출 때 받은 보호자 이름 */
  guardianName: string | null;
}

export interface PrescriptionDetail extends PrescriptionListItem {
  /** 거절 사유. REJECTED 상태일 때만 값이 있다. */
  rejectReason: string | null;
  items: PrescriptionItem[];
  /** 가장 최근 조제 건의 불출 상태. 조제 전이거나 아직 불출 안 했으면 null */
  release: ReleaseInfo | null;
  /** 조제완료를 처리한 약사의 직원 ID(이전 데이터면 null) */
  dispensedById: string | null;
  /** 조제거절을 처리한 약사의 직원 ID(이전 데이터면 null) */
  rejectedById: string | null;
}

/** 조제완료 — PATCH /api/pharmacy/prescriptions/{id}/dispense */
export interface PrescriptionDispenseRequest {
  prescriptionLinkId: string;
  /** 처리한 약사(로그인한 직원)의 직원 ID */
  actorId: string;
}

/** 조제거절 — PATCH /api/pharmacy/prescriptions/{id}/reject */
export interface PrescriptionRejectRequest {
  prescriptionLinkId: string;
  reason: string;
  actorId: string;
}

/** 조제취소 — PATCH /api/pharmacy/prescriptions/{id}/cancel-dispense */
export interface DispensingCancelRequest {
  prescriptionLinkId: string;
  reason: string;
  actorId: string;
}

/** 불출 처리 (HL2-20) — POST /api/pharmacy/releases */
export interface ReleaseRegisterRequest {
  prescriptionLinkId: string;
  recipientTypeCd: string;
  /** 불출을 처리한 약사(로그인한 직원)의 직원 ID */
  releasedById: string;
  /** 병동(03) 불출일 때 필수 — 약을 받은 병동 직원의 직원 ID */
  receiverId?: string;
  /** 보호자(02) 불출일 때 필수 — 보호자 이름 */
  guardianName?: string;
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
  actorId: string;
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
  actorId: string;
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
  actorId: string;
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
  prescriptionTotalElements: number;
  prescriptionTotalPages: number;
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

  supplierList: SupplierDto[];
  supplierLoading: boolean;
  supplierError: string | null;
  supplierRegisterLoading: boolean;
  supplierRegisterError: string | null;

  storageLocationList: StorageLocationDto[];
  storageLocationLoading: boolean;
  storageLocationError: string | null;
  storageLocationRegisterLoading: boolean;
  storageLocationRegisterError: string | null;

  /** 재고부족 조회 */
  lowStockList: InventoryDto[];
  lowStockLoading: boolean;
  lowStockError: string | null;

  /** 품목 중심 워크스페이스 — 선택한 약품의 재고(로트·보관위치별) */
  medicationStockList: InventoryDto[];
  medicationStockLoading: boolean;
  medicationStockError: string | null;

  /** 품목 중심 워크스페이스 — 선택한 약품의 최근 입출고 내역 */
  medicationMovementList: InventoryMovementDto[];
  medicationMovementLoading: boolean;
  medicationMovementError: string | null;
}

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
}

export interface PrescriptionItem {
  prescriptionItemLinkId: string;
  medicationId: string;
  dosageQty: number;
  dosageFormCd: string;
}

export interface PrescriptionDetail extends PrescriptionListItem {
  items: PrescriptionItem[];
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

  disposalLoading: boolean;
  disposalError: string | null;
}

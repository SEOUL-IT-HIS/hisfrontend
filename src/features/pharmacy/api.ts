import apiClient from "@/lib/axios";
import type {
  ApiResponse,
  ControlledDrugDisposalRequest,
  ControlledDrugIssuanceRequest,
  ControlledDrugReceiptRequest,
  ControlledDrugRecordDto,
  DispensingCancelRequest,
  DisposalRegisterRequest,
  IssuanceDto,
  IssuanceRegisterRequest,
  InventoryDto,
  MedicationDto,
  MedicationRegisterRequest,
  MedicationReturnRegisterRequest,
  MedicationReturnRegisterResponse,
  PageResponse,
  PrescriptionDetail,
  PrescriptionListItem,
  PrescriptionRejectRequest,
  ReceiptDto,
  ReceiptRegisterRequest,
  ReleaseCancelRequest,
  ReleaseRegisterRequest,
  ReleaseRegisterResponse,
  ReturnedDisposalRegisterRequest,
} from "./types";

// 상대경로만 사용. next.config.ts의 /api/pharmacy rewrite가 실제 서버로 전달.
// (PHARMACY_API_ORIGIN 덮어쓰기는 .env.local에서, next.config.ts 쪽에서 함)

/** 약품 목록 */
export async function getMedicationList(): Promise<
  ApiResponse<MedicationDto[]>
> {
  const response = await apiClient.get<ApiResponse<MedicationDto[]>>(
    "/api/pharmacy/admin/medications/list"
  );
  return response.data;
}

/** 약품 등록 */
export async function createMedication(
  request: MedicationRegisterRequest
): Promise<ApiResponse<void>> {
  const response = await apiClient.post<ApiResponse<void>>(
    "/api/pharmacy/admin/medications/register",
    request
  );
  return response.data;
}

/** 공공API 가져오기 */
export async function importMedicationsFromPublicApi(): Promise<
  ApiResponse<number>
> {
  const response = await apiClient.post<ApiResponse<number>>(
    "/api/pharmacy/admin/medications/import"
  );
  return response.data;
}

/** 재고 목록 (HL2-5) */
export async function getInventoryList(): Promise<
  ApiResponse<PageResponse<InventoryDto>>
> {
  const response = await apiClient.get<ApiResponse<PageResponse<InventoryDto>>>(
    "/api/pharmacy/inventories"
  );
  return response.data;
}

/** 입고 목록 (HL2-7) */
export async function getReceiptList(): Promise<ApiResponse<ReceiptDto[]>> {
  const response = await apiClient.get<ApiResponse<ReceiptDto[]>>(
    "/api/pharmacy/receipts"
  );
  return response.data;
}

/** 입고 등록 */
export async function createReceipt(
  request: ReceiptRegisterRequest
): Promise<ApiResponse<void>> {
  const response = await apiClient.post<ApiResponse<void>>(
    "/api/pharmacy/receipts",
    request
  );
  return response.data;
}

/** 출고 목록 (HL2-9) */
export async function getIssuanceList(): Promise<ApiResponse<IssuanceDto[]>> {
  const response = await apiClient.get<ApiResponse<IssuanceDto[]>>(
    "/api/pharmacy/issuances"
  );
  return response.data;
}

/** 출고 등록 (HL2-8) */
export async function createIssuance(
  request: IssuanceRegisterRequest
): Promise<ApiResponse<void>> {
  const response = await apiClient.post<ApiResponse<void>>(
    "/api/pharmacy/issuances",
    request
  );
  return response.data;
}

/** 폐기 등록 (HL2-10) */
export async function createDisposal(
  request: DisposalRegisterRequest
): Promise<ApiResponse<void>> {
  const response = await apiClient.post<ApiResponse<void>>(
    "/api/pharmacy/disposals",
    request
  );
  return response.data;
}

/** 처방전 목록 (HL2-17) */
export async function getPrescriptionList(): Promise<
  ApiResponse<PageResponse<PrescriptionListItem>>
> {
  const response = await apiClient.get<
    ApiResponse<PageResponse<PrescriptionListItem>>
  >("/api/pharmacy/prescriptions");
  return response.data;
}

/** 처방전 상세 (HL2-17) */
export async function getPrescriptionDetail(
  prescriptionLinkId: string
): Promise<ApiResponse<PrescriptionDetail>> {
  const response = await apiClient.get<ApiResponse<PrescriptionDetail>>(
    `/api/pharmacy/prescriptions/${prescriptionLinkId}`
  );
  return response.data;
}

/** 조제완료 (HL2-18) */
export async function dispensePrescription(
  prescriptionLinkId: string
): Promise<ApiResponse<void>> {
  const response = await apiClient.patch<ApiResponse<void>>(
    `/api/pharmacy/prescriptions/${prescriptionLinkId}/dispense`
  );
  return response.data;
}

/** 조제거절 (HL2-18) */
export async function rejectPrescription(
  request: PrescriptionRejectRequest
): Promise<ApiResponse<void>> {
  const response = await apiClient.patch<ApiResponse<void>>(
    `/api/pharmacy/prescriptions/${request.prescriptionLinkId}/reject`,
    { reason: request.reason }
  );
  return response.data;
}

/** 조제취소 (HL2-18) */
export async function cancelDispensePrescription(
  request: DispensingCancelRequest
): Promise<ApiResponse<void>> {
  const response = await apiClient.patch<ApiResponse<void>>(
    `/api/pharmacy/prescriptions/${request.prescriptionLinkId}/cancel-dispense`,
    { reason: request.reason }
  );
  return response.data;
}

/** 불출 처리 (HL2-20) */
export async function createRelease(
  request: ReleaseRegisterRequest
): Promise<ApiResponse<ReleaseRegisterResponse>> {
  const response = await apiClient.post<ApiResponse<ReleaseRegisterResponse>>(
    "/api/pharmacy/releases",
    request
  );
  return response.data;
}

/** 불출 취소 (HL2-21) */
export async function cancelRelease(
  request: ReleaseCancelRequest
): Promise<ApiResponse<void>> {
  const response = await apiClient.patch<ApiResponse<void>>(
    `/api/pharmacy/releases/${request.medicationReleaseId}/cancel`,
    { reason: request.reason }
  );
  return response.data;
}

/** 반납 처리 (HL2-22) */
export async function createMedicationReturn(
  request: MedicationReturnRegisterRequest
): Promise<ApiResponse<MedicationReturnRegisterResponse>> {
  const response = await apiClient.post<ApiResponse<MedicationReturnRegisterResponse>>(
    "/api/pharmacy/returns",
    {
      dispensingItemId: request.dispensingItemId,
      returnQty: request.returnQty,
      reason: request.reason,
    }
  );
  return response.data;
}

/** 반납약품폐기 처리 (HL2-23) */
export async function createReturnedDisposal(
  request: ReturnedDisposalRegisterRequest
): Promise<ApiResponse<void>> {
  const response = await apiClient.post<ApiResponse<void>>(
    `/api/pharmacy/returns/${request.medicationReturnItemId}/disposals`,
    { disposalQty: request.disposalQty, reason: request.reason }
  );
  return response.data;
}

/** 마약류 입고 관리 */
export async function createControlledDrugReceipt(
  request: ControlledDrugReceiptRequest
): Promise<ApiResponse<ControlledDrugRecordDto[]>> {
  const response = await apiClient.post<ApiResponse<ControlledDrugRecordDto[]>>(
    "/api/pharmacy/controlled-drugs/receipts",
    request
  );
  return response.data;
}

/** 마약류 출고 관리 */
export async function createControlledDrugIssuance(
  request: ControlledDrugIssuanceRequest
): Promise<ApiResponse<ControlledDrugRecordDto[]>> {
  const response = await apiClient.post<ApiResponse<ControlledDrugRecordDto[]>>(
    "/api/pharmacy/controlled-drugs/issuances",
    request
  );
  return response.data;
}

/** 마약류 폐기 관리 */
export async function createControlledDrugDisposal(
  request: ControlledDrugDisposalRequest
): Promise<ApiResponse<ControlledDrugRecordDto[]>> {
  const response = await apiClient.post<ApiResponse<ControlledDrugRecordDto[]>>(
    "/api/pharmacy/controlled-drugs/disposals",
    request
  );
  return response.data;
}

/**
 * 특수약품 기록 조회(전체) / 마약류 입고·출고 조회(controlledTxCd로 필터) 공용.
 * controlledTxCd: "01"(입고) | "02"(출고) | "03"(폐기) | undefined(전체)
 */
export async function getControlledDrugRecords(
  controlledTxCd?: string
): Promise<ApiResponse<ControlledDrugRecordDto[]>> {
  const response = await apiClient.get<ApiResponse<ControlledDrugRecordDto[]>>(
    "/api/pharmacy/controlled-drugs/records",
    { params: controlledTxCd ? { controlledTxCd } : undefined }
  );
  return response.data;
}

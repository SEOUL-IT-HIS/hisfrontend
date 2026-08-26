import apiClient from "@/lib/axios";
import type {
  ApiResponse,
  DisposalRegisterRequest,
  IssuanceDto,
  IssuanceRegisterRequest,
  InventoryDto,
  MedicationDto,
  MedicationRegisterRequest,
  PageResponse,
  PrescriptionDetail,
  PrescriptionListItem,
  ReceiptDto,
  ReceiptRegisterRequest,
} from "./types";

const PHARMACY_API_BASE =
  process.env.NEXT_PUBLIC_PHARMACY_API_BASE_URL ?? "http://localhost:8088";

export async function getMedicationList(): Promise<
  ApiResponse<MedicationDto[]>
> {
  const response = await apiClient.get<ApiResponse<MedicationDto[]>>(
    `${PHARMACY_API_BASE}/admin/medications/list`
  );
  return response.data;
}

export async function createMedication(
  request: MedicationRegisterRequest
): Promise<ApiResponse<void>> {
  const response = await apiClient.post<ApiResponse<void>>(
    `${PHARMACY_API_BASE}/admin/medications/register`,
    request
  );
  return response.data;
}

/** 공공API(의약품 낱알식별정보)에서 약품 정보를 가져와 저장/갱신 */
export async function importMedicationsFromPublicApi(): Promise<
  ApiResponse<number>
> {
  const response = await apiClient.post<ApiResponse<number>>(
    `${PHARMACY_API_BASE}/admin/medications/import`
  );
  return response.data;
}

/** 약품 재고 조회 (HL2-5) */
export async function getInventoryList(): Promise<
  ApiResponse<PageResponse<InventoryDto>>
> {
  const response = await apiClient.get<ApiResponse<PageResponse<InventoryDto>>>(
    `${PHARMACY_API_BASE}/api/pharmacy/inventories`
  );
  return response.data;
}

/** 약품 입고 조회 (HL2-7) */
export async function getReceiptList(): Promise<ApiResponse<ReceiptDto[]>> {
  const response = await apiClient.get<ApiResponse<ReceiptDto[]>>(
    `${PHARMACY_API_BASE}/api/pharmacy/receipts`
  );
  return response.data;
}

/** 약품 입고 등록 */
export async function createReceipt(
  request: ReceiptRegisterRequest
): Promise<ApiResponse<void>> {
  const response = await apiClient.post<ApiResponse<void>>(
    `${PHARMACY_API_BASE}/api/pharmacy/receipts`,
    request
  );
  return response.data;
}

/** 약품 출고 조회 (HL2-9) */
export async function getIssuanceList(): Promise<ApiResponse<IssuanceDto[]>> {
  const response = await apiClient.get<ApiResponse<IssuanceDto[]>>(
    `${PHARMACY_API_BASE}/api/pharmacy/issuances`
  );
  return response.data;
}

/** 약품 출고 등록 (HL2-8) */
export async function createIssuance(
  request: IssuanceRegisterRequest
): Promise<ApiResponse<void>> {
  const response = await apiClient.post<ApiResponse<void>>(
    `${PHARMACY_API_BASE}/api/pharmacy/issuances`,
    request
  );
  return response.data;
}

/** 약품 폐기 관리 (HL2-10) */
export async function createDisposal(
  request: DisposalRegisterRequest
): Promise<ApiResponse<void>> {
  const response = await apiClient.post<ApiResponse<void>>(
    `${PHARMACY_API_BASE}/api/pharmacy/disposals`,
    request
  );
  return response.data;
}

/** 처방전 목록조회 (HL2-17) */
export async function getPrescriptionList(): Promise<
  ApiResponse<PageResponse<PrescriptionListItem>>
> {
  const response = await apiClient.get<
    ApiResponse<PageResponse<PrescriptionListItem>>
  >(`${PHARMACY_API_BASE}/api/pharmacy/prescriptions`);
  return response.data;
}

/** 처방전 상세조회 (HL2-17) */
export async function getPrescriptionDetail(
  prescriptionLinkId: string
): Promise<ApiResponse<PrescriptionDetail>> {
  const response = await apiClient.get<ApiResponse<PrescriptionDetail>>(
    `${PHARMACY_API_BASE}/api/pharmacy/prescriptions/${prescriptionLinkId}`
  );
  return response.data;
}

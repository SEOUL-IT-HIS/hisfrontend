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

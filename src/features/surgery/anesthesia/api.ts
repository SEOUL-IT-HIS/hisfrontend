/**
 * 마취기록 API (SL2-3)
 *
 * <p>백엔드 AnesthesiaRecordController(@RequestMapping("/api/v1/surgery")) 와 1:1 대응.
 * 목록·생성은 수술 하위 경로, 단건·활력징후는 마취기록 ID 기준 경로다.</p>
 */
import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/surgery/types";
import type {
  AnesthesiaRecord,
  AppendVitalSignsRequest,
  CreateAnesthesiaRecordRequest,
} from "@/features/surgery/anesthesia/types";

const SURGERY_PATH = "/api/v1/surgery";

/** 해당 수술의 마취기록 목록을 조회한다. (SL2-34) */
export async function getAnesthesiaRecords(
  surgeryId: string,
): Promise<AnesthesiaRecord[]> {
  const { data } = await apiClient.get<ApiResponse<AnesthesiaRecord[]>>(
    `${SURGERY_PATH}/${surgeryId}/anesthesia-records`,
  );
  return data.data;
}

/** 마취기록 단건을 조회한다. */
export async function getAnesthesiaRecord(
  anesthesiaId: string,
): Promise<AnesthesiaRecord> {
  const { data } = await apiClient.get<ApiResponse<AnesthesiaRecord>>(
    `${SURGERY_PATH}/anesthesia-records/${anesthesiaId}`,
  );
  return data.data;
}

/** 마취기록을 생성한다. (SL2-21) */
export async function createAnesthesiaRecord(
  surgeryId: string,
  request: CreateAnesthesiaRecordRequest,
): Promise<AnesthesiaRecord> {
  const { data } = await apiClient.post<ApiResponse<AnesthesiaRecord>>(
    `${SURGERY_PATH}/${surgeryId}/anesthesia-records`,
    request,
  );
  return data.data;
}

/**
 * 활력징후를 기록에 이어붙인다. (SL2-18)
 *
 * <p>전체 교체가 아니라 누적이므로 PATCH 다(§21.8). PUT 으로 보내면 기존 로그가
 * 통째로 사라질 위험이 있어 백엔드도 PATCH 만 열어두었다.</p>
 */
export async function appendVitalSigns(
  anesthesiaId: string,
  request: AppendVitalSignsRequest,
): Promise<AnesthesiaRecord> {
  const { data } = await apiClient.patch<ApiResponse<AnesthesiaRecord>>(
    `${SURGERY_PATH}/anesthesia-records/${anesthesiaId}/vital-signs`,
    request,
  );
  return data.data;
}

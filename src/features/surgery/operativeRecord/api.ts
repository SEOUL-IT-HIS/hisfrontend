/**
 * 수술기록지 API (SL2-51)
 *
 * <p>백엔드 OperativeRecordController(@RequestMapping("/api/surgery")) 와 1:1 대응.
 * 경로가 단수형(operative-record)인 것은 백엔드 계약을 그대로 따른 것이다.</p>
 */
import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/surgery/types";
import type {
  CreateOperativeRecordRequest,
  OperativeRecord,
  UpdateOperativeRecordRequest,
} from "@/features/surgery/operativeRecord/types";

const SURGERY_PATH = "/api/surgery";

/** 해당 수술의 수술기록지 목록을 조회한다. (SL2-57) */
export async function getOperativeRecords(
  surgeryId: string,
): Promise<OperativeRecord[]> {
  const { data } = await apiClient.get<ApiResponse<OperativeRecord[]>>(
    `${SURGERY_PATH}/${surgeryId}/operative-record`,
  );
  return data.data;
}

export async function getOperativeRecord(
  recordId: string,
): Promise<OperativeRecord> {
  const { data } = await apiClient.get<ApiResponse<OperativeRecord>>(
    `${SURGERY_PATH}/operative-record/${recordId}`,
  );
  return data.data;
}

/** 수술기록지를 작성한다. (SL2-55) */
export async function createOperativeRecord(
  surgeryId: string,
  request: CreateOperativeRecordRequest,
): Promise<OperativeRecord> {
  const { data } = await apiClient.post<ApiResponse<OperativeRecord>>(
    `${SURGERY_PATH}/${surgeryId}/operative-record`,
    request,
  );
  return data.data;
}

/**
 * 수술기록지를 수정한다. (SL2-56)
 *
 * <p>확정(02) 상태면 백엔드가 SUR043 으로 거부한다.</p>
 */
export async function updateOperativeRecord(
  recordId: string,
  request: UpdateOperativeRecordRequest,
): Promise<OperativeRecord> {
  const { data } = await apiClient.put<ApiResponse<OperativeRecord>>(
    `${SURGERY_PATH}/operative-record/${recordId}`,
    request,
  );
  return data.data;
}

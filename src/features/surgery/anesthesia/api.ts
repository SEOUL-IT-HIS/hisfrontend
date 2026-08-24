/**
 * 마취기록 API (SL2-3)
 *
 * <p>백엔드 AnesthesiaRecordController(@RequestMapping("/api/surgery")) 와 1:1 대응.
 * 목록·생성은 수술 하위 경로, 단건·활력징후는 마취기록 ID 기준 경로다.</p>
 */
import apiClient from "@/lib/axios";
import type {
  ApiResponse,
  PageParams,
  PageResponse,
} from "@/features/surgery/types";
import type {
  AnesthesiaRecord,
  AppendVitalSignsRequest,
  CreateAnesthesiaRecordRequest,
} from "@/features/surgery/anesthesia/types";

const SURGERY_PATH = "/api/surgery";

/**
 * 해당 수술의 마취기록 목록을 조회한다. (SL2-34 / SL2-246)
 *
 * <p>백엔드가 배열이 아니라 PageResponse 를 돌려주도록 바뀌었다(SL2-246).
 * 호출하는 쪽은 지금까지처럼 배열만 필요하므로 여기서 items 를 꺼내 돌려준다 —
 * saga·slice 는 고치지 않아도 된다.</p>
 *
 * <p>페이지 정보(총 건수·마지막 페이지)가 화면에 필요해지면 이 함수 대신
 * PageResponse 를 그대로 돌려주는 함수를 따로 두고, 그때 saga 를 함께 고친다.
 * 지금 미리 바꾸면 쓰지도 않는 상태를 slice 에 넣게 된다.</p>
 */
export async function getAnesthesiaRecords(
  surgeryId: string,
  params?: PageParams,
): Promise<AnesthesiaRecord[]> {
  const { data } = await apiClient.get<ApiResponse<PageResponse<AnesthesiaRecord>>>(
    `${SURGERY_PATH}/${surgeryId}/anesthesia-records`,
    { params },
  );
  return data.data?.items ?? [];
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

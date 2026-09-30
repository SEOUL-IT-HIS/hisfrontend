import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/emergency/types";
import type {
  AdmissionCreateRequest,
  AdmissionRequest,
  TransferNote,
  TransferNoteCreateRequest,
} from "@/features/emergency/disposition/followup/types";

const DISPOSITIONS_PATH = "/api/emergency/dispositions";

/** 퇴실 결정의 입원요청 이력을 조회한다(최신이 첫 번째). */
export async function getAdmissionRequests(dispositionId: string): Promise<AdmissionRequest[]> {
  const { data } = await apiClient.get<ApiResponse<AdmissionRequest[]>>(
    `${DISPOSITIONS_PATH}/${dispositionId}/admission-requests`,
  );
  return data.data;
}

/** 입원을 요청한다(퇴실 유형 입원만). 병동으로는 Kafka 이벤트로 전달된다. */
export async function createAdmissionRequest(
  dispositionId: string,
  request: AdmissionCreateRequest,
): Promise<AdmissionRequest> {
  const { data } = await apiClient.post<ApiResponse<AdmissionRequest>>(
    `${DISPOSITIONS_PATH}/${dispositionId}/admission-request`,
    request,
  );
  return data.data;
}

/** 퇴실 결정의 전원 소견서를 조회한다(최신이 첫 번째). */
export async function getTransferNotes(dispositionId: string): Promise<TransferNote[]> {
  const { data } = await apiClient.get<ApiResponse<TransferNote[]>>(
    `${DISPOSITIONS_PATH}/${dispositionId}/transfer-notes`,
  );
  return data.data;
}

/** 전원 소견서를 작성한다(퇴실 유형 전원만). */
export async function createTransferNote(
  dispositionId: string,
  request: TransferNoteCreateRequest,
): Promise<TransferNote> {
  const { data } = await apiClient.post<ApiResponse<TransferNote>>(
    `${DISPOSITIONS_PATH}/${dispositionId}/transfer-note`,
    request,
  );
  return data.data;
}

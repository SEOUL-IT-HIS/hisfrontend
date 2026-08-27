import axios from "@/lib/axios";
import type { ConsultationSaveRequest, ConsultationSaveResponse } from "./types";

// 진료기록+처방 동시 등록 후 검사실 전송
export const saveConsultation = async (
    encounterId: string,
    payload: ConsultationSaveRequest
): Promise<ConsultationSaveResponse> => {
    const response = await axios.post(`/api/outpatient/encounters/${encounterId}/consultation`, payload);
    return response.data.data;
};

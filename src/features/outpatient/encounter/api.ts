import axios from "@/lib/axios";
import { EncounterDto, EncounterSearchParams } from "./types";

export const fetchEncounterList = async (
    params: EncounterSearchParams
): Promise<EncounterDto[]> => {
    const response = await axios.get("/api/outpatient/encounters", { params });
    return response.data.data;
};

// 진료 시작 (대기중 -> 진료중). 진료 중인 환자는 접수에서 취소할 수 없다
export const startConsultation = async (encounterId: string): Promise<EncounterDto> => {
    const response = await axios.post(`/api/outpatient/encounters/${encounterId}/start`);
    return response.data.data;
};

// 진료 시작 취소 (진료중 -> 대기중). 진료기록 저장 없이 진료를 그만둘 때 쓴다
export const cancelStartConsultation = async (encounterId: string): Promise<EncounterDto> => {
    const response = await axios.post(`/api/outpatient/encounters/${encounterId}/cancel-start`);
    return response.data.data;
};
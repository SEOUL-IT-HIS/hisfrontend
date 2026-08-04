// features/outpatient/encounter/api.ts
import axios from "@/lib/axios"; // 실제 프로젝트에서 쓰는 axios 인스턴스 경로로 맞춰주세요
import { EncounterDto, EncounterSearchParams } from "./types";

export const fetchEncounterList = async (
    params: EncounterSearchParams
): Promise<EncounterDto[]> => {
    const response = await axios.get("/api/outpatient/encounters", { params });
    return response.data.data; // 백엔드 ApiResponse<{code,message,data}> 래핑 해제
};
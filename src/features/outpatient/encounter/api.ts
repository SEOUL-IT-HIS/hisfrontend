import axios from "@/lib/axios";
import { EncounterDto, EncounterSearchParams } from "./types";

export const fetchEncounterList = async (
    params: EncounterSearchParams
): Promise<EncounterDto[]> => {
    const response = await axios.get("/api/outpatient/encounters", { params });
    return response.data.data;
};
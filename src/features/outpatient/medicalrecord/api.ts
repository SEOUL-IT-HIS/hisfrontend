import axios from "@/lib/axios";
import { MedicalRecordDto, MedicalRecordSearchParams } from "./types";

// 목록 조회 API (params 옵셔널 처리)
export const fetchMedicalRecordList = async (
    params?: MedicalRecordSearchParams
): Promise<MedicalRecordDto[]> => {
    const response = await axios.get("/api/outpatient/records", { params });
    return response.data.data;
};

// 상세 조회 API
export const fetchMedicalRecordDetail = async (
    recordId: string
): Promise<MedicalRecordDto> => {
    const response = await axios.get(`/api/outpatient/records/${recordId}`);
    return response.data.data;
};
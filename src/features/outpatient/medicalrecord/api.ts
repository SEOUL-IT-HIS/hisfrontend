import axios from "@/lib/axios";
import { MedicalRecordCreateParams, MedicalRecordDto, MedicalRecordSearchParams, MedicalRecordUpdateParams } from "./types";

// 목록 조회 API (params 옵셔널 처리)
export const fetchMedicalRecordList = async (
    params?: MedicalRecordSearchParams
): Promise<MedicalRecordDto[]> => {
    const response = await axios.get("/api/outpatient/records", {
        params: {
            keyword: params?.keyword
        }
    });
    return response.data.data;
};

// 상세 조회 API
export const fetchMedicalRecordDetail = async (
    recordId: string
): Promise<MedicalRecordDto> => {
    const response = await axios.get(`/api/outpatient/records/${recordId}`);
    return response.data.data;
};

// 등록 API
export const createMedicalRecord = async (
    params: MedicalRecordCreateParams
): Promise<MedicalRecordDto> => {
    const response = await axios.post("/api/outpatient/records", params);
    return response.data.data;
};

// 수정 API
export const updateMedicalRecord = async (
    recordId: string,
    params: MedicalRecordUpdateParams
): Promise<MedicalRecordDto> => {
    const response = await axios.put(`/api/outpatient/records/${recordId}`, params);
    return response.data.data;
};

// 비활성화 API
export const deactivateMedicalRecord = async (
    recordId: string,
    userId: string
): Promise<void> => {
    await axios.patch(`/api/outpatient/records/${recordId}/deactivate`, null, {
        params: { userId },
    });
};
import axios from "@/lib/axios";
import { MedicationDto, PrescriptionDto, PrescriptionSearchParams } from "./types";

// 처방 목록 조회 API
export const fetchPrescriptionList = async (
    params?: PrescriptionSearchParams
): Promise<PrescriptionDto[]> => {
    const response = await axios.get("/api/outpatient/prescriptions", {
        params: {
            keyword: params?.keyword
        }
    });
    return response.data.data;
};

// 처방 상세 조회 API
export const fetchPrescriptionDetail = async (
    prescriptionId: string
): Promise<PrescriptionDto> => {
    const response = await axios.get(`/api/outpatient/prescriptions/${prescriptionId}`);
    return response.data.data;
};

// 약 검색 API
export const searchMedication = async (name: string): Promise<MedicationDto[]> => {
    const response = await axios.get("/api/outpatient/prescriptions/medications/search", {
        params: { name }
    });
    return response.data.data;
};

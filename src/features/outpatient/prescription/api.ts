import axios from "@/lib/axios";
import { PrescriptionDto, PrescriptionSearchParams } from "./types";

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

// 처방 상세 조회 API (처방 ID 기준)
export const fetchPrescriptionDetail = async (
    prescriptionId: string
): Promise<PrescriptionDto> => {
    const response = await axios.get(`/api/outpatient/prescriptions/${prescriptionId}`);
    return response.data.data;
};

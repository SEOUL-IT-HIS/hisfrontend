import axios from "@/lib/axios";

import type {
    AdmissionRequestCreatePayload,
    AdmissionRequestDto,
    AdmissionRequestPage,
    AdmissionRequestPageParams,
} from "./types";

// 입원요청 목록 조회 — 모든 의사의 요청을 요청일시 최신순으로 페이지 단위로 받는다
export const fetchAdmissionRequestPage = async ({
    requestStatus,
    page,
    size,
}: Omit<AdmissionRequestPageParams, "silent">): Promise<AdmissionRequestPage> => {
    const response = await axios.get("/api/outpatient/admission-requests", {
        params: { requestStatus: requestStatus || undefined, page, size },
    });
    return response.data.data;
};

// 진료별 입원요청 목록 조회 (최근 요청이 먼저)
export const fetchAdmissionRequestList = async (encounterId: string): Promise<AdmissionRequestDto[]> => {
    const response = await axios.get(`/api/outpatient/encounters/${encounterId}/admission-requests`);
    return response.data.data;
};

// 입원요청 등록 — 저장 직후 서버가 병동으로 바로 전송하고, 전송 결과(sendStatus)를 응답에 담아 준다
export const createAdmissionRequest = async (
    encounterId: string,
    payload: AdmissionRequestCreatePayload
): Promise<AdmissionRequestDto> => {
    const response = await axios.post(`/api/outpatient/encounters/${encounterId}/admission-requests`, payload);
    return response.data.data;
};

// 입원요청 재전송 — 전송상태가 FAILED/PENDING 인 요청만 다시 보낸다
export const dispatchAdmissionRequest = async (admissionRequestId: string): Promise<AdmissionRequestDto> => {
    const response = await axios.post(`/api/outpatient/admission-requests/${admissionRequestId}/dispatch`);
    return response.data.data;
};

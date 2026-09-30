import apiClient from "@/lib/axios";
import type {
    PatientContact,
    PatientContactCreateRequest,
    PatientContactItemRequest,
    PatientContactListRequest,
    PatientContactUpdateRequest,
} from "../type/patientContactType";

type ApiResponse<T> = {
    code: number;
    message: string;
    data: T;
};

const baseUrl = (patientId: string) =>
    `/api/patient/${encodeURIComponent(patientId)}/contacts`;

const itemUrl = ({ patientId, contactId }: PatientContactItemRequest) =>
    `${baseUrl(patientId)}/${encodeURIComponent(contactId)}`;

// 목록 조회
export async function fetchPatientContactListApi({
    patientId,
    includeInactive,
}: PatientContactListRequest): Promise<PatientContact[]> {
    const response = await apiClient.get<ApiResponse<PatientContact[]>>(
        baseUrl(patientId),
        { params: { includeInactive } },
    );

    return response.data.data;
}

// 등록
export async function createPatientContactApi({
    patientId,
    zipCode,
    address,
    addressDetail,
    phoneNo,
}: PatientContactCreateRequest): Promise<PatientContact> {
    const response = await apiClient.post<ApiResponse<PatientContact>>(
        baseUrl(patientId),
        {
            zipCode,
            address,
            addressDetail,
            phoneNo,
        },
    );

    return response.data.data;
}

// 수정
export async function updatePatientContactApi(
    request: PatientContactUpdateRequest,
): Promise<PatientContact> {
    const response = await apiClient.patch<ApiResponse<PatientContact>>(
        itemUrl(request),
        {
            zipCode: request.zipCode,
            address: request.address,
            addressDetail: request.addressDetail,
            phoneNo: request.phoneNo,
        },
    );

    return response.data.data;
}

// 대표 주소·연락처 설정
export async function setPrimaryPatientContactApi(
    request: PatientContactItemRequest,
): Promise<PatientContact> {
    const response = await apiClient.patch<ApiResponse<PatientContact>>(
        `${itemUrl(request)}/primary`,
    );

    return response.data.data;
}

// 비활성화
export async function deactivatePatientContactApi(
    request: PatientContactItemRequest,
): Promise<PatientContact> {
    const response = await apiClient.patch<ApiResponse<PatientContact>>(
        `${itemUrl(request)}/deactivate`,
    );

    return response.data.data;
}
import apiClient from "@/lib/axios";
import type {
  Patient,
  PatientDetail,
  PatientDetailApiResponse,
  PatientDuplicateCheckApiResponse,
  PatientDuplicateCheckRequest,
  PatientListApiResponse,
  PatientListItem,
  PatientRegisterApiResponse,
  PatientRegisterRequest,
  PatientSearchCondition,
  PatientUpdateApiResponse,
  PatientUpdateRequest,
  PatientDeactivateApiResponse,
  PatientDeactivateRequest,
  PatientDeathUpdateApiResponse,
  PatientDeathUpdateRequest,
  PatientTemporaryConversionApiResponse,
  PatientTemporaryConversionRequest,
} from "../type/patientType";

/** GET /api/patient/list */
export async function fetchPatientListApi(
  condition: PatientSearchCondition,
): Promise<PatientListItem[]> {
  const response = await apiClient.get<PatientListApiResponse>(
    "/api/patient/list",
    {
      params: {
        patientName: condition.patientName?.trim() || undefined,
        birthDate: condition.birthDate || undefined,
        statusCd: condition.statusCd || undefined,
      },
    },
  );

  return response.data.data;
}

/** GET /api/patient/{patientId} */
export async function fetchPatientDetailApi(
  patientId: string,
): Promise<PatientDetail> {
  const response = await apiClient.get<PatientDetailApiResponse>(
    `/api/patient/${encodeURIComponent(patientId)}`,
  );

  return response.data.data;
}

/** PATCH /api/patient/{patientId} */
export async function updatePatientApi(
  request: PatientUpdateRequest,
): Promise<PatientDetail> {
  const response = await apiClient.patch<PatientUpdateApiResponse>(
    `/api/patient/${encodeURIComponent(request.patientId)}`,
    {
      patientName: request.patientName.trim(),
      zipCode: request.zipCode.trim(),
      address: request.address.trim(),
      addressDetail: request.addressDetail.trim(),
      phoneNo: request.phoneNo.trim(),
    },
  );

  return response.data.data;
}

/** PATCH /api/patient/{patientId}/convert-from-temporary */
export async function convertTemporaryPatientApi(
  request: PatientTemporaryConversionRequest,
): Promise<PatientDetail> {
  const response =
    await apiClient.patch<PatientTemporaryConversionApiResponse>(
      `/api/patient/${encodeURIComponent(
        request.patientId,
      )}/convert-from-temporary`,
      {
        patientName: request.patientName.trim(),
        residentRegNo: request.residentRegNo.trim(),
        birthDate: request.birthDate,
        genderCd: request.genderCd,
      },
    );

  return response.data.data;
}

/** PATCH /api/patient/{patientId}/death-status */
export async function updatePatientDeathApi(
  request: PatientDeathUpdateRequest,
): Promise<PatientDetail> {
  const response = await apiClient.patch<PatientDeathUpdateApiResponse>(
    `/api/patient/${encodeURIComponent(request.patientId)}/death-status`,
    {
      deathYn: request.deathYn,
      deathDtm: request.deathDtm,
    },
  );

  return response.data.data;
}

/** PATCH /api/patient/{patientId}/deactivate */
export async function deactivatePatientApi(
  request: PatientDeactivateRequest,
): Promise<PatientDetail> {
  const response = await apiClient.patch<PatientDeactivateApiResponse>(
    `/api/patient/${encodeURIComponent(request.patientId)}/deactivate`,
  );

  return response.data.data;
}

/** POST /api/patient/register */
export async function registerPatientApi(
  patientData: PatientRegisterRequest,
): Promise<Patient> {
  const response = await apiClient.post<PatientRegisterApiResponse>(
    "/api/patient/register",
    {
      ...patientData,
      patientName: patientData.patientName.trim() || null,
      birthDate: patientData.birthDate || null,
      residentRegNo: patientData.residentRegNo.trim() || null,
      tempRegisterReason:
        patientData.tempPatientYn === "Y"
          ? patientData.tempRegisterReason?.trim() || null
          : null,
    },
  );

  const patient = response.data.data;

  return {
    ...patient,
    birthDate: patient.birthDate ?? "",
  };
}

/** POST /api/patient/duplicate-check */
export async function checkPatientDuplicateApi(
  duplicateCheckData: PatientDuplicateCheckRequest,
): Promise<boolean> {
  const response = await apiClient.post<PatientDuplicateCheckApiResponse>(
    "/api/patient/duplicate-check",
    duplicateCheckData,
  );

  return response.data.data;
}

import apiClient from "@/lib/axios";
import type {
  Patient,
  PatientDuplicateCheckApiResponse,
  PatientDuplicateCheckRequest,
  PatientListApiResponse,
  PatientListItem,
  PatientRegisterApiResponse,
  PatientRegisterRequest,
} from "../type/patientType";

/** GET /api/patient */
export async function fetchPatientListApi(): Promise<PatientListItem[]> {
  const response =
    await apiClient.get<PatientListApiResponse>("/api/patient");

  return response.data.data;
}

/** POST /api/patient/register */
export async function registerPatientApi(
  patientData: PatientRegisterRequest,
): Promise<Patient> {
  const response = await apiClient.post<PatientRegisterApiResponse>(
    "/api/patient/register",
    patientData,
  );

  return response.data.data;
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

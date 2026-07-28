/** patient-service 공통 API 응답 래퍼 */
export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

/** POST /api/patient/register 요청 */
export type PatientRegisterRequest = {
  patientName: string;
  birthDate: string;
  residentRegNo: string;
  statusCd: string;
};

/** POST /api/patient/register 응답 데이터 */
export type Patient = PatientRegisterRequest & {
  patientId: number;
  createdAt: string;
  updatedAt: string;
};

/** POST /api/patient/duplicate-check 요청 */
export type PatientDuplicateCheckRequest = {
  residentRegNo: string;
};

export type PatientRegisterApiResponse = ApiResponse<Patient>;

export type PatientDuplicateCheckApiResponse = ApiResponse<boolean>;

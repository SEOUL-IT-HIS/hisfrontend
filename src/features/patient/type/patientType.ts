/** patient-service 공통 API 응답 래퍼 */
export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

export type PatientStatus = "ACTIVE" | "INACTIVE";
export type GenderCd = "01" | "02" | "03" | "04";

/** POST /api/patient/register 요청 */
export type PatientRegisterRequest = {
  patientName: string;
  birthDate: string;
  residentRegNo: string;
  genderCd: GenderCd;
  statusCd: PatientStatus;
};

/** POST /api/patient/register 응답 데이터 */
export type Patient = {
  patientId: number;
  patientName: string;
  birthDate: string;
  genderCd: GenderCd;
  statusCd: PatientStatus;
  createdAt: string;
};

/** GET /api/patient/list 응답 데이터 */
export type PatientListItem = {
  patientId: number;
  patientName: string;
   /** 마스킹된 주민등록번호 (예: 000813-4******) */
  residentRegNo: string;
  birthDate: string;
  genderCd: GenderCd;
  statusCd: PatientStatus;
  createdAt: string;
  updatedAt: string;
};

/** GET /api/patient/{patientId} 응답 데이터 */
export type PatientDetail = {
  patientId: number;
  patientName: string;
  residentRegNo: string;
  birthDate: string;
  genderCd: GenderCd;
  statusCd: PatientStatus;
  createdAt: string;
  updatedAt: string;
};

/** POST /api/patient/duplicate-check 요청 */
export type PatientDuplicateCheckRequest = {
  residentRegNo: string;
};


export type PatientRegisterApiResponse = ApiResponse<Patient>;

export type PatientDuplicateCheckApiResponse = ApiResponse<boolean>;

export type PatientListApiResponse = ApiResponse<PatientListItem[]>;

export type PatientDetailApiResponse = ApiResponse<PatientDetail>;

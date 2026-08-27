/** patient-service 공통 API 응답 래퍼 */
export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

export type PatientStatus = "ACTIVE" | "INACTIVE";
export type GenderCd = "01" | "02" | "03" | "04";
export type Yn = "Y" | "N";


/** GET /api/patient/list 검색조건 */
export type PatientSearchCondition = {
  patientName?: string;
  birthDate?: string;
  statusCd?: PatientStatus;
};

/** POST /api/patient/register 요청 */
export type PatientRegisterRequest = {
  patientName: string;
  birthDate: string;
  residentRegNo: string;
  genderCd: GenderCd;
  tempPatientYn: Yn;
  zipCode: string;
  address: string;
  addressDetail: string;
  phoneNo: string;
};

/** POST /api/patient/register 응답 데이터 */
export type Patient = {
  patientId: string;
  patientName: string;
  birthDate: string;
  genderCd: GenderCd;
  statusCd: PatientStatus;
  tempPatientYn: Yn;
  zipCode: string | null;
  address: string | null;
  addressDetail: string | null;
  phoneNo: string | null;
  createdAt: string;
};

/** GET /api/patient/list 응답 데이터 */
export type PatientListItem = {
  patientId: string;
  patientName: string;
  /** 마스킹된 주민등록번호 (예: 000813-4******) */
  residentRegNo: string;
  birthDate: string;
  genderCd: GenderCd;
  statusCd: PatientStatus;
  tempPatientYn: Yn;
  deathYn: Yn;
  createdAt: string;
  updatedAt: string;
};

/** GET /api/patient/{patientId} 응답 데이터 */
export type PatientDetail = {
  patientId: string;
  patientName: string;
  residentRegNo: string;
  birthDate: string;
  genderCd: GenderCd;
  statusCd: PatientStatus;
  tempPatientYn: Yn;
  deathYn: Yn;
  deathDtm: string | null;
  zipCode: string | null;
  address: string | null;
  addressDetail: string | null;
  phoneNo: string | null;
  createdAt: string;
  updatedAt: string;
};

/** POST /api/patient/duplicate-check 요청 */
export type PatientDuplicateCheckRequest = {
  residentRegNo: string;
};

/** PATCH /api/patient/{patientId} 요청 */
export type PatientUpdateRequest = {
  patientId: string;
  patientName: string;
  zipCode: string;
  address: string;
  addressDetail: string;
  phoneNo: string;
};

/** PATCH /api/patient/{patientId}/death-status 요청 */
export type PatientDeathUpdateRequest = {
  patientId: string;
  deathYn: Yn;
  deathDtm: string | null;
};

/** PATCH /api/patient/{patientId}/deactivate 요청 */
export type PatientDeactivateRequest = {
  patientId: string;
};

export type PatientRegisterApiResponse = ApiResponse<Patient>;

export type PatientDuplicateCheckApiResponse = ApiResponse<boolean>;

export type PatientListApiResponse = ApiResponse<PatientListItem[]>;

export type PatientDetailApiResponse = ApiResponse<PatientDetail>;

/** PATCH /api/patient/{patientId} 응답 */
export type PatientUpdateApiResponse = ApiResponse<PatientDetail>;

/** PATCH /api/patient/{patientId}/deactivate 응답 */
export type PatientDeactivateApiResponse = ApiResponse<PatientDetail>;

/** PATCH /api/patient/{patientId}/death-status 응답 */
export type PatientDeathUpdateApiResponse = ApiResponse<PatientDetail>;

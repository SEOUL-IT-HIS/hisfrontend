export interface AdmissionDTO{
    admissionId: string;
    patientId: string;
    doctorId: string;
    admissionDate: string;
    admissionRoute: string;
    admissionDeptId: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

export interface Status {
  loading: boolean;
  error: string | null;
  success: boolean;
}

export interface AdmissionState {
  list: AdmissionDTO[];
  detail: AdmissionDTO | null;
  listStatus: Status;
  detailStatus: Status;
  createStatus: Status;
  updateStatus: Status;
  deleteStatus: Status;
   changeStatusStatus: Status;  
}
// ----- bedmanagement 전용 -----

/** 입원 생성 요청 — 서버가 채워주는 필드(admissionId/createdAt/updatedAt) 제외 */
export type RegisterAdmissionRequest = Omit<
  AdmissionDTO,
  "admissionId" | "createdAt" | "updatedAt"
>;

/** 입원 수정 요청 — PUT 경로/바디에 admissionId 필요, createdAt/updatedAt은 서버가 관리 */
export type UpdateAdmissionRequest = Omit<
  AdmissionDTO,
  "createdAt" | "updatedAt"
>;
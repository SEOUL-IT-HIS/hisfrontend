export interface AdmissionDTO{
    admissionId: string;
    patientId: string;
    doctorId: string;
    admissionDate: string;
    admissionRoute: string;
    admissionDeptId: string;
    status: string;
    // 응급 입원요청(Kafka)으로 들어온 건만 값이 있음 — 외래/병동 직접 등록 건은 모두 null
    dispositionId?: string | null;
    encounterId?: string | null;
    wardPref?: string | null;     // 희망 병동 (WARD_CD)
    isolationYn?: string | null;  // 격리 필요 여부 (Y/N)
    requestedBy?: string | null;  // 입원을 요청한 응급 의사 ID
    note?: string | null;         // 요청 메모
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
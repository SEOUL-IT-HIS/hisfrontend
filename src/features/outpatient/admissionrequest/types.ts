// 입원요청 상태코드 (ADM 공통코드 ADMISSION_REQUEST_STATUS_CD)
export const ADMISSION_REQUEST_STATUS = {
    REQUESTED: "01", // 요청됨 (병동 회신 대기)
    BED_ASSIGNED: "02", // 병상 배정
    REJECTED: "03", // 거부
} as const;

// 요청 이벤트 전송상태 (병동으로 보내는 Kafka 발행 결과)
export const ADMISSION_SEND_STATUS = {
    SENT: "SENT",
    FAILED: "FAILED",
} as const;

// 입원요청 (백엔드 AdmissionRequestDto 미러링) — 진료(encounterId)에 붙는다
export interface AdmissionRequestDto {
    admissionRequestId: string;
    patientId: string;
    patientName?: string | null; // 환자명 (입원요청 목록 조회에서만 채워진다)
    encounterId: string;
    admissionDeptCode: string; // 입원 진료과 (DEPT_CD codeValue)
    admissionDeptName: string | null;
    requestNote: string | null;
    requestStatus: string; // ADMISSION_REQUEST_STATUS 값
    requestStatusName: string | null;
    requestedBy: string; // 요청 의사 ID
    requestedAt: string;
    // 병동 회신 전에는 null
    assignedWardCode: string | null; // 배정 병동 (WARD_CD codeValue)
    assignedWardName: string | null;
    rejectReason: string | null;
    respondedAt: string | null;
    sendStatus: string | null; // ADMISSION_SEND_STATUS 값
    sentAt: string | null;
}

// 입원요청 등록 본문 — 둘 다 생략 가능 (진료과를 생략하면 진료를 본 진료과로 요청)
export interface AdmissionRequestCreatePayload {
    admissionDeptCode?: string;
    requestNote?: string;
}

// 입원요청 목록 조회 응답 (백엔드 AdmissionRequestPageDto 중 화면에서 쓰는 값만)
export interface AdmissionRequestPage {
    content: AdmissionRequestDto[];
    totalElements: number; // 조건에 맞는 전체 건수
}

// 입원요청 목록 조회 조건 (모든 의사의 요청, 요청일시 최신순)
export interface AdmissionRequestPageParams {
    requestStatus?: string; // ADMISSION_REQUEST_STATUS 값, 생략하면 전체
    page: number; // 0부터
    size?: number;
    silent?: boolean; // true면 로딩 표시 없이 조용히 갱신 (서버로는 보내지 않는다)
}

export interface AdmissionRequestListParams {
    encounterId: string;
    silent?: boolean; // true면 로딩 표시 없이 조용히 갱신 (서버로는 보내지 않는다)
}

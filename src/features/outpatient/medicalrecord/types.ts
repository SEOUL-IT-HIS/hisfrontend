export interface MedicalRecordDto {
    recordId: string;
    encounterId: string;
    patientId: string;
    patientNo: string | null;
    patientName: string | null;
    chiefComplaint: string | null;
    examinationNote: string | null;
    assessmentNote: string | null;
    planNote: string | null;
    status: string;
    authorId: string;
    createdAt: string;           // ISO String 형태로 전달됨 (예: "2026-08-04T15:38:01")
    updatedAt: string | null;    // 수정된 적 없으면 null일 수 있음
}

// 진료기록 목록 조회 파라미터
export interface MedicalRecordSearchParams {
    encounterId: string;         // 백엔드 @RequestParam 필수값
}
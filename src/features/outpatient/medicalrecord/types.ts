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
    doctorId: string;            // 의사 ID
    doctorName?: string | null;   // 의사명
    departmentName?: string | null; // 진료과명
    createdAt: string;
    updatedAt: string | null;
    fileNames?: string[];       //파일
}

// 진료기록 목록 조회 파라미터
export interface MedicalRecordSearchParams {
    keyword?: string; // 환자명, 환자번호, 주호소 등 통합 검색어
}

// 진료기록 등록 파라미터
export interface MedicalRecordCreateParams {
    encounterId: string;
    chiefComplaint?: string;
    examinationNote?: string;
    assessmentNote?: string;
    planNote?: string;
    fileNames?: string[];       //파일
}

// 진료기록 수정 파라미터
export interface MedicalRecordUpdateParams {
    chiefComplaint?: string;
    examinationNote?: string;
    assessmentNote?: string;
    planNote?: string;
    fileNames?: string[];       //파일
}
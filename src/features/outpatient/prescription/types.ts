// 처방 상세 항목
export interface PrescriptionItemDto {
    itemId: string;             // 상세항목ID
    prescriptionId: string;     // 처방ID
    prescriptionType?: string;  // 처방구분 (약품/검사/수술 등)
    itemCode: string;           // 항목코드
    itemName: string;           // 항목명
    dosage?: string;            // 용량
    frequency?: string;         // 횟수
    durationDays?: string;      // 투약일수
    detailInfo?: string;        // 상세정보
}

// 처방
export interface PrescriptionDto {
    prescriptionId: string;            // 처방ID
    encounterId: string;               // 진료ID
    patientId: string;                 // 환자ID
    patientName?: string | null;       // 환자명
    serviceType?: string | null;       // 진료구분
    status: string;                    // 처방상태
    prescribedAt: string;              // 처방일시
    prescribedBy: string;              // 처방자ID
    cancelledAt?: string | null;       // 취소일시
    cancelReason?: string | null;      // 취소사유
    orderMethod?: string | null;       // 처방유형
    admissionId?: string | null;       // 입원ID

    priorityCode?: string | null;      // 우선순위코드 (ROUTINE/URGENT/STAT)
    timingCode?: string | null;        // 처방패턴코드 (SCHEDULED/PRN/ONCE)
    verbalYn?: string | null;          // 구두처방여부 (Y/N)
    verbalConfirmedAt?: string | null; // 구두처방확정일시
    verbalConfirmedBy?: string | null; // 구두처방확정자ID
    recorderId?: string | null;        // 입력자ID
    holdReason?: string | null;        // 보류사유
    holdBy?: string | null;            // 보류자ID
    holdAt?: string | null;            // 보류일시
    discontinuedReason?: string | null; // 중단사유
    discontinuedBy?: string | null;    // 중단자ID
    discontinuedAt?: string | null;    // 중단일시

    // 목록 조회에는 포함되지 않고(N+1 방지) 상세 조회 시에만 채워짐
    items?: PrescriptionItemDto[] | null;
}

// 처방 목록 조회 파라미터 (환자명/환자ID 통합 검색어)
export interface PrescriptionSearchParams {
    keyword?: string;
}

// 처방 등록 요청
export interface PrescriptionItemInput {
    prescriptionType: string;   // 약품, 검사, 수술
    itemCode: string;
    itemName: string;
    dosage?: string;
    frequency?: string;
    durationDays?: string;
    detailInfo?: string;
}

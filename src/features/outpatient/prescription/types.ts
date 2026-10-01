// 검사결과 항목별 상세 (백엔드 PrescriptionItemDto.ResultDetail)
export interface ExamResultDetail {
    seq: number;                    // 결과 순번
    detailCode?: string | null;     // 결과항목 코드 (RESULT_ITEM_CD)
    detailName?: string | null;     // 결과항목명 (ADM 공통코드, 미등록이면 null)
    resultValue?: string | null;    // 결과값
    resultUnit?: string | null;     // 단위
    referenceRange?: string | null; // 참고범위
    abnormalFlag?: string | null;   // N=정상, H=높음, L=낮음, null=판정불가
}

// 처방 상세 항목
export interface PrescriptionItemDto {
    itemId: string;             // 상세항목ID
    prescriptionId: string;     // 처방ID
    prescriptionType?: string;  // 처방구분 (약품/검사/수술 등)
    itemCode: string;           // 항목코드
    itemName: string;           // 항목명
    dosage?: number;            // 용량 (1회 투여량, 백엔드 Double과 맞춤)
    dosageFormCd?: string;      // 투약 형태 코드
    frequency?: string;         // 횟수
    durationDays?: string;      // 투약일수
    detailInfo?: string;        // 상세정보

    // 검사 전송/결과 (검사 처방 항목에만 값이 있음)
    sendStatus?: string | null;         // 검사실 전송상태 (PENDING/SENT/FAILED)
    sentAt?: string | null;             // 전송 완료 일시
    labOrderId?: string | null;         // 검사오더ID
    rejectReason?: string | null;       // 검사오더 거절/실패 사유
    resultValue?: string | null;        // 검사결과값
    resultUnit?: string | null;         // 결과값 단위
    referenceRange?: string | null;     // 참고범위
    abnormalFlag?: string | null;       // 이상여부 (N/H/L)
    resultReportedAt?: string | null;   // 검사결과 보고(확정) 일시
    resultDetails?: ExamResultDetail[] | null; // 결과항목별 상세 (구형식은 seq=1 한 건)
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

    priorityCode?: string | null;      // 우선순위코드 (ADM 공통코드 ORDER_PRIORITY_CD 의 codeValue)
    priorityName?: string | null;      // 우선순위명 (ADM 공통코드 ORDER_PRIORITY_CD 연동)
    timingCode?: string | null;        // 처방패턴코드 (ADM 공통코드 ORDER_TIMING_CD 의 codeValue)
    timingName?: string | null;        // 처방패턴명 (ADM 공통코드 ORDER_TIMING_CD 연동)
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
    dosage?: number;            // 1회 투여량 (백엔드 Double과 맞춤)
    dosageFormCd?: string;      // 투약 형태 코드
    frequency?: string;
    durationDays?: string;
    detailInfo?: string;
}

//약 검색 결과
export interface MedicationDto {
    medicationId: number;
    medicationName: string;
    itemSeq: string;
    itemEngName?: string | null;
    entpName?: string | null;
    etcOtcName?: string | null;
    classNo?: string | null;
    className?: string | null;
    formCodeName?: string | null;
    chart?: string | null;
    itemPermitDate?: string | null;
    ediCode: string;
    stdCd?: string | null;
}
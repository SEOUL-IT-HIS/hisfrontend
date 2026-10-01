// 외래 처방코어 규칙: 항목 종류는 반드시 이 한글 문자열이어야 외래 전송 로직이 인식함
export const PRESCRIPTION_TYPE_LAB = "검사";
export const PRESCRIPTION_TYPE_MEDICATION = "약품";

// 병동 백엔드가 관리하는 값
export const SEND_STATUS_SENT = "SENT";
export const SEND_STATUS_FAILED = "SEND_FAILED";
export const PRESCRIPTION_STATUS_CANCELLED = "CANCELLED";

// 처방 등록 요청 항목 — 사용자가 입력하는 값만 보냄 (itemId, 전송상태 등은 외래/서버가 채움)
export interface PrescriptionItemCreateDTO {
    prescriptionType: string; // "검사" | "약품"
    itemCode: string;
    itemName: string;
    dosage?: number;
    frequency?: string;
    durationDays?: string;
    detailInfo?: string;
    dosageFormCd?: string;
}

export interface PrescriptionCreateDTO {
    // patientId / prescribedBy / departmentCode는 서버가 입원 건(환자, 주치의, 진료과)으로 채워서 외래로 전달 — 프론트는 안 보냄
    serviceType: string;
    orderMethod: string;
    priorityCode: string;
    timingCode: string;
    items: PrescriptionItemCreateDTO[];
}

export interface PrescriptionItemDTO {
    itemId: string;
    prescriptionId: string;
    prescriptionType: string;
    itemCode: string;
    itemName: string;
    dosage: number;
    frequency: string;
    durationDays: string;
    detailInfo: string;
    sendStatus: string | null;   // SENT / SEND_FAILED (검사실·약제부 전송 결과)
    sentAt: string | null;
    labOrderId: string | null;
    rejectReason: string | null;
    dosageFormCd: string;
    // 검사 결과 (검사서비스 결과 이벤트를 병동이 받아서 채움)
    resultStatus?: string | null;
    resultSummary?: string | null;
    resultReportedAt?: string | null;
}

export interface PrescriptionDTO {
     prescriptionId: string;
    encounterId: string;
    patientId: string;
    patientName: string;
    serviceType: string;
    status: string;
    prescribedAt: Date;
    prescribedBy: string;
    cancelledAt: string | null;
    cancelReason: string | null;
    orderMethod: string;
    admissionId: string;

    priorityCode: string;
    timingCode: string;
    verbalYn: string;
    verbalConfirmedAt: Date;
    verbalConfirmedBy: string;
    recorderId: string;
    holdReason: string;
    holdBy: string;
    holdAt: Date;
    discontinuedReason: string;
    discontinuedBy: string;
    discontinuedAt: Date;

    items: PrescriptionItemDTO[];

    pharmacySendStatus: string;
    pharmacySentAt: Date;
}

export interface Status {
    loading: boolean;
    error: string | null;
    success: boolean;
}

export interface PrescriptionState {
    list: PrescriptionDTO[];
    detail: PrescriptionDTO | null;
    listStatus: Status;
    detailStatus: Status;
    createStatus: Status;
    actionStatus: Status; // 상세 화면의 재전송 / 취소 처리 상태
}

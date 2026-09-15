export interface PrescriptionCreateDTO {
    patientId: string; // 프론트에서는 비워서 보내면 됨 - admissionId로 서버가 채워서 외래로 전달
    serviceType: string;
    orderMethod: string;
    priorityCode: string;
    timingCode: string;
    items: PrescriptionItemDTO[];
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
    sendStatus: string;
    sentAt: Date;
    labOrderId: string;
    rejectReason: string;
    dosageFormCd: string;
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
    cancelledAt: Date;
    cancelReason: string;
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
}
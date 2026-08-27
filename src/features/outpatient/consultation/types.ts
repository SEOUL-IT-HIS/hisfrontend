import type { PrescriptionItemInput } from "@/features/outpatient/prescription/types";

// 진료기록+처방 동시 등록
export interface ConsultationSaveRequest {
    medicalRecord: {
        chiefComplaint?: string;
        examinationNote?: string;
        assessmentNote?: string;
        planNote?: string;
    };
    prescription: {
        serviceType?: string;
        orderMethod?: string;
        priorityCode?: string;
        timingCode?: string;
        items: PrescriptionItemInput[];
    };
}

// 진료실 저장 응답
export interface ConsultationSaveResponse {
    medicalRecord: unknown;
    prescription: unknown;
}

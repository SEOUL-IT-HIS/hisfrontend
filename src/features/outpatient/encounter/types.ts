export interface EncounterDto {
    encounterId: string;
    patientId: string;
    patientNo: string | null;
    patientName: string | null;
    receptionId: string;
    departmentCode: string;
    doctorId: string;
    status: string;
    visitDate: string;   // "YYYY-MM-DD"
    createdAt: string;   // ISO datetime
}

export interface EncounterSearchParams {
    date?: string;
    status?: string;
    departmentCode?: string;
    sort?: string;
}
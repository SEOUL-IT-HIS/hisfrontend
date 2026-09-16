export interface EncounterDto {
    encounterId: string;
    patientId: string;
    patientName: string | null;
    receptionId: string;
    departmentCode: string;
    departmentName: string | null;
    doctorId: string;
    status: string;
    visitDate: string;
    visitReason: string | null;
    createdAt: string;
}

export interface EncounterSearchParams {
    date?: string;
    status?: string;
    departmentCode?: string;
    sort?: string;
}
export interface EncounterDto {
    encounterId: string;
    patientId: string;
    patientName: string | null;
    receptionId: string;
    departmentCode: string;
    doctorId: string;
    status: string;
    visitDate: string;
    createdAt: string;
}

export interface EncounterSearchParams {
    date?: string;
    status?: string;
    departmentCode?: string;
    sort?: string;
}
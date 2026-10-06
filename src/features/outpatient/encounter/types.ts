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
    visitType?: string | null; // 초진/재진 (INITIAL / REVISIT, 기존 데이터는 null)
    receptionType?: string | null; // 예약/당일 (RESERVATION / WALK_IN, 기존 데이터는 null)
    createdAt: string;
}

export interface EncounterSearchParams {
    date?: string;
    status?: string;
    departmentCode?: string;
    sort?: string;
    silent?: boolean; // true면 로딩 표시 없이 조용히 갱신 (서버로는 보내지 않는다)
}
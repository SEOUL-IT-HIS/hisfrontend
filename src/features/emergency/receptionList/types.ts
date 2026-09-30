export type ReceptionListItem = {
    receptionId: string;
    /**
     * 접수서비스(RCP)는 patientId만 보내고 patientName은 안 보낸다(설계상 그렇게 하기로 함).
     * 이름은 patientId로 환자서비스(patient-service)에 배치조회해서 채우기로 돼있는데,
     * 그 연동이 아직 안 붙어서 지금은 null로 온다 — 버그 아니라 예상된 중간 상태.
     */
    patientName: string | null;
    receivedAt: string | null;
    /** KTAS 아직 안 매겨진 접수 건은 null(정상 — "미분류"로 표시). */
    ktasLevelCode: string | null;
    bedNo: string | null;
    zoneCode: string | null;
};

export type ReceptionListState = {
    items: ReceptionListItem[];
    loading: boolean;
    error: string;
};
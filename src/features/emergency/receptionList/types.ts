export type ReceptionListItem = {
    receptionId: string;
    patientName: string;
    /** ReceptionIntake가 등록된 접수 건만 실제값, 그 외엔 null(목록은 여전히 KTAS 기준으로 만들어짐). */
    receivedAt: string | null;
    ktasLevelCode: string;
    bedNo: string | null;
    zoneCode: string | null;
};

export type ReceptionListState = {
    items: ReceptionListItem[];
    loading: boolean;
    error: string;
};
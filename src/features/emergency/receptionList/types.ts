export type ReceptionListItem = {
    receptionId: string;
    patientName: string;
    receivedAt: string;
    ktasLevelCode: string;
};

export type ReceptionListState = {
    items: ReceptionListItem[];
    loading: boolean;
    error: string;
};
export type ReceptionListItem = {
    receptionNo: string;
    patientName: string;
    receivedAt: string;
    ktasLevel: string;
};

export type ReceptionListState = {
    items: ReceptionListItem[];
    loading: boolean;
    error: string;
};
export type PatientContact = {
    contactId: string;
    patientId: string;
    zipCode: string | null;
    address: string | null;
    addressDetail: string | null;
    phoneNo: string | null;
    primaryYn: "Y" | "N";
    activeYn: "Y" | "N";
    createdAt: string;
    updatedAt: string;
};

export type PatientContactListRequest = {
    patientId: string;
    includeInactive?: boolean;
};

export type PatientContactCreateRequest = {
    patientId: string;
    zipCode: string;
    address: string;
    addressDetail: string;
    phoneNo: string;
};

export type PatientContactUpdateRequest =
    PatientContactCreateRequest & {
        contactId: string;
    };

export type PatientContactItemRequest = {
    patientId: string;
    contactId: string;
};
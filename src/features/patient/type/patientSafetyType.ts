export type PatientSafetyInfo = {
  safetyInfoId: string;
  patientId: string;
  safetyNote: string;
  activeYn: "Y" | "N";
  pinnedYn: "Y" | "N";
  createdAt: string;
  updatedAt: string;
};

export type SafetyListRequest = {
  patientId: string;
  includeInactive: boolean;
};

export type SafetyCreateRequest = {
  patientId: string;
  safetyNote: string;
};

export type SafetyUpdateRequest = SafetyCreateRequest & {
  safetyInfoId: string;
};

export type SafetyItemRequest = {
  patientId: string;
  safetyInfoId: string;
};

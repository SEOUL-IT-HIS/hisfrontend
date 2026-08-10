import { networkInterfaces } from "node:os";

export interface VitalSignDTO {
    vitalSignId: string;
    admissionId: string;
    measuredAt: Date;
    temperature: number;
    pulse: number;
    respiration: number;
    bpSystolic: number;
    bpDiastolic: number;
    spo2: number;
    recorderId: number;
    createdAt: Date;
    updatedAt: Date;
}

export type RegisterVitalSignRequest = Omit<
  VitalSignDTO,
  "vitalSignId" | "createdAt" | "updatedAt"
>;


export type UpdateVitalSignRequest = Omit<
  VitalSignDTO,
  "createdAt" | "updatedAt"
>;

export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

export interface Status {
  loading: boolean;
  error: string | null;
  success: boolean;
}

export interface VitalSignState {
  list: VitalSignDTO[];
  detail: VitalSignDTO | null;
  listStatus: Status;
  detailStatus: Status;
  createStatus: Status;
  updateStatus: Status;
  deleteStatus: Status;
  scheduleUpdateStatus: Status;
}
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

export interface VitalSignHistoryDTO {
  vitalSignHistoryId: number;
  vitalSignId: string;
  admissionId: string;
  measuredAt: string;
  temperature: number;
  pulse: number;
  respiration: number;
  bpSystolic: number;
  bpDiastolic: number;
  spo2: number;
  recorderId: number;
  changeType: string;
  changedAt: string;
}

export interface RiskAssessmentDTO {
    patientRiskAssessmentId: string;
     admissionId: string;
     assessmentTypeCd: string;
     score: number;
     riskLevelCd: string;
     assessedAt: Date;
     assessorId: number;
     createdAt: Date;
     updatedAt: Date;
}

export interface RestraintDTO {
  restraintId: string;
  admissionId: string;
  restraintTypeCd: string;
  appliedAt: Date;
  reason: string;
  doctorOrderId: string;
  evaluatorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NursingAssessmentDTO {
  nursingAssessmentId: string;
    admissionId: string;
    allergyYn: string;
    allergyDetail: string;
    pastMedicalHistory: string;
    mentalStatusCd: string;
    assessedAt: Date;
    assessorId: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface IandORecordDTO {
  intakeOutputId: string;
    admissionId: string;
    recordedAt: Date;
    ioTypeCd: string;
    routeCd: string;
    amountMl: number;
    recorderId: number;
    createdAt: Date;
    updatedAt: Date;
}
export type RegisterIandORecordRequest = Omit<
  IandORecordDTO,
  "intakeOutputId" | "createdAt" | "updatedAt"
>;
export type UpdateIandORecordRequest = Omit<
  IandORecordDTO,
  "createdAt" | "updatedAt"
>;
export type RegisterNursingAssessmentRequest = Omit<
  NursingAssessmentDTO,
  "nursingAssessmentId" | "createdAt" | "updatedAt"
>;
export type UpdateNursingAssessmentRequest = Omit<
  NursingAssessmentDTO,
  "createdAt" | "updatedAt"
>;
export type RegisterRestraintRequest = Omit<
  RestraintDTO,
  "restraintId" | "createdAt" | "updatedAt"
>;

export type UpdateRestraintRequest = Omit<
  RestraintDTO,
  "createdAt" | "updatedAt"
>;

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
  history: VitalSignHistoryDTO[];
  historyStatus: Status;
}
export type RegisterRiskAssessmentRequest = Omit<
  RiskAssessmentDTO,
  "patientRiskAssessmentId" | "createdAt" | "updatedAt"
>;

export type UpdateRiskAssessmentRequest = Omit<
  RiskAssessmentDTO,
  "createdAt" | "updatedAt"
>;

export interface RiskAssessmentState {
  list: RiskAssessmentDTO[];
  detail: RiskAssessmentDTO | null;
  listStatus: Status;
  detailStatus: Status;
  createStatus: Status;
  updateStatus: Status;
  deleteStatus: Status;
}

export interface RestraintState {
  list: RestraintDTO[];
  detail: RestraintDTO | null;
  listStatus: Status;
  detailStatus: Status;
  createStatus: Status;
  updateStatus: Status;
  deleteStatus: Status;
}
export interface NursingAssessmentState {
  list: NursingAssessmentDTO[];
  detail: NursingAssessmentDTO | null;
  listStatus: Status;
  detailStatus: Status;
  createStatus: Status;
  updateStatus: Status;
  deleteStatus: Status;
}
export interface IandORecordState {
  list: IandORecordDTO[];
  detail: IandORecordDTO | null;
  listStatus: Status;
  detailStatus: Status;
  createStatus: Status;
  updateStatus: Status;
  deleteStatus: Status;
}
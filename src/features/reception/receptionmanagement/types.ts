export type ReceptionType = "INITIAL" | "REVISIT";

export interface ReceptionListItem {
  receptionId: string;
  patientId: string;
  patientName: string;
  deptId: string;
  deptName: string;
  doctorId: string;
  doctorName: string;
  receptionType: ReceptionType;
  receptionDate: string;
  status: string;
}

export interface ReceptionDetail extends ReceptionListItem {
  memo: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReceptionListQuery {
  receptionDate?: string;
  keyword?: string;
}

export interface ReceptionRegisterRequest {
  patientId: string;
  deptId: string;
  doctorId: string;
  receptionType: ReceptionType;
  memo: string;
}

export interface ReceptionCancelRequest {
  receptionId: string;
  cancelReasonCode: string;
  cancelReasonDetail?: string;
  cancelledBy: string;
}

export interface DepartmentOption {
  deptId: string;
  deptName: string;
}

export interface DoctorOption {
  doctorId: string;
  doctorName: string;
  deptId: string;
}

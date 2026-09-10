// "EMERGENCY" 는 응급 접수(POST /api/reception/emergency) 등록 시 백엔드가 저장하는 값이다.
// 목록 조회(GET /api/reception)는 접수유형과 무관하게 전체를 내려주므로, 응급 접수 목록 화면에서
// 같은 목록을 재사용해 receptionType === "EMERGENCY" 로 필터링한다.
export type ReceptionType = "INITIAL" | "REVISIT" | "EMERGENCY";

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

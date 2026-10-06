// "EMERGENCY" 는 응급 접수(POST /api/reception/emergency) 등록 시 백엔드가 저장하는 값이다.
// 목록 조회(GET /api/reception)는 접수유형과 무관하게 전체를 내려주므로, 응급 접수 목록 화면에서
// 같은 목록을 재사용해 receptionType === "EMERGENCY" 로 필터링한다.
// 외래 접수는 RESERVATION(예약) / WALK_IN(당일).
export type ReceptionType = "RESERVATION" | "WALK_IN" | "EMERGENCY";

// 초진/재진 — 신규환자등록으로 들어온 환자는 INITIAL(초진), 환자검색으로 고른 환자는 REVISIT(재진).
// 응급 접수는 구분이 없어 null.
export type VisitType = "INITIAL" | "REVISIT";

export interface ReceptionListItem {
  receptionId: string;
  patientId: string;
  patientName: string;
  deptId: string;
  deptName: string;
  doctorId: string;
  doctorName: string;
  receptionType: ReceptionType;
  visitType: VisitType | null;
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
  visitType: VisitType;
  /** 예약 목록의 "접수하기"로 들어온 경우 그 예약ID — 있으면 서버가 접수유형을 예약으로 저장한다 */
  reservationId?: string;
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

/** GET /api/reception/patients/{patientId}/visit-type — 외래 진료 이력으로 판정한 초진/재진 */
export interface VisitTypeResult {
  /** 판정하지 못했으면(determined=false) null */
  visitType: VisitType | null;
  determined: boolean;
  lastVisitDate: string | null;
}

/** 예약 상태 — RESERVED(예약됨) / RECEIVED(접수하기로 접수 완료) / CANCELLED(예약 취소) */
export type ReservationStatus = "RESERVED" | "RECEIVED" | "CANCELLED";

export interface ReservationItem {
  reservationId: string;
  patientId: string;
  /** reception-service는 내려주지 않는다 — 프론트가 CB2 batch 조회로 채운다 */
  patientName: string;
  deptId: string;
  deptName: string;
  doctorId: string;
  doctorName: string;
  visitType: VisitType;
  /** yyyy-MM-dd */
  reservationDate: string;
  /** HH:mm */
  reservationTime: string;
  memo: string | null;
  status: ReservationStatus;
  receptionId: string | null;
}

export interface ReservationRegisterRequest {
  patientId: string;
  deptId: string;
  doctorId: string;
  visitType: VisitType;
  reservationDate: string;
  reservationTime: string;
  memo: string;
}

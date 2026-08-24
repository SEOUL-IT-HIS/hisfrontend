export interface BedAssignmentDTO {
  assignmentId: number;
  bedId: string;
  admissionId: string;
  assignedAt: string;
  releasedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BedDTO {
  patientId: string | null;
  bedId: string;
  roomNo: string;
  bedNo: string;
  bedStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface BedReservationDTO {
  bedReservationId: number;
  bedId: string;
  patientId: string | null;
  reserveAt: string;
  expectedAdmissionAt: string;
  reservationStatusCd: string;
  createdAt: string;
  updatedAt: string;
}


export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

// ----- bedmanagement 전용 -----

/** 배정 생성 요청 — 서버가 채워주는 필드(assignmentId/createdAt/updatedAt) 제외 */
export type RegisterBedAssignmentRequest = Omit<
  BedAssignmentDTO,
  "assignmentId" | "createdAt" | "updatedAt"
>;

/** 배정 수정 요청 — PUT 경로/바디에 assignmentId 필요, createdAt/updatedAt은 서버가 관리 */
export type UpdateBedAssignmentRequest = Omit<
  BedAssignmentDTO,
  "createdAt" | "updatedAt"
>;

export interface Status {
  loading: boolean;
  error: string | null;
  success: boolean;
}

export interface BedAssignmentState {
  list: BedAssignmentDTO[];
  detail: BedAssignmentDTO | null;
  listStatus: Status;
  detailStatus: Status;
  createStatus: Status;
  updateStatus: Status;
  deleteStatus: Status;
}

// ----- 병상현황조회(bed) 전용 -----

export interface BedState {
  list: BedDTO[];
  detail: BedDTO | null;
  listStatus: Status;
  detailStatus: Status;
}

// ----- 병상예약(bedreservation) 전용 -----

/** 예약 생성 요청 — 서버가 채워주는 필드(bedReservationId/createdAt/updatedAt) 및 서버가 REQUESTED로 강제 지정하는 reservationStatusCd 제외 */
export type RegisterBedReservationRequest = Omit<
  BedReservationDTO,
  "bedReservationId" | "createdAt" | "updatedAt" | "reservationStatusCd"
>;

/** 예약 수정 요청 — PUT 경로/바디에 bedReservationId 필요, createdAt/updatedAt은 서버가 관리 */
export type UpdateBedReservationRequest = Omit<
  BedReservationDTO,
  "createdAt" | "updatedAt"
>;
export type UpdateBedReservationScheduleRequest = Pick<
  BedReservationDTO,
  "reserveAt" | "expectedAdmissionAt"
>;
export interface BedReservationState {
  list: BedReservationDTO[];
  detail: BedReservationDTO | null;
  listStatus: Status;
  detailStatus: Status;
  createStatus: Status;
  updateStatus: Status;
  deleteStatus: Status;
  scheduleUpdateStatus: Status;
}
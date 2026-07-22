export interface BedAssignmentDTO {
  assignmentId: string;
  bedId: string;
  admissionId: string;
  assignedAt: string;
  releasedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BedDTO {
  bedId: string;
  roomNo: string;
  bedNo: string;
  bedStatus: string;
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
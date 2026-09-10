/**
 * POST /api/reception/emergency 요청 — reception-service EmergencyReceptionRequestdto 와 1:1 매칭
 */
export interface EmergencyReceptionRequest {
  patientId: string;
  deptId: string;
  doctorId: string;
  memo: string;
  ktasLevel: number;
  visitMethod: string;
  chiefComplaint: string;
  consciousness: string;
}

/**
 * reception-service EmergencyReceptionResponsedto 와 1:1 매칭.
 * - POST /api/reception/emergency 응답(ApiResponse 로 감싸지 않고 원본 그대로)
 * - GET  /api/reception/emergency 목록의 각 항목(ApiResponse<data[]> 로 감쌈)
 */
export interface EmergencyReceptionDetail {
  receptionId: string;
  patientId: string;
  patientName: string;
  deptId: string;
  deptName: string;
  doctorId: string;
  doctorName: string;
  receptionNo: string;
  receptionType: string;
  status: string;
  memo: string;
  receivedAt: string;
  ktasLevel: number;
  arrivalPath: string;
  chiefComplaintRaw: string;
  consciousness: string;
  triageDateTime: string;
}

/** GET /api/reception/emergency 목록 항목 (등록 응답과 동일 shape) */
export type EmergencyReceptionListItem = EmergencyReceptionDetail;

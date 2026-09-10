/**
 * 병상 배정 — UC-RES-02 (자원관리)
 * 백엔드 BedDto / BedAssignmentDto 미러링.
 */
export interface Bed {
  id: string;
  bedNo: string;
  zoneCode: string;
  bedTypeCode: string;
  bedStatusCode: string;
}

/** 백엔드 BedAssignmentDto 미러링 */
export interface BedAssignment {
  id: string;
  receptionId: string;
  bedId: string;
  bedNo: string;
  zoneCode: string;
  assignedById: string;
  assignedAt: string;
  /** 해제 전엔 둘 다 null. 해제 API(UC-RES-02 해제)를 호출해야 채워진다. */
  releasedById: string | null;
  releasedAt: string | null;
}

/** 백엔드 BedAssignmentCreateRequestDto 미러링 */
export interface BedAssignmentCreateRequest {
  encounterId: string;
  bedId: string;
  assignedById?: string;
}

/** 백엔드 BedReleaseRequestDto 미러링 */
export interface BedReleaseRequest {
  releasedById: string;
}

export const BED_ZONE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  // 중증
  { value: "CRITICAL", label: "Critical" },
  // 응급
  { value: "URGENT", label: "Urgent" },
  // 격리
  { value: "ISOLATION", label: "Isolation" },
];

export const BED_TYPE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  // 일반
  { value: "GENERAL", label: "General" },
  // 처치
  { value: "TREATMENT", label: "Treatment" },
  // 격리실
  { value: "ISOLATION_ROOM", label: "Isolation Room" },
];

export interface BedState {
  beds: Bed[];
  loading: boolean;
  error: string;
  /**
   * 방금 배정한 병상(성공 응답을 그대로 세션 메모리에 담아둔 것).
   * 백엔드에 "환자별 배정 이력 조회" GET API가 없어서, 새로고침하거나
   * 다른 환자를 봤다가 돌아오면 이 값은 다시 알 수 없다(알려진 한계).
   */
  currentAssignment: BedAssignment | null;
  submitting: boolean;
  submitError: string;
}

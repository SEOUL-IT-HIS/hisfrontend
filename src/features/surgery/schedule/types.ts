/**
 * 수술 스케줄링 타입 (SL2-2)
 *
 * <p>백엔드 SurgeryDto 와 1:1 대응. 날짜 필드 구분에 주의한다(§14.2):
 * `_dt`(DATE)는 yyyy-MM-dd 문자열, `_at`(TIMESTAMP)은 ISO 일시 문자열이다.</p>
 */
import type {
  CodeValue,
  PageParams,
  PageResponse,
  YnFlag,
} from "@/features/surgery/types";

/**
 * 수술 상태 코드 (SURGERY_STATUS_CD)
 *
 * <p>백엔드 {@code schedule/type/SurgeryStatus.java} 와 짝을 이룬다. 값이 바뀌면 양쪽을 함께 고친다.</p>
 *
 * <p>화면 로직에서 {@code statusCd === "01"} 처럼 문자열을 직접 비교하면 오타를 컴파일러가
 * 잡지 못한다. 상수로 두면 잡힌다.</p>
 *
 * <p>표시할 <b>이름</b>은 여기서 갖지 않는다 — 코드명은 admin-service 소유라
 * 공통코드 조회로 가져와야 한다(§21.4). 이 상수는 <b>비교용 값</b>일 뿐이다.</p>
 *
 * <pre>
 *   01 예약 → 02 진행중 → 03 완료
 *        └────────────→ 04 취소 (예약에서만)
 * </pre>
 */
export const SURGERY_STATUS = {
  /**
   * @deprecated 요청 단계는 오더로 옮겼다. 수술은 예약(01)에서 시작한다.
   * 이미 저장된 이력의 before_cd='00' 을 읽을 때만 쓴다.
   */
  REQUESTED: "00",
  /** 배정 완료 — 수술은 여기서 시작한다 */
  SCHEDULED: "01",
  IN_PROGRESS: "02",
  COMPLETED: "03",
  CANCELLED: "04",
} as const;

/**
 * 수술 (SURGERY)
 *
 * <p>patientId/surgeonId 등은 타 서비스(환자·직원)가 소유한 데이터의 참조 식별자만
 * 보유한다. 환자명·집도의명은 저장하지 않고 표시 시점에 각 서비스 API 로 조회한다
 * (§14.1 스냅샷 금지, §21.9).</p>
 */
export type Surgery = {
  surgeryId: string;
  /** 환자 서비스 소유 — 식별자만 보유 */
  patientId: string;
  /** 직원(병원관리) 서비스 소유 — 식별자만 보유 */
  surgeonId: string;
  anesthesiologistId: string | null;
  nurseId: string | null;
  /** 수술 서비스 내 참조(SURGERY_ROOM) */
  roomCode: string | null;
  /** DATE — yyyy-MM-dd (§14.2 `_dt`) */
  surgeryDt: string;
  /** SURGERY_STATUS_CD: 00요청접수/01예약/02진행중/03완료/04취소 */
  statusCd: CodeValue;
  /** SURGERY_PROGRESS_CD — 당일 실시간 진행상태(status_cd 와 별개 트랙) */
  progressCd: CodeValue | null;
  /** SURGERY_CANCEL_CD */
  cancelReasonCd: CodeValue | null;
  /** SURGERY_TYPE_CD — 값 정의 미확정. 백엔드 Surgery 엔티티 주석 참고 */
  surgeryTypeCd: CodeValue | null;
  /** 수술 서비스가 직접 입력받아 소유하는 원본 데이터라 저장한다(스냅샷 아님) */
  surgeryName: string | null;
  emergencyYn: YnFlag;
  /**
   * 마취 시행 여부. 배정할 때 정해지고 이후에는 바뀌지 않는다.
   *
   * <p>N 이면 마취과가 붙지 않는 시술이라 {@code anesthesiologistId} 가 비어 있는
   * 것이 정상이다 — 화면에서 '미배정'이 아니라 '해당 없음'으로 보여야 한다.</p>
   */
  anesthesiaYn: YnFlag;
  actualStartDt: string | null;
  actualEndDt: string | null;
  createdAt: string;
  updatedAt: string;
};

/*
  수술 등록·수정·배정 요청 타입 4종(RegisterSurgeryRequest·UpdateSurgeryRequest·
  AssignSurgeryRequest·AssignFieldRequest)을 걷어냈다.

  수술을 직접 만드는 경로는 오더로 옮겨 갔고(features/surgery/order), 배정은 오더를
  승인할 때 한 번에 확정된 뒤로는 바꿀 수 없다 — 백엔드가 개별 배정 PATCH 4종과
  스케줄 수정 PUT 의 배정 항목 변경을 SUR059 로 거절한다.

  그래서 이 타입들을 쓰는 api·saga·slice 가 전부 사라졌다. 배정 요청 본문은
  features/surgery/order/types.ts 의 AssignSurgeryOrderRequest 하나뿐이다.
*/

/**
 * 상태변경 이력 (SL2-282, SURGERY_STATUS_HISTORY)
 *
 * <p>{@code statusType} 이 어느 코드의 변화인지 구분한다 — STATUS(예약→진행중 같은 큰 전이)
 * 또는 PROGRESS(당일 진행단계).</p>
 *
 * <p>{@code changedBy} 는 지금 항상 null 이다. 수술 서비스에 로그인 세션이 없어 서버가
 * 변경자를 알 수 없다(SL2-303·304 와 같은 벽).</p>
 */
export type SurgeryStatusHistory = {
  historyId: string;
  surgeryId: string;
  statusType: string;
  /** 처음 만들어질 때는 null */
  beforeCd: CodeValue | null;
  afterCd: CodeValue;
  reasonCd: CodeValue | null;
  changedBy: string | null;
  /** ISO 일시 (§14.2 `_at`) */
  changedAt: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * 수술 스케줄 취소 (SL2-33)
 *
 * <p>물리 삭제가 아니라 취소 상태 전이로 처리한다(§21.6).</p>
 *
 * <p><b>사유는 필수다</b>(SL2-178). 예전에는 선택이었는데, 이 엔드포인트가
 * 반려를 겸하던 시절의 잔재였다. 반려가 오더로 옮겨간 뒤로는 순수 취소 전용이고,
 * 되돌릴 수 없는 전이라 왜 취소했는지가 남아야 한다. 백엔드도 {@code @NotBlank} 다.</p>
 */
export type CancelSurgeryRequest = {
  cancelReasonCd: CodeValue;
};

/** 수술 진행상태 변경 (SL2-39) */
export type UpdateProgressRequest = {
  progressCd: CodeValue;
};

/** 수술 일정 목록 조회 파라미터 (SL2-25) */
export type SurgeryListParams = {
  /** yyyy-MM-dd, 미지정 시 전체 조회 */
  date?: string;
};

/**
 * 수술 검색 파라미터 (SL2-314 기록지 조회 / SL2-334 간호기록 조회)
 *
 * <p>백엔드 {@code GET /api/surgery/schedule/assignments} 와 짝을 이룬다.
 * 조건은 전부 선택이고, 비우면 그 조건은 없는 것으로 본다.</p>
 *
 * <p><b>환자·집도의를 이름이 아니라 식별자로 받는 이유</b> — 둘 다 다른 서비스가
 * 소유한 데이터라 수술 DB 에 이름이 없다(§21.9). 이름으로 찾으려면 환자·직원 서비스에서
 * 먼저 식별자를 받아와야 한다. 지금은 식별자 정확일치만 지원한다.</p>
 */
export type SurgerySearchParams = PageParams & {
  patientId?: string;
  surgeonId?: string;
  roomCode?: string;
  statusCd?: CodeValue;
  /** 수술일 시작 yyyy-MM-dd */
  fromDt?: string;
  /** 수술일 종료 yyyy-MM-dd */
  toDt?: string;
};

// 배정 대기 목록 검색 파라미터는 오더로 옮겼다 — features/surgery/order/types.ts

// ---------------------------------------------------------------------------
// Redux 상태
// ---------------------------------------------------------------------------

/**
 * 수술 스케줄 화면 상태
 *
 * <p>todaySurgeries 는 모니터링 화면(SL2-40)에서 별도로 쓰므로 목록과 분리해 둔다.</p>
 */
export type ScheduleState = {
  surgeries: Surgery[];
  todaySurgeries: Surgery[];
  selectedSurgery: Surgery | null;
  /**
   * 검색 결과 (SL2-314·334). 아직 검색한 적이 없으면 null 이다.
   *
   * <p>surgeries 와 따로 두는 이유 — 그쪽은 조건 없이 받아오는 전체 목록이라 성격이
   * 다르고, 페이징 정보(총건수·페이지수)도 여기에만 있다.</p>
   */
  searchResult: PageResponse<Surgery> | null;
  /** 마지막 검색 조건. 페이지를 넘길 때 조건을 그대로 유지하려고 들고 있다 */
  searchParams: SurgerySearchParams;
  /** 선택한 수술의 상태변경 이력 (SL2-282) */
  history: SurgeryStatusHistory[];
  loading: boolean;
  saving: boolean;
  /** SUR### 코드 또는 완성 문구 — 노출 직전 resolveSurgeryMessage 로 변환한다(§15.2) */
  error: string;
};

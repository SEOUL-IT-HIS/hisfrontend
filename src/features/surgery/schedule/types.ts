/**
 * 수술 스케줄링 타입 (SL2-2)
 *
 * <p>백엔드 SurgeryDto 와 1:1 대응. 날짜 필드 구분에 주의한다(§14.2):
 * `_dt`(DATE)는 yyyy-MM-dd 문자열, `_at`(TIMESTAMP)은 ISO 일시 문자열이다.</p>
 */
import type { CodeValue, YnFlag } from "@/features/surgery/types";

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
  actualStartDt: string | null;
  actualEndDt: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * 수술 요청 등록 (SL2-36)
 *
 * <p>진료가 "이 환자를 이렇게 집도하겠다"고 올리는 요청이다. 환자·집도의·희망일은
 * 진료가 확정하고, 수술실·마취의·간호사는 수술실 담당자가 배정 단계에서 채운다.</p>
 *
 * <p>statusCd 를 보내지 않는 이유 — 상태는 서버가 정한다. 진료 요청은 '요청접수(00)',
 * 응급 등록은 '예약(01)'로 생성되며, 클라이언트 값은 백엔드가 무시한다.</p>
 */
export type RegisterSurgeryRequest = {
  patientId: string;
  surgeonId: string;
  /** yyyy-MM-dd — 진료가 올리는 희망일. 배정 때 조정될 수 있다 */
  surgeryDt: string;
  emergencyYn: YnFlag;
  roomCode?: string | null;
  anesthesiologistId?: string | null;
  nurseId?: string | null;
  surgeryTypeCd?: CodeValue | null;
  surgeryName?: string | null;
};

/** 수술 스케줄 수정 (SL2-37) — 전체 교체(PUT). statusCd 는 전이 API 로만 바뀐다 */
export type UpdateSurgeryRequest = RegisterSurgeryRequest;

/**
 * 수술 배정 (요청접수 → 예약)
 *
 * <p>수술실은 필수, 마취의·간호사는 나중에 채워도 된다. surgeryDt 를 함께 보내면
 * 진료가 올린 희망일을 수술실 사정에 맞춰 조정한다(미지정이면 요청일 유지).</p>
 *
 * <p>환자·집도의가 없는 이유 — 진료가 확정한 값이라 배정에서 바꾸지 않는다.
 * 집도의를 바꿔야 하면 배정 후 수정(PUT)으로 처리한다.</p>
 */
export type AssignSurgeryRequest = {
  roomCode: string;
  anesthesiologistId?: string | null;
  nurseId?: string | null;
  /** yyyy-MM-dd */
  surgeryDt?: string;
};

/**
 * 수술 스케줄 취소 (SL2-33)
 *
 * <p>물리 삭제가 아니라 취소 상태 전이로 처리한다(§21.6). 사유 코드는 선택
 * (백엔드 @RequestBody(required = false)).</p>
 */
export type CancelSurgeryRequest = {
  cancelReasonCd?: CodeValue;
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
  /** 진료가 요청했으나 아직 수술실이 안 잡힌 건(status_cd = 00) — 배정 화면 전용 */
  surgeryRequests: Surgery[];
  selectedSurgery: Surgery | null;
  loading: boolean;
  saving: boolean;
  /** SUR### 코드 또는 완성 문구 — 노출 직전 resolveSurgeryMessage 로 변환한다(§15.2) */
  error: string;
};

/**
 * 수술기록지 타입 (SL2-51)
 *
 * <p>백엔드 OperativeRecordDto 와 1:1 대응.</p>
 */
import type { CodeValue } from "@/features/surgery/types";

/**
 * 수술기록지 (OPERATIVE_RECORD)
 *
 * <p>procedureName 은 수술 서비스가 그 화면에서 직접 입력받아 확정하는 원본 데이터라
 * 저장한다(§14.1 스냅샷 금지의 예외 — 타 서비스 소유 데이터가 아니다).</p>
 */
export type OperativeRecord = {
  recordId: string;
  surgeryId: string;
  /** 수술항목 마스터(SURGERY_PROCEDURE) 참조 코드 */
  procedureCd: CodeValue | null;
  procedureName: string;
  /** 01작성중 / 02확정 — 확정 후에는 수정 불가(백엔드 SUR043) */
  opStatusCd: CodeValue | null;
  createdAt: string;
  updatedAt: string;
};

/** 수술기록지 작성 (SL2-55) */
export type CreateOperativeRecordRequest = {
  procedureCd?: CodeValue | null;
  /** NOT NULL — 필수 */
  procedureName: string;
  opStatusCd?: CodeValue | null;
};

/**
 * 수술기록지 수정 (SL2-56)
 *
 * <p>확정(02) 상태 기록은 백엔드가 거부한다(SUR043). 수납이 확정 건을 신뢰해
 * 조회하기 때문이다.</p>
 */
export type UpdateOperativeRecordRequest = CreateOperativeRecordRequest;

// ---------------------------------------------------------------------------
// Redux 상태
// ---------------------------------------------------------------------------

export type OperativeRecordState = {
  records: OperativeRecord[];
  selectedRecord: OperativeRecord | null;
  loading: boolean;
  saving: boolean;
  /** SUR### 코드 또는 완성 문구 — 노출 직전 resolveSurgeryMessage 로 변환한다(§15.2) */
  error: string;
};

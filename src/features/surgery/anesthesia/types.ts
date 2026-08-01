/**
 * 마취기록 타입 (SL2-3)
 *
 * <p>백엔드 AnesthesiaRecordDto 와 1:1 대응.</p>
 */
import type { CodeValue } from "@/features/surgery/types";

/**
 * 마취기록 (ANESTHESIA_RECORD)
 *
 * <p>vitalSignsLog 는 DB 상 CLOB 이다. 활력징후·약물투여를 시각과 함께 한 줄씩
 * 이어붙인 시계열 텍스트이며, 프론트에서는 문자열로 다룬다(CLOB 은 저장 타입일 뿐
 * JSON 에서는 긴 문자열이다). 항목별 컬럼이 없어 정렬·필터는 화면에서 파싱해야 한다.</p>
 */
export type AnesthesiaRecord = {
  anesthesiaId: string;
  surgeryId: string;
  /** ANESTHESIA_TYPE_CD: 01전신/02척추/03국소/04기타 */
  anesthesiaTypeCd: CodeValue | null;
  /** ASA_CD: 01~06 (SL2-45 마취전평가) */
  asaGradeCd: CodeValue | null;
  vitalSignsLog: string | null;
  createdAt: string;
  updatedAt: string;
};

/** 마취기록 생성 (SL2-21 약물투여 기록 포함) */
export type CreateAnesthesiaRecordRequest = {
  anesthesiaTypeCd?: CodeValue | null;
  asaGradeCd?: CodeValue | null;
};

/**
 * 활력징후 추가 (SL2-18)
 *
 * <p>기존 로그를 덮어쓰지 않고 이어붙인다. 백엔드가 측정 시각을 앞에 붙여 저장하므로
 * 프론트는 측정값 문자열만 보낸다.</p>
 */
export type AppendVitalSignsRequest = {
  vitalSignsLog: string;
};

// ---------------------------------------------------------------------------
// Redux 상태
// ---------------------------------------------------------------------------

export type AnesthesiaState = {
  records: AnesthesiaRecord[];
  selectedRecord: AnesthesiaRecord | null;
  loading: boolean;
  saving: boolean;
  /** SUR### 코드 또는 완성 문구 — 노출 직전 resolveSurgeryMessage 로 변환한다(§15.2) */
  error: string;
};

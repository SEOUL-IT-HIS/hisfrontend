/**
 * 미생물검사결과(microbiologyresult) 타입 — UC-RST-02 미생물검사결과등록 (Jira ZP2-14, 5차 Phase 3)
 *
 * 백엔드 labresult/microbiology/dto 와 필드명을 맞춘다.
 */
import type { SpecimenSummary } from "@/features/labimaging/labspecimen/types";

/** 배양상태 (admin CULTURE_STATUS_CD — 2026-09-28 실측) */
export const CULTURE_STATUS = {
  INCUBATING: "01",
  NEGATIVE: "02",
  POSITIVE: "03",
} as const;

/** 항생제 감수성 1건 (요청·응답 공용) */
export interface MicrobiologySusceptibility {
  /** ANTIBIOTIC_CD */
  antibioticCode: string;
  /** SUSCEPTIBILITY_RESULT_CD (01 S / 02 I / 03 R) */
  susceptibilityResultCode: string;
}

/** 미생물 결과 — 백엔드 MicrobiologyResultSummaryDto */
export interface MicrobiologyResultSummary {
  microbiologyResultId: string;
  specimenId: string;
  specimenBarcode: string;
  receptionNo: string;
  /** 이 결과가 대응하는 검사항목 (접수의 미생물 항목) */
  labOrderItemId?: string;
  labItemCode?: string;
  cultureStatusCode: string;
  organismCode?: string;
  causativeYn?: "Y" | "N";
  observationNote?: string;
  /** 01 등록(중간보고) / 02 확정(최종보고) — D4 */
  resultStatusCode: string;
  recordedAt: string;
  recordedById: string;
  confirmedAt?: string;
  confirmedById?: string;
  /** 중간보고가 마지막으로 갱신된 시각 */
  updatedAt?: string;
  susceptibilities: MicrobiologySusceptibility[];
}

/** 등록 요청 — 백엔드 MicrobiologyResultCreateRequestDto */
export interface MicrobiologyResultCreateRequest {
  specimenId: string;
  cultureStatusCode: string;
  organismCode?: string;
  causativeYn?: "Y" | "N";
  observationNote?: string;
  susceptibilities?: MicrobiologySusceptibility[];
  /** 로그인 사용자 empId (서버는 세션 기준으로 기록 — D2 과도기용) */
  recordedById: string;
}

/** 수정 요청 (확정 전만) — 백엔드 MicrobiologyResultUpdateRequestDto. 감수성은 통째 교체 */
export type MicrobiologyResultUpdateRequest = Omit<MicrobiologyResultCreateRequest, "specimenId" | "recordedById">;

export interface MicrobiologyResultState {
  /** 이 접수의 미생물 결과 (접수당 1건 제약이라 0~1건) */
  results: MicrobiologyResultSummary[];
  /** 결과를 붙일 수 있는 검체(적합 판정된 것만 화면에서 고른다) */
  specimens: SpecimenSummary[];
  loading: boolean;
  loadError: string;

  submitting: boolean;
  submitError: string;
  /** 워크리스트가 이 값의 변화를 보고 진행도를 다시 불러온다 */
  lastSubmitted: MicrobiologyResultSummary | null;
}

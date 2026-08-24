/**
 * 수술 안전 체크리스트 타입 (SL2-35 조회 / SL2-46·47·48 작성 / SL2-49 수정)
 *
 * <p>백엔드 SurgeryChecklistDto 와 1:1 대응한다. WHO 수술 안전 체크리스트의 세 시점
 * (Sign In / Time Out / Sign Out)을 각각 한 행으로 남긴다.</p>
 *
 * <p><b>항목별 데이터가 없는 이유</b> — 백엔드 SURGERY_CHECKLIST 테이블은 단계(phaseCd)와
 * 완료 여부(completedYn)만 갖는다. 화면에 보이는 세부 확인 항목들은 저장 대상이 아니라
 * "이 단계를 확인했다"는 판단의 근거일 뿐이라, 전부 확인했을 때 completedYn 을 Y 로 올린다.</p>
 */
import type { CodeValue } from "@/features/surgery/types";

/** 체크리스트 단계 — 백엔드 SurgeryChecklistServiceImpl 의 PHASE_* 상수와 같은 값이다 */
export const CHECKLIST_PHASE = {
  /** 마취 전 — 환자·부위·동의서 확인 */
  SIGN_IN: "01",
  /** 집도 직전 — 팀 전원이 멈추고 함께 확인 */
  TIME_OUT: "02",
  /** 봉합 전후 — 기구·거즈 수량과 검체 확인 */
  SIGN_OUT: "03",
} as const;

export type ChecklistPhase =
  (typeof CHECKLIST_PHASE)[keyof typeof CHECKLIST_PHASE];

/** 체크리스트 한 건 (SURGERY_CHECKLIST) */
export type SurgeryChecklist = {
  checklistId: string;
  surgeryId: string;
  /** 01 Sign In / 02 Time Out / 03 Sign Out */
  phaseCd: CodeValue;
  /** 'Y' | 'N' — §14.2 `_yn` 은 CHAR(1) 이라 불리언이 아니다 */
  completedYn: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * 체크리스트 단계 등록 (SL2-46·47·48)
 *
 * <p>surgeryId 를 보내지 않는 이유 — 경로변수가 우선이라 백엔드가 덮어쓴다.
 * completedYn 을 비우면 백엔드가 'N'(미완료)으로 시작한다 — 등록과 완료 확인은 별개 행위다.</p>
 *
 * <p>이전 단계가 완료되지 않은 채 다음 단계를 등록하면 백엔드가 SUR051 로 거절한다.
 * 화면에서도 같은 규칙으로 버튼을 잠가 두지만, 최종 판단은 서버가 한다.</p>
 */
export type CreateChecklistRequest = {
  phaseCd: ChecklistPhase;
  completedYn?: string;
};

/**
 * 체크리스트 완료 여부 변경 (SL2-49)
 *
 * <p>백엔드가 PATCH 로 completedYn 하나만 받는다. 단계(phaseCd)는 바꿀 수 없다 —
 * 단계를 잘못 골랐다면 고치는 게 아니라 그 단계를 다시 확인하는 것이 맞다.</p>
 */
export type UpdateChecklistRequest = {
  completedYn: string;
};

// ---------------------------------------------------------------------------
// Redux 상태
// ---------------------------------------------------------------------------

/** 체크리스트 화면 상태 */
export type ChecklistState = {
  items: SurgeryChecklist[];
  loading: boolean;
  saving: boolean;
  /** SUR### 코드 또는 완성 문구 — 노출 직전 resolveSurgeryMessage 로 변환한다(§15.2) */
  error: string;
};

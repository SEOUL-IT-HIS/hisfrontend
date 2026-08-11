"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { resolveSurgeryMessage } from "@/features/surgery/messages";
import {
  createChecklistRequest,
  fetchChecklistRequest,
  selectChecklistError,
  selectChecklistItems,
  selectChecklistLoading,
  selectChecklistSaving,
  updateChecklistRequest,
} from "@/features/surgery/checklist/slice";
import {
  CHECKLIST_PHASE,
  type ChecklistPhase,
} from "@/features/surgery/checklist/types";

type Props = { surgeryId: string };

/**
 * 수술 안전 체크리스트 패널
 * (SL2-35 조회 / SL2-46 Sign In / SL2-47 Time Out / SL2-48 Sign Out / SL2-49 수정)
 *
 * <p>WHO 수술 안전 체크리스트는 <b>순서가 있는 확인 절차</b>다. 마취 전(Sign In) → 집도 직전
 * (Time Out) → 봉합 전후(Sign Out) 순으로 진행하며, 앞 단계를 건너뛰면 뒤 단계를 시작할 수 없다.
 * 백엔드가 이전 단계 완료 여부를 검증해 SUR051 로 거절하고(SurgeryChecklistServiceImpl),
 * 화면에서도 같은 규칙으로 버튼을 잠가 사용자가 헛수고하지 않게 한다(§15.3).</p>
 *
 * <p><b>세부 확인 항목이 저장되지 않는 이유</b> — SURGERY_CHECKLIST 테이블은 단계와 완료
 * 여부만 갖는다. 아래 목록은 확인해야 할 내용을 담당자에게 보여주는 안내이고, 저장되는 것은
 * "이 단계를 완료했다"는 사실 하나다.</p>
 *
 * <p><b>완료를 되돌릴 수 있게 둔 이유</b> — 잘못 눌렀을 때 지울 방법이 없으면 행을 삭제하게
 * 된다. 체크리스트는 안전 확인 기록이라 지우지 않고 상태로 되돌린다(§21.6).</p>
 */

const YES = "Y";

/** 단계별 안내 문구. 저장 대상이 아니라 화면 안내다. */
const PHASES: {
  code: ChecklistPhase;
  label: string;
  timing: string;
  checks: string[];
}[] = [
  {
    code: CHECKLIST_PHASE.SIGN_IN,
    label: "Sign In",
    timing: "마취 시작 전",
    checks: [
      "환자 본인 확인",
      "수술 부위 및 표시 확인",
      "동의서 확인",
      "마취 장비·약물 점검",
      "알레르기 여부 확인",
    ],
  },
  {
    code: CHECKLIST_PHASE.TIME_OUT,
    label: "Time Out",
    timing: "피부 절개 직전",
    checks: [
      "팀 전원 이름·역할 소개",
      "환자·부위·술식 재확인",
      "예상 소요 시간 및 출혈량 공유",
      "예방적 항생제 투여 확인",
      "필요 영상 준비 확인",
    ],
  },
  {
    code: CHECKLIST_PHASE.SIGN_OUT,
    label: "Sign Out",
    timing: "환자 퇴실 전",
    checks: [
      "시행한 술식명 확인",
      "기구·거즈·바늘 수량 확인",
      "검체 표기 확인",
      "장비 이상 여부 확인",
      "회복 및 관리 계획 공유",
    ],
  },
];

export default function ChecklistPanel({ surgeryId }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector(selectChecklistItems);
  const loading = useSelector(selectChecklistLoading);
  const saving = useSelector(selectChecklistSaving);
  const error = useSelector(selectChecklistError);

  useEffect(() => {
    dispatch(fetchChecklistRequest(surgeryId));
  }, [dispatch, surgeryId]);

  const itemOf = (phase: ChecklistPhase) =>
    items.find((item) => item.phaseCd === phase);

  const isCompleted = (phase: ChecklistPhase) =>
    itemOf(phase)?.completedYn === YES;

  /**
   * 이 단계를 시작할 수 있는가.
   * Sign In 은 첫 단계라 항상 열려 있고, 나머지는 앞 단계가 완료돼야 한다.
   */
  const isUnlocked = (index: number) =>
    index === 0 || isCompleted(PHASES[index - 1].code);

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {resolveSurgeryMessage(error)}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">불러오는 중입니다…</p>
      ) : (
        PHASES.map((phase, index) => {
          const item = itemOf(phase.code);
          const completed = isCompleted(phase.code);
          const unlocked = isUnlocked(index);

          return (
            <section
              key={phase.code}
              className={`rounded-lg border p-4 ${
                completed
                  ? "border-emerald-200 bg-emerald-50/40"
                  : unlocked
                    ? "border-slate-200"
                    : "border-slate-100 bg-slate-50"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 font-medium text-slate-800">
                    <span className="text-xs text-slate-400">
                      {phase.code}
                    </span>
                    {phase.label}
                    {completed && (
                      <span className="rounded bg-emerald-500 px-2 py-0.5 text-xs text-white">
                        완료
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">{phase.timing}</p>
                </div>

                {/* 잠긴 단계에는 버튼을 아예 두지 않는다 — 누를 수 없는 버튼보다 사유가 명확하다 */}
                {unlocked ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      if (!item) {
                        // 첫 작성 — 확인을 마쳤다는 뜻이므로 완료(Y)로 등록한다
                        dispatch(
                          createChecklistRequest(surgeryId, {
                            phaseCd: phase.code,
                            completedYn: YES,
                          }),
                        );
                        return;
                      }
                      dispatch(
                        updateChecklistRequest(surgeryId, item.checklistId, {
                          completedYn: completed ? "N" : YES,
                        }),
                      );
                    }}
                    className={`h-9 shrink-0 rounded-lg px-3 text-sm ${
                      completed
                        ? "border border-slate-300 text-slate-600"
                        : "bg-sky-500 text-white"
                    } disabled:opacity-50`}
                  >
                    {completed ? "완료 취소" : "확인 완료"}
                  </button>
                ) : (
                  <span className="shrink-0 text-xs text-slate-400">
                    이전 단계 완료 후 진행
                  </span>
                )}
              </div>

              <ul className="mt-3 flex flex-col gap-1 text-sm text-slate-600">
                {phase.checks.map((check) => (
                  <li key={check} className="flex gap-2">
                    <span className="text-slate-300">·</span>
                    {check}
                  </li>
                ))}
              </ul>

              {item && (
                <p className="mt-3 text-xs text-slate-400">
                  최종 변경 {item.updatedAt?.slice(0, 16).replace("T", " ")}
                </p>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}

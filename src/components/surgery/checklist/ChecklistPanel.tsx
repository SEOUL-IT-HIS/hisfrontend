"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, Panel, StatusBadge } from "@/components/common";
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
 * <p><b>항목을 전부 체크해야 완료할 수 있다</b>. 예전에는 확인 항목이 그냥
 * 글자 목록이었고 "확인 완료" 버튼 하나로 다섯 항목이 한꺼번에 완료됐다. 아무것도 보지 않고
 * 누를 수 있었으니 안전 확인 기록으로서 의미가 없었다 — WHO 체크리스트의 요지가 항목을
 * 하나씩 짚는 것인데 그게 빠져 있었다.</p>
 *
 * <h3>작성 시작과 확인 완료를 나눈 이유</h3>
 *
 * <p>예전에는 "확인 완료" 하나뿐이었고, 그것을 누르는 순간 행이 <b>완료(Y)로</b> 생겼다.
 * 그래서 <b>작성 중인 체크리스트라는 상태가 DB 에 없었다</b> — 항목을 체크하던 중에
 * 화면을 떠나면 아무 흔적도 남지 않았고, "아직 확인 안 끝난 수술"을 집계할 방법도 없었다.
 * 백엔드는 처음부터 미완료(N)로 시작할 준비가 돼 있었는데(SurgeryChecklistServiceImpl),
 * 화면이 늘 Y 를 실어 보내 그 구분을 쓰지 않고 있었다.</p>
 *
 * <p>이제 <b>작성 시작</b>이 행을 N 으로 만들고, 항목을 전부 확인한 뒤 <b>확인 완료</b>가
 * Y 로 올린다. 등록과 확인이 별개 행위라는 원래 설계대로 돌아온 것이다.</p>
 *
 * <p><b>체크 상태 자체는 여전히 저장되지 않는다.</b> SURGERY_CHECKLIST 테이블이 단계와
 * 완료 여부만 갖기 때문이다. 그래서 화면을 떠나면 체크가 풀리고, 완료로 등록된 단계는
 * 항목 표시가 필요 없으므로 접어 둔다. 항목별 확인 여부를 실제로 남기려면 테이블이
 * 필요하고, 그것이 SL2-263·270·276 이다(미완료).</p>
 *
 * <p><b>완료를 되돌릴 수 있게 둔 이유</b> — 잘못 눌렀을 때 지울 방법이 없으면 행을 삭제하게
 * 된다. 체크리스트는 안전 확인 기록이라 지우지 않고 상태로 되돌린다(§21.6).</p>
 *
 * <p>카드·버튼·배지·오류문구는 components/common 을 쓴다(§12.1). 단계별 배경색만
 * Panel 의 className 으로 얹는다 — 완료/잠김을 색으로 구분하는 것은 이 화면만의 규칙이라
 * 공통 컴포넌트에 넣을 일이 아니다.</p>
 */

const YES = "Y";
const NO = "N";

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
   * 단계별로 체크한 항목. 저장되지 않는 화면 상태다.
   *
   * <p>Set 을 쓰는 이유 — 항목 문구가 키이고 순서는 상관없으며, 있는지 없는지만 묻는다.
   * 배열이면 매번 indexOf 로 훑어야 한다.</p>
   */
  const [checked, setChecked] = useState<Record<string, Set<string>>>({});

  const checkedOf = (phase: ChecklistPhase) => checked[phase] ?? new Set<string>();

  const toggleCheck = (phase: ChecklistPhase, item: string) =>
    setChecked((prev) => {
      const next = new Set(prev[phase] ?? []);
      if (next.has(item)) {
        next.delete(item);
      } else {
        next.add(item);
      }
      return { ...prev, [phase]: next };
    });

  /** 그 단계의 확인 항목을 전부 체크했는가 */
  const allChecked = (phase: ChecklistPhase) => {
    const checks = PHASES.find((p) => p.code === phase)?.checks ?? [];
    const set = checkedOf(phase);
    return checks.length > 0 && checks.every((c) => set.has(c));
  };

  /**
   * 이 단계를 시작할 수 있는가.
   * Sign In 은 첫 단계라 항상 열려 있고, 나머지는 앞 단계가 완료돼야 한다.
   */
  const isUnlocked = (index: number) =>
    index === 0 || isCompleted(PHASES[index - 1].code);

  return (
    <div className="flex flex-col gap-4">
      {error ? <Alert>{resolveSurgeryMessage(error)}</Alert> : null}

      {loading ? (
        <p className="text-sm text-slate-500">불러오는 중입니다…</p>
      ) : (
        PHASES.map((phase, index) => {
          const item = itemOf(phase.code);
          const completed = isCompleted(phase.code);
          const unlocked = isUnlocked(index);

          return (
            <Panel
              key={phase.code}
              dashed={!unlocked}
              className={`p-4 ${completed ? "bg-emerald-50/40" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 font-medium text-slate-800">
                    <span className="text-xs text-slate-400">
                      {phase.code}
                    </span>
                    {phase.label}
                    {completed ? (
                      <StatusBadge value="Y" activeLabel="완료" />
                    ) : item ? (
                      /* 행은 있는데 아직 N — 누군가 작성을 시작해 둔 단계다 */
                      <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                        작성 중
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-slate-500">{phase.timing}</p>
                </div>

                {/* 잠긴 단계에는 버튼을 아예 두지 않는다 — 누를 수 없는 버튼보다 사유가 명확하다 */}
                {!unlocked ? (
                  <span className="shrink-0 text-xs text-slate-400">
                    이전 단계 완료 후 진행
                  </span>
                ) : !item ? (
                  /*
                    작성 시작 — 미완료(N)로 행을 만든다.
                    항목 체크를 요구하지 않는다. 아직 아무것도 확인하지 않았다는 뜻을
                    남기는 것이 이 버튼의 일이고, 확인은 다음 버튼이 맡는다.
                  */
                  <Button
                    variant="primary"
                    disabled={saving}
                    className="shrink-0"
                    onClick={() =>
                      dispatch(
                        createChecklistRequest(surgeryId, {
                          phaseCd: phase.code,
                          completedYn: NO,
                        }),
                      )
                    }
                  >
                    작성 시작
                  </Button>
                ) : (
                  <Button
                    variant={completed ? "secondary" : "primary"}
                    // 완료하려면 항목을 전부 체크해야 한다. 되돌리기(완료 취소)는 그대로 열어둔다 —
                    // 잘못 눌렀을 때 풀 방법이 없으면 행을 지우게 된다(§21.6).
                    disabled={saving || (!completed && !allChecked(phase.code))}
                    className="shrink-0"
                    onClick={() =>
                      dispatch(
                        updateChecklistRequest(surgeryId, item.checklistId, {
                          completedYn: completed ? NO : YES,
                        }),
                      )
                    }
                  >
                    {completed ? "완료 취소" : "확인 완료"}
                  </Button>
                )}
              </div>

              {/*
                항목은 <b>작성을 시작한 뒤</b>에만 보여준다. 시작 전에 체크부터 하게 두면
                그 체크가 어디에도 저장되지 않아, 화면을 떠나는 순간 사라진다.

                완료된 단계도 숨긴다 — 체크 상태가 저장되지 않아 다시 열면 전부 풀린 채로
                보이는데, 그 모습이 "확인이 취소됐다"로 읽힌다.
              */}
              {!item || completed || !unlocked ? null : (
                <ul className="mt-3 flex flex-col gap-2 text-sm text-slate-700">
                  {phase.checks.map((check) => (
                    <li key={check}>
                      <label className="flex cursor-pointer items-start gap-2">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={checkedOf(phase.code).has(check)}
                          disabled={saving}
                          onChange={() => toggleCheck(phase.code, check)}
                        />
                        {check}
                      </label>
                    </li>
                  ))}
                  <li className="mt-1 text-xs text-slate-500">
                    {allChecked(phase.code)
                      ? "모든 항목을 확인했습니다. 완료 처리할 수 있습니다."
                      : `${checkedOf(phase.code).size} / ${phase.checks.length} 확인 — 전부 확인해야 완료할 수 있습니다.`}
                  </li>
                </ul>
              )}

              {item && (
                <p className="mt-3 text-xs text-slate-400">
                  최종 변경 {item.updatedAt?.slice(0, 16).replace("T", " ")}
                </p>
              )}
            </Panel>
          );
        })
      )}
    </div>
  );
}

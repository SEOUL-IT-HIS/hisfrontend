"use client";

import type { LabWorklistItem } from "@/features/labimaging/laborder/types";

/**
 * 워크리스트 1행의 진행 상태 표시.
 *
 * ⚠ 판정을 "✓/−" 가 아니라 "2/3" 으로 보여준다.
 *   검체 3건 중 2건만 판정된 상태를 Y/N 으로는 표현할 수 없다.
 *   "완료"라고 하면 남은 1건이 묻히고, "미완"이라고 하면 끝낸 2건이 묻힌다.
 *
 * ⚠ 결과 단계는 회색으로 자리만 잡아둔다. 아직 결과 등록 기능이 없다.
 *   판정까지 끝낸 접수가 목록에 계속 남는 이유를 담당자가 알 수 있어야 하기 때문에,
 *   비활성 상태로라도 보여준다.
 */

type StepChipProps = {
  label: string;
  /** done=완료(초록), pending=대기(회색), alert=주의(주황), disabled=미구현(연회색) */
  tone: "done" | "pending" | "alert" | "disabled";
};

const toneClass: Record<StepChipProps["tone"], string> = {
  done: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  pending: "bg-slate-100 text-slate-500 ring-slate-500/10",
  alert: "bg-amber-50 text-amber-700 ring-amber-600/20",
  disabled: "bg-slate-50 text-slate-300 ring-slate-400/10",
};

function StepChip({ label, tone }: StepChipProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${toneClass[tone]}`}
    >
      {label}
    </span>
  );
}

export default function WorklistProgress({ item }: { item: LabWorklistItem }) {
  const scheduled = Boolean(item.scheduledAt);
  const hasSpecimen = item.specimenCount > 0;
  const allJudged = hasSpecimen && item.judgedCount === item.specimenCount;

  return (
    <div className="flex flex-wrap items-center gap-1">
      <StepChip label={scheduled ? "일정" : "일정 −"} tone={scheduled ? "done" : "pending"} />
      <StepChip
        label={hasSpecimen ? `검체 ${item.specimenCount}` : "검체 −"}
        tone={hasSpecimen ? "done" : "pending"}
      />
      <StepChip
        label={hasSpecimen ? `판정 ${item.judgedCount}/${item.specimenCount}` : "판정 −"}
        tone={allJudged ? "done" : "pending"}
      />
      {item.recollectionRequestedYn === "Y" ? (
        <StepChip label="재채취" tone="alert" />
      ) : null}
      <StepChip label="결과" tone="disabled" />
    </div>
  );
}

"use client";

import type { LabWorklistItem } from "@/features/labimaging/laborder/types";

/**
 * 워크리스트 1행의 진행 상태 표시.
 *
 * ⚠ 판정을 "✓/−" 가 아니라 "2/3" 으로 보여준다.
 *   검체 3건 중 2건만 판정된 상태를 Y/N 으로는 표현할 수 없다.
 *   "완료"라고 하면 남은 1건이 묻히고, "미완"이라고 하면 끝낸 2건이 묻힌다.
 *
 * ⚠ 결과 칩도 개수로 보여준다. (2026-09-02 — 결과 등록 기능이 붙으면서 실제 값으로 바뀌었다)
 *   검사항목이 오더 1건에 여러 개 달리고 결과는 항목마다 1건이라 "2건 중 1건" 상태가 실제로 생긴다.
 *   초록으로 바뀌는 기준은 등록이 아니라 확정이다 — 등록만 해놓고 확정을 안 한 상태를
 *   완료로 보여주면 아직 남은 일이 묻힌다.
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
  const hasItems = item.labItemCount > 0;
  const allConfirmed = hasItems && item.confirmedResultCount === item.labItemCount;

  return (
    <div className="flex flex-wrap items-center gap-1">
      <StepChip label={scheduled ? "Schedule" : "Schedule −"} tone={scheduled ? "done" : "pending"} />
      <StepChip
        label={hasSpecimen ? `Specimen ${item.specimenCount}` : "Specimen −"}
        tone={hasSpecimen ? "done" : "pending"}
      />
      <StepChip
        label={hasSpecimen ? `Assessed ${item.judgedCount}/${item.specimenCount}` : "Assessed −"}
        tone={allJudged ? "done" : "pending"}
      />
      {item.recollectionRequestedYn === "Y" ? (
        <StepChip label="Recollection" tone="alert" />
      ) : null}
      {/*
        ⚠ 결과는 "등록"과 "확정" 두 단계라 초록으로 바뀌는 기준이 확정이다.
          전부 등록만 해놓고 확정을 안 한 상태를 완료로 보여주면, 아직 남은 일이 묻힌다.
          숫자는 등록 수(resultCount)로 보여준다 — 담당자가 다음에 할 일은 "남은 항목 입력"이고,
          그건 등록 기준으로 세야 알 수 있다.
      */}
      <StepChip
        label={hasItems ? `Result ${item.resultCount}/${item.labItemCount}` : "Result −"}
        tone={allConfirmed ? "done" : hasItems ? "pending" : "disabled"}
      />
    </div>
  );
}

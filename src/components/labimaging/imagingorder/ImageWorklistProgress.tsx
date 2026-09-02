"use client";

import type { ImageReceptionSummary } from "@/features/labimaging/imagingorder/types";

/**
 * 영상 워크리스트 1행의 진행 상태 표시.
 * (검사 쪽 laborder/WorklistProgress 와 같은 자리, 같은 모양)
 *
 * ⚠ 단계가 검사와 다르다. 영상에는 검체가 없다.
 *   검사 : 일정 → 검체 → 적합성 판정 → 결과
 *   영상 : 일정 → 동의 → 촬영 → 판독
 *   적합성 판정은 SPECIMEN 에 붙는 판정이라 영상으로 옮겨올 대상이 아니다.
 *   대신 조영제·침습검사 동의(CONSENT)가 촬영 앞을 막는 단계로 들어간다.
 *
 * ⚠ 판독을 "결과"와 나누지 않는다. 영상의 결과가 곧 판독소견이다.
 *   신규 테이블에 IMAGE_READING 은 있고 IMAGE_RESULT 는 없다. 나누면 한 칸이 영원히 빈다.
 *
 * ⚠ 지금은 일정 외에는 서버가 진행 상태를 내려주지 않는다.
 *   목록 API(GET /image-orders/receptions)가 ImageOrderSummaryDto 를 주는데
 *   scheduledAt 만 있고 동의·촬영·판독 건수가 없다. 그래서 세 칸은 미구현 회색으로 자리만 잡는다.
 *   TODO(영상 워크리스트 API): 백엔드에 consentYn / imageFileCount / readingYn 이 생기면
 *     검사 쪽 specimenCount·judgedCount 처럼 실제 값으로 바꾼다.
 *     그때 이 컴포넌트의 props 타입도 ImageWorklistItem 으로 교체한다.
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

export default function ImageWorklistProgress({
  item,
}: {
  item: ImageReceptionSummary;
}) {
  const scheduled = Boolean(item.scheduledAt);

  return (
    <div className="flex flex-wrap items-center gap-1">
      <StepChip
        label={scheduled ? "Schedule" : "Schedule −"}
        tone={scheduled ? "done" : "pending"}
      />
      {/* 아래 세 칸은 서버가 아직 상태를 안 내려준다. 위 TODO 참고. */}
      <StepChip label="Consent" tone="disabled" />
      <StepChip label="Images" tone="disabled" />
      <StepChip label="Reading" tone="disabled" />
    </div>
  );
}

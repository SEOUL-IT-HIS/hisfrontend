"use client";

import type { ImageWorklistItem } from "@/features/labimaging/imagingorder/types";

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
 * ⚠ 동의를 개수가 아니라 Y/N 으로 보여준다.
 *   검체는 "3건 중 2건 판정" 이라는 중간 상태가 있어 개수가 필요하지만,
 *   동의는 유효한 게 하나라도 있으면 촬영 가능이라 그런 중간 상태가 없다.
 *
 * ⚠ 촬영·판독은 아직 회색이다. 서버가 값을 계산하지 않는다.
 *   촬영(IMAGE_FILE)은 등록 기능이 없어 항상 0 이고(ZP2-21),
 *   판독(IMAGE_READING)은 테이블만 있고 엔티티가 없다(ZP2-23).
 *   기능이 붙으면 imageFileCount 를 실제 값으로 쓰고 판독 칸도 살린다.
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
  item: ImageWorklistItem;
}) {
  const hasItems = item.imageItemCount > 0;
  const allScheduled = hasItems && item.scheduledItemCount === item.imageItemCount;
  const consented = item.consentYn === "Y";
  const hasFiles = item.imageFileCount > 0;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {/*
        ⚠ 일정도 개수로 보여준다. 촬영항목마다 일정이 1건이라 "3건 중 1건" 상태가 실제로 생긴다.
          (2026-09-03 — 일정이 접수 단위에서 항목 단위로 바뀌면서)
          CT 만 잡고 MRI·초음파를 안 잡았는데 완료로 보이면 안 잡힌 촬영이 그대로 묻힌다.
      */}
      <StepChip
        label={
          hasItems
            ? `Schedule ${item.scheduledItemCount}/${item.imageItemCount}`
            : "Schedule −"
        }
        tone={allScheduled ? "done" : "pending"}
      />
      <StepChip
        label={consented ? "Consent" : "Consent −"}
        tone={consented ? "done" : "pending"}
      />
      {/*
        촬영은 등록 기능이 생기기 전까지 항상 0 이라 회색으로만 뜬다.
        조건을 미리 넣어 둔 이유는, ZP2-21 이 붙는 순간 이 칸이 저절로 살아나게 하기 위해서다.
      */}
      <StepChip
        label={hasFiles ? `Images ${item.imageFileCount}` : "Images −"}
        tone={hasFiles ? "done" : "disabled"}
      />
      <StepChip label="Reading" tone="disabled" />
    </div>
  );
}

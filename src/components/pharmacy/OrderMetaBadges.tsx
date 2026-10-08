import type { PrescriptionListItem } from "@/features/pharmacy/types";

type OrderMetaBadgesProps = Pick<PrescriptionListItem, "encounterType" | "priorityCode" | "verbalYn">;

/**
 * 처방 출처(ER 등) / 우선순위(STAT, Urgent) / 구두처방 배지.
 * 표시만 하고 정렬이나 조제 가능 여부에는 영향을 주지 않는다 — 검사 워크리스트의 Urgent 배지와 같은 방식이다.
 * 구두처방은 처방코어가 의사 확정 여부를 알려주지 않으므로 조제를 막지 않고 알아볼 수 있게만 한다.
 */
export default function OrderMetaBadges({ encounterType, priorityCode, verbalYn }: OrderMetaBadgesProps) {
  const priority =
    priorityCode === "01"
      ? { label: "STAT", className: "bg-rose-50 text-rose-600" }
      : priorityCode === "02"
        ? { label: "Urgent", className: "bg-amber-50 text-amber-700" }
        : null;

  return (
    <>
      {priority && (
        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${priority.className}`}>{priority.label}</span>
      )}
      {encounterType === "ER" && (
        <span className="rounded bg-sky-50 px-1.5 py-0.5 text-xs font-medium text-sky-700">ER</span>
      )}
      {verbalYn === "Y" && (
        <span
          className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600"
          title="Verbal order. Physician confirmation status is not provided to pharmacy."
        >
          Verbal
        </span>
      )}
    </>
  );
}

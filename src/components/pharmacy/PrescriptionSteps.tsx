type PrescriptionStepsProps = {
  /** RECEIVED / DISPENSED / REJECTED / CANCELLED */
  status: string;
  /** 불출 상태 — RELEASED / CANCELLED / null(불출 전) */
  releaseStatusCd: string | null;
  /** 반납이 한 건이라도 기록됐는지 */
  hasReturns: boolean;
};

type Step = {
  label: string;
  state: "done" | "current" | "pending" | "warn" | "failed";
};

/**
 * 처방전 처리 단계 표시 — 접수 → 조제완료 → 불출 → (반납). 지금 어느 단계이고 어디까지 끝났는지 한눈에 보여서
 * "불출까지 하면 끝나는 건지" 헷갈리지 않게 한다. 반납은 불출된 뒤 환자가 약을 되가져올 때만 생기는 선택 단계다.
 */
function buildSteps({ status, releaseStatusCd, hasReturns }: PrescriptionStepsProps): Step[] {
  if (status === "CANCELLED") {
    return [
      { label: "Received", state: "done" },
      { label: "Cancelled by prescriber", state: "failed" },
    ];
  }
  if (status === "REJECTED") {
    return [
      { label: "Received", state: "done" },
      { label: "Rejected", state: "failed" },
    ];
  }
  if (status === "RECEIVED") {
    return [
      { label: "Received", state: "current" },
      { label: "Dispensed", state: "pending" },
      { label: "Released", state: "pending" },
      { label: "Return (optional)", state: "pending" },
    ];
  }
  // DISPENSED
  const releaseStep: Step =
    releaseStatusCd === "RELEASED"
      ? { label: "Released", state: "done" }
      : releaseStatusCd === "CANCELLED"
        ? { label: "Release cancelled", state: "warn" }
        : { label: "Released", state: "current" };
  return [
    { label: "Received", state: "done" },
    { label: "Dispensed", state: "done" },
    releaseStep,
    {
      label: hasReturns ? "Returned" : "Return (optional)",
      state: hasReturns ? "done" : "pending",
    },
  ];
}

const CIRCLE_CLASS: Record<Step["state"], string> = {
  done: "bg-emerald-500 text-white",
  current: "bg-sky-500 text-white ring-4 ring-sky-100",
  pending: "bg-slate-100 text-slate-400",
  warn: "bg-amber-400 text-white",
  failed: "bg-rose-500 text-white",
};

const LABEL_CLASS: Record<Step["state"], string> = {
  done: "text-slate-700",
  current: "font-semibold text-sky-700",
  pending: "text-slate-400",
  warn: "font-medium text-amber-600",
  failed: "font-medium text-rose-600",
};

export default function PrescriptionSteps(props: PrescriptionStepsProps) {
  const steps = buildSteps(props);
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-2">
      {steps.map((step, index) => (
        <li key={step.label} className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${CIRCLE_CLASS[step.state]}`}
          >
            {step.state === "done" ? "✓" : index + 1}
          </span>
          <span className={`text-sm ${LABEL_CLASS[step.state]}`}>{step.label}</span>
          {index < steps.length - 1 && <span className="mx-1 h-px w-8 bg-slate-200" />}
        </li>
      ))}
    </ol>
  );
}

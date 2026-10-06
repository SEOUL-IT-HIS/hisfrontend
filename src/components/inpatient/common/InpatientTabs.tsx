"use client";

type InpatientTabsProps<K extends string> = {
  tabs: ReadonlyArray<{ key: K; label: string }>;
  active: K;
  onChange: (key: K) => void;
  /**
   * bar: 화면 탭 — 흰 카드 안에 균등 배치 (응급 TriagePanelHost 탭과 같은 모양)
   * inline: 목록 필터 — Toolbar 안에 들어가는 작은 세그먼트 버튼
   */
  variant?: "bar" | "inline";
  className?: string;
};

/**
 * 입원 화면 공용 탭 — 공통 컴포넌트(@/components/common)에 탭이 없어서 입원용으로 하나 둠
 * - 선택된 탭만 sky로 강조
 */
export default function InpatientTabs<K extends string>({
  tabs,
  active,
  onChange,
  variant = "bar",
  className = "",
}: InpatientTabsProps<K>) {
  const isBar = variant === "bar";
  return (
    <div
      className={
        isBar
          ? `flex gap-1 rounded-xl border border-slate-200/80 bg-white p-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`
          : `inline-flex flex-wrap gap-1 rounded-xl bg-slate-100/80 p-1 ${className}`
      }
    >
      {tabs.map((tab) => {
        const selected = active === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={
              isBar
                ? `flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    selected ? "bg-sky-50 text-sky-700" : "text-slate-500 hover:bg-slate-50"
                  }`
                : `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    selected ? "bg-white text-sky-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`
            }
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

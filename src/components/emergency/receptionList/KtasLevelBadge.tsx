"use client";

const KTAS_STYLE: Record<string, string> = {
    "1": "bg-rose-50 text-rose-700 ring-rose-600/20",
    "2": "bg-orange-50 text-orange-700 ring-orange-600/20",
    "3": "bg-amber-50 text-amber-700 ring-amber-600/20",
    "4": "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    "5": "bg-slate-100 text-slate-600 ring-slate-500/10",
};

export default function KtasLevelBadge({ level }: { level?: string }) {
    if (!level) {
        return <span className="text-xs text-slate-400">미분류</span>;
    }
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${KTAS_STYLE[level] ?? KTAS_STYLE["5"]}`}
        >
      {level}급
    </span>
    );
}
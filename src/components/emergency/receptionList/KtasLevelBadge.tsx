"use client";

import { codeToNumber } from "@/features/emergency/codes";

// KTAS 등급 코드는 공통코드 TRIAGE_CD 의 값("01"~"05")이다.
const KTAS_STYLE: Record<string, string> = {
    "01": "bg-rose-50 text-rose-700 ring-rose-600/20",
    "02": "bg-orange-50 text-orange-700 ring-orange-600/20",
    "03": "bg-amber-50 text-amber-700 ring-amber-600/20",
    "04": "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    "05": "bg-slate-100 text-slate-600 ring-slate-500/10",
};

export default function KtasLevelBadge({ level }: { level?: string | null }) {
    if (!level) {
        // 미분류
        return <span className="text-xs text-slate-400">Unclassified</span>;
    }
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${KTAS_STYLE[level] ?? KTAS_STYLE["05"]}`}
        >
      {/* {level}급 */}
      Level {codeToNumber(level)}
    </span>
    );
}

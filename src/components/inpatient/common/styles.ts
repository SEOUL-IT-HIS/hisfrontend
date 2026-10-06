/**
 * 입원 화면 공용 클래스 — 공통 컴포넌트(@/components/common)와 같은 모양을 내기 위한 값
 * - FIELD: 공통 Input/Select와 동일한 테두리·포커스. textarea·datetime 같은 공통 컴포넌트가 없는 입력에도 그대로 씀
 * - LABEL: 공통 FormField 라벨과 동일
 * - INFO_ROW: 상세 화면 "라벨 : 값" 한 줄 (SectionCard의 InfoRow와 동일)
 */
export const FIELD =
  "min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 disabled:text-slate-500";

export const LABEL = "mb-1.5 block text-sm font-semibold text-slate-700";

export const INFO_ROW = "flex justify-between gap-4 border-b border-slate-100 px-5 py-3 text-sm last:border-b-0";

/** 입력값 경고 문구 (예: 활력징후 범위 벗어남) */
export const WARNING = "mt-1 text-xs text-rose-600";

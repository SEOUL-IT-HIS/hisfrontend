/**
 * 상단 바
 */
export default function Header() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-xs font-bold tracking-wide text-white">
          HIS
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-slate-900">
            Hospital Information System
          </h1>
          <p className="text-[11px] text-slate-400">테스트 의원 · Admin Console</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/15 sm:inline-flex">
          운영중
        </span>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[10px] font-semibold text-white">
            AD
          </span>
          <span className="hidden text-xs font-medium text-slate-700 sm:inline">Admin</span>
        </div>
      </div>
    </header>
  );
}

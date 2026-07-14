type HeaderProps = {
  title?: string;
};

export default function Header({ title = "차트" }: HeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-4">
      <h1 className="min-w-16 text-base font-semibold text-slate-800">{title}</h1>

      <div className="flex flex-1 items-center gap-2">
        <div className="relative max-w-xl flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </span>
          <input
            type="search"
            placeholder="환자 검색"
            className="h-9 w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:bg-white"
          />
        </div>
        <button
          type="button"
          className="h-9 shrink-0 rounded-full bg-sky-500 px-4 text-sm font-medium text-white hover:bg-sky-600"
        >
          신규환자
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="알림"
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 7H3s3 0 3-7" />
            <path d="M10 19a2 2 0 0 0 4 0" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="프로필"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700"
        >
          ME
        </button>
      </div>
    </header>
  );
}

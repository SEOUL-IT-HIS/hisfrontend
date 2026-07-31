/**
 * 상단 바
 * - 메뉴와 무관하게 HSP 고정
 */
export default function Header() {
  return (
    <header className="flex h-14 shrink-0 items-center border-b border-slate-200 bg-white px-4">
      <h1 className="text-base font-semibold text-slate-800">HSP</h1>
    </header>
  );
}

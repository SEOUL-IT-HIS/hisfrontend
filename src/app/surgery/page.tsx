import Link from "next/link";

/**
 * 수술관리 서비스 진입 페이지
 *
 * <p>경로: /surgery (§8.1 app/{service}/page.tsx)
 * 백엔드가 구현된 기능만 링크한다. 동의서·체크리스트·간호기록 등은 백엔드가 아직
 * 빈 스텁이라 화면을 두지 않는다.</p>
 */
const MENUS = [
  {
    href: "/surgery/room/list",
    label: "수술실 관리",
    desc: "SL2-6 조회 / SL2-7 등록",
  },
  {
    href: "/surgery/equipment/list",
    label: "수술장비 관리",
    desc: "SL2-9 조회 / SL2-10 등록",
  },
  { href: "/surgery/schedule/list", label: "수술 일정", desc: "SL2-25 조회" },
  {
    href: "/surgery/schedule/register",
    label: "수술 스케줄 등록",
    desc: "SL2-36",
  },
];

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <h1 className="mb-6 text-lg font-semibold text-slate-800">수술관리</h1>
      <ul className="flex flex-col gap-3">
        {MENUS.map((menu) => (
          <li key={menu.href}>
            <Link
              href={menu.href}
              className="block rounded-lg border border-slate-200 p-4 hover:border-sky-400"
            >
              <span className="text-sm font-medium text-slate-800">
                {menu.label}
              </span>
              <span className="ml-2 text-xs text-slate-500">{menu.desc}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

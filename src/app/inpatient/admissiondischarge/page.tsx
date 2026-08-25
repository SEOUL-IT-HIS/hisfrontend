import Link from "next/link";

const MENUS = [
  
  {
    href: "/inpatient/admissiondischarge/admission/list",
    label: "입원요청",
    desc: "입원 목록 조회",
  },
  {
    href: "/inpatient/admissiondischarge/discharge/list",
    label: "퇴원요청",
    desc: "퇴원 목록 조회",
  },

 
];

export default function InpatientPage() {
  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <h1 className="mb-6 text-lg font-semibold text-slate-800">입퇴원관리</h1>
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

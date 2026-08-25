import Link from "next/link";

const MENUS = [
  
  {
    href: "/inpatient/nursingrecord/riskassessment/list",
    label: "위험도 평가",
    desc: "위험도 평가 목록",
  },
  {
    href: "/inpatient/nursingrecord/vitalsign/list",
    label: "간호기록",
    desc: "간호기록 목록",
  },
 
 
];

export default function InpatientPage() {
  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <h1 className="mb-6 text-lg font-semibold text-slate-800">간호기록관리</h1>
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

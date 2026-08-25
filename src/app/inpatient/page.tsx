import Link from "next/link";

const MENUS = [
  {
    href: "/inpatient/admissiondischarge/admission/list",
    label: "입원요청",
    desc: "입퇴원 목록 조회",
  },
  {
    href: "/inpatient/bedmanagement/bedstatus/list",
    label: "병상 현황",
    desc: "병상 현황판",
  },
  {
    href: "/inpatient/bedmanagement/bedassignment/list",
    label: "병상 배정",
    desc: "병상 배정 목록",
  },
  {
    href: "/inpatient/bedmanagement/bedreservation/list",
    label: "병상 예약",
    desc: "병상 예약 목록",
  },
  {
    href: "/inpatient/nursingrecord/vitalsign/list",
    label: "간호기록",
    desc: "활력징후(Vital Sign) 목록",
  },
];

export default function InpatientPage() {
  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <h1 className="mb-6 text-lg font-semibold text-slate-800">병동관리</h1>
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

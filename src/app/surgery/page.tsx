import Link from "next/link";

/**
 * 수술관리 서비스 진입 페이지
 *
 * <p>경로: /surgery (§8.1 app/{service}/page.tsx)</p>
 *
 * <p>사이드바 메뉴(admin-service 소유)와 같은 순서·같은 경로로 맞췄다.
 * 메뉴에서 들어오든 여기서 들어오든 같은 화면에 닿아야 한다.</p>
 *
 * <p>수술 요청 '등록' 화면이 없는 이유 — 일반 수술은 진료가, 응급 수술은 응급실이
 * 요청한다. 수술은 요청을 받아 배정·진행을 관리할 뿐 등록 화면을 갖지 않는다(§21.1).</p>
 */
const MENUS = [
  {
    href: "/surgery/room",
    label: "수술실 / 수술장비 관리",
    desc: "마스터 등록·상태 관리",
    ready: true,
  },
  {
    href: "/surgery/schedule",
    label: "수술 스케줄링 관리",
    desc: "요청 배정 · 전체 일정",
    ready: true,
  },
  {
    href: "/surgery/monitoring",
    label: "수술 현황 모니터링",
    desc: "금일 예정·진행 건, 시작·종료",
    ready: true,
  },
  {
    href: "/surgery/consent",
    label: "수술 동의서 관리",
    desc: "동의 확인 기록·조회",
    ready: true,
  },
  {
    href: "/surgery/anesthesia",
    label: "마취 관리",
    desc: "마취기록 · 활력징후",
    ready: true,
  },
  {
    href: "/surgery/record",
    label: "수술 기록 관리",
    desc: "수술기록지 작성·조회",
    ready: true,
  },
  {
    href: "/surgery/checklist",
    label: "수술 안전 체크리스트 관리",
    desc: "화면 준비 중 — 백엔드 완료",
    ready: false,
  },
  {
    href: "/surgery/nursingrecord",
    label: "수술 간호 기록 관리",
    desc: "화면 준비 중 — 백엔드 완료",
    ready: false,
  },
  {
    href: "/surgery/billinglink",
    label: "수술 견적/청구 연계 관리",
    desc: "보류 — 수납 팀과 계약 협의 중",
    ready: false,
  },
];

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <h1 className="mb-1 text-lg font-semibold text-slate-800">수술관리</h1>
      <p className="mb-6 text-sm text-slate-600">
        진료·응급실이 올린 수술 요청을 배정하고, 수술 전후 기록을 관리합니다.
      </p>

      <ul className="flex flex-col gap-3">
        {MENUS.map((menu) => (
          <li key={menu.href}>
            <Link
              href={menu.href}
              className={`block rounded-lg border p-4 hover:border-sky-400 ${
                menu.ready
                  ? "border-slate-200"
                  : "border-slate-100 bg-slate-50"
              }`}
            >
              <span
                className={`text-sm font-medium ${
                  menu.ready ? "text-slate-800" : "text-slate-500"
                }`}
              >
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

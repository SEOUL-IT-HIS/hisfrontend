import Link from "next/link";
import { PageHeader, Panel } from "@/components/common";

type QuickLink = {
  label: string;
  href: string;
};

type QuickLinkGroup = {
  title: string;
  links: QuickLink[];
};

/**
 * 임시 내비게이션 — 정식 사이드바 메뉴 등록 전까지 약제파트 화면들을
 * 한곳에서 테스트/이동하기 위한 화면 내 링크 모음. 사이드바(admin-service
 * 메뉴 테이블)와는 무관하며, 이 페이지 안에서만 쓰인다.
 */
const groups: QuickLinkGroup[] = [
  {
    title: "약품 관리",
    links: [
      { label: "약품 목록조회", href: "/pharmacy/list" },
      { label: "약품 등록", href: "/pharmacy/medication/register" },
    ],
  },
  {
    title: "입출고 관리",
    links: [
      { label: "입고 등록", href: "/pharmacy/receipt" },
      { label: "입고 조회", href: "/pharmacy/receipt/list" },
      { label: "출고 등록", href: "/pharmacy/issuance" },
      { label: "출고 조회", href: "/pharmacy/issuance/list" },
    ],
  },
  {
    title: "재고 관리",
    links: [
      { label: "약품 재고 조회", href: "/pharmacy/stock" },
      { label: "약품 폐기 등록", href: "/pharmacy/stock/disposal" },
    ],
  },
  {
    title: "처방전",
    links: [{ label: "처방전 목록조회", href: "/pharmacy/prescription" }],
  },
];

export default function PharmacyHome() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader
        title="약국(PHM)"
        description="정식 사이드바 메뉴 등록 전 임시 내비게이션입니다. 테스트용으로만 사용합니다."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {groups.map((group) => (
          <Panel key={group.title} className="p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">
              {group.title}
            </h3>
            <ul className="flex flex-col gap-1">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block rounded-lg px-3 py-1.5 text-sm text-sky-700 transition-colors hover:bg-sky-50"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
    </div>
  );
}

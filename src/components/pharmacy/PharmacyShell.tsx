"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type PharmacyGroup = "inventory" | "controlled" | "masterData";

type PharmacyTab = {
  label: string;
  href: string;
  /** href와 정확히 같지 않아도 이 접두사로 시작하는 경로면 이 탭을 활성으로 본다 (예: 약품 상세 화면) */
  alsoActiveForPrefixes?: string[];
  /** alsoActiveForPrefixes에 걸려도 이 경로들은 제외한다 */
  excludePaths?: string[];
};

/**
 * 업무 그룹별 탭 — PharmacyHome에서 그룹을 고르면 바로 첫 업무 화면이 열리고, 그 그룹의
 * 다음 업무는 이 탭으로 이어서 처리한다(허브 페이지로 돌아가지 않아도 됨).
 * 조제 업무는 처방전 목록 → 상세 안에서 조제/불출/반납이 다 이어져서 탭이 필요 없다.
 */
const TABS: Record<PharmacyGroup, PharmacyTab[]> = {
  inventory: [
    { label: "Inventory", href: "/pharmacy/stock" },
    { label: "Low Stock", href: "/pharmacy/stock/low-stock" },
    {
      label: "Medications",
      href: "/pharmacy/list",
      alsoActiveForPrefixes: ["/pharmacy/medication/"],
      excludePaths: ["/pharmacy/medication/register"],
    },
    { label: "Receipt", href: "/pharmacy/receipt" },
    { label: "Receipt History", href: "/pharmacy/receipt/list" },
    { label: "Issuance", href: "/pharmacy/issuance" },
    { label: "Issuance History", href: "/pharmacy/issuance/list" },
    { label: "Disposal", href: "/pharmacy/stock/disposal" },
  ],
  controlled: [
    { label: "Records", href: "/pharmacy/controlled/records" },
    { label: "Receipt", href: "/pharmacy/controlled/receipt" },
    { label: "Issuance", href: "/pharmacy/controlled/issuance" },
    { label: "Disposal", href: "/pharmacy/controlled/disposal" },
  ],
  masterData: [
    { label: "Medication", href: "/pharmacy/medication/register" },
    { label: "Supplier", href: "/pharmacy/suppliers/register" },
    { label: "Storage Location", href: "/pharmacy/storage-locations/register" },
  ],
};

function isTabActive(pathname: string, tab: PharmacyTab): boolean {
  if (pathname === tab.href) return true;
  if (tab.excludePaths?.includes(pathname)) return false;
  return tab.alsoActiveForPrefixes?.some((prefix) => pathname.startsWith(prefix)) ?? false;
}

type PharmacyShellProps = {
  group: PharmacyGroup;
  children: ReactNode;
};

/**
 * 약제 업무 화면 공용 틀 — 위에 그룹 탭, 아래에 업무 화면.
 * 업무 화면이 화면보다 길면(입력 폼 등) 이 틀 안에서 스크롤되어, 창 크기를 바꿔도 입력칸이
 * 잘려 안 보이지 않는다.
 */
export default function PharmacyShell({ group, children }: PharmacyShellProps) {
  const pathname = usePathname() ?? "";

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <nav className="flex shrink-0 flex-wrap gap-1 rounded-xl border border-slate-200/80 bg-white p-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        {TABS[group].map((tab) => {
          const active = isTabActive(pathname, tab);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active ? "bg-sky-50 text-sky-700" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </div>
  );
}

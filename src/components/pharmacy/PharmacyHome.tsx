import Link from "next/link";
import { PageHeader, Panel } from "@/components/common";

type WorkGroup = {
  title: string;
  description: string;
  href: string;
  linkLabel: string;
};

/**
 * PHM 업무 묶음 4개를 고르는 화면 — 각 링크는 허브를 거치지 않고 그 묶음의 첫 업무 화면으로 바로 간다.
 * 그 묶음의 다음 업무는 업무 화면 위의 탭(PharmacyShell)으로 이어서 처리한다.
 * 이전에는 티켓이 구현될 때마다 링크를 하나씩 추가해 DB/기능 이름 기준으로 섞여 있었는데
 * (공급업체 등록 같은 어쩌다 한 번 하는 설정과 입고 등록 같은 매일 하는 업무가 같은 박스에 있었음),
 * 업무 흐름 기준(조제/재고관리/마약류/기준정보)으로 다시 묶었다(2026-10-06).
 */
const groups: WorkGroup[] = [
  {
    title: "Dispensing",
    description: "Reception through dispensing, release, and return — all handled inside this one screen.",
    href: "/pharmacy/prescription",
    linkLabel: "Open Prescription List",
  },
  {
    title: "Inventory Management",
    description: "Stock, low stock, medications, and receipt/issuance history — open a medication to register receipt, issuance, or disposal.",
    href: "/pharmacy/stock",
    linkLabel: "Open Inventory",
  },
  {
    title: "Controlled Drugs",
    description: "Records, receipt, issuance, and disposal of controlled (narcotic) drugs, each with staff and witness tracking.",
    href: "/pharmacy/controlled/records",
    linkLabel: "Open Controlled Drug Records",
  },
  {
    title: "Master Data",
    description: "One-off setup: medications, suppliers, and storage locations — switch between them with the tabs on top.",
    href: "/pharmacy/medication/register",
    linkLabel: "Open Master Data",
  },
];

export default function PharmacyHome() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader title="Pharmacy (PHM)" description="Choose a work group." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {groups.map((group) => (
          <Panel key={group.href} className="flex flex-col gap-2 p-4">
            <h3 className="text-sm font-semibold text-slate-700">{group.title}</h3>
            <p className="text-xs text-slate-500">{group.description}</p>
            <Link href={group.href} className="mt-1 inline-block text-sm text-sky-700 underline">
              {group.linkLabel}
            </Link>
          </Panel>
        ))}
      </div>
    </div>
  );
}

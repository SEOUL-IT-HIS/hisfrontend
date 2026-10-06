import Link from "next/link";
import { PageHeader, Panel } from "@/components/common";

const links = [
  { label: "Inventory", href: "/pharmacy/stock" },
  { label: "Low Stock", href: "/pharmacy/stock/low-stock" },
  {
    label: "Medication List",
    href: "/pharmacy/list",
    hint: "Click a medication to open its per-item workspace (stock, recent activity, receipt/issuance/disposal).",
  },
  { label: "Register Receipt", href: "/pharmacy/receipt" },
  { label: "Receipt History", href: "/pharmacy/receipt/list" },
  { label: "Register Issuance", href: "/pharmacy/issuance" },
  { label: "Issuance History", href: "/pharmacy/issuance/list" },
  { label: "Register Disposal", href: "/pharmacy/stock/disposal" },
];

export default function PharmacyInventoryHomePage() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader
        title="Inventory Management"
        description="Stock, receipt, issuance, and disposal for regular (non-controlled) medications."
      />
      <Panel className="max-w-md p-4">
        <ul className="flex flex-col gap-1">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block rounded-lg px-3 py-1.5 text-sm text-sky-700 transition-colors hover:bg-sky-50"
              >
                {link.label}
              </Link>
              {link.hint && <p className="px-3 text-xs text-slate-400">{link.hint}</p>}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

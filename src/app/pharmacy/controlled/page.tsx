import Link from "next/link";
import { PageHeader, Panel } from "@/components/common";

const links = [
  { label: "Register Receipt", href: "/pharmacy/controlled/receipt" },
  { label: "Register Issuance", href: "/pharmacy/controlled/issuance" },
  { label: "Register Disposal", href: "/pharmacy/controlled/disposal" },
  { label: "Records", href: "/pharmacy/controlled/records" },
];

export default function PharmacySpecialPage() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader
        title="Controlled Drug Management"
        description="Receipt, issuance, and disposal of controlled (narcotic) drugs, each with staff and witness tracking."
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
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

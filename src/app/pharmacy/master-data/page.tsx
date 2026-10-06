import Link from "next/link";
import { PageHeader, Panel } from "@/components/common";

const links = [
  { label: "Register Medication", href: "/pharmacy/medication/register" },
  { label: "Register Supplier", href: "/pharmacy/suppliers/register" },
  { label: "Register Storage Location", href: "/pharmacy/storage-locations/register" },
];

export default function PharmacyMasterDataHomePage() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader
        title="Master Data"
        description="One-off setup: medications, suppliers, and storage locations used across receipt/issuance/disposal."
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

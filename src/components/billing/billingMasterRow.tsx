"use client";

import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/common";
import type { BillingMaster } from "@/features/billing/billingMaster/types";

type BillingMasterRowProps = {
  billingMaster: BillingMaster;
};

function formatPrice(value: string): string {
  const amount = Number(value);
  return Number.isNaN(amount) ? value : `${amount.toLocaleString()}원`;
}

const BillingMasterRow = ({ billingMaster }: BillingMasterRowProps) => {
  const router = useRouter();

  return (
    <tr
      onClick={() => router.push(`/billing/statistics/${billingMaster.billingMasterId}`)}
      className="cursor-pointer border-t border-slate-50 transition-colors hover:bg-slate-50"
    >
      <td className="px-5 py-3.5">
        <span className="font-semibold text-slate-800">{billingMaster.feeName}</span>
        <span className="ml-1.5 text-xs text-slate-400">{billingMaster.feeCode}</span>
      </td>
      <td className="px-5 py-3.5 text-slate-600">{formatPrice(billingMaster.defaultPrice)}</td>
      <td className="px-5 py-3.5 text-slate-600">{billingMaster.categoryCode}</td>
      <td className="px-5 py-3.5 text-slate-600">{billingMaster.insuranceTypeCode}</td>
      <td className="px-5 py-3.5 text-slate-600">
        {billingMaster.effectiveFrom} ~ {billingMaster.effectiveTo}
      </td>
      <td className="px-5 py-3.5">
        <StatusBadge value={billingMaster.useYn} />
      </td>
    </tr>
  );
};

export default BillingMasterRow;

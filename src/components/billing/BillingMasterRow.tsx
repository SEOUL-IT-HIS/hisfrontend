"use client";

import { useRouter } from "next/navigation";
import type { BillingMaster } from "@/features/billing/billingMaster/types";

export default function BillingMasterRow({ billingMaster }: { billingMaster: BillingMaster }) {
  const router = useRouter();

  return (
    <tr className="border-t border-slate-100 hover:bg-slate-50/80">
      <td className="px-4 py-3 text-slate-800">{billingMaster.feeCode}</td>
      <td className="px-4 py-3 text-slate-800">{billingMaster.feeName}</td>
      <td className="px-4 py-3 text-slate-600">{billingMaster.defaultPrice}</td>
      <td className="px-4 py-3 text-slate-600">{billingMaster.categoryCode}</td>
      <td className="px-4 py-3 text-slate-600">{billingMaster.insuranceTypeCode}</td>
      <td className="px-4 py-3 text-slate-600">
        {billingMaster.effectiveFrom} ~ {billingMaster.effectiveTo}
      </td>
      <td className="px-4 py-3 text-slate-600">{billingMaster.useYn}</td>
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={() => router.push(`/billing/master/${billingMaster.billingMasterId}`)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-white"
        >
          상세보기
        </button>
      </td>
    </tr>
  );
}

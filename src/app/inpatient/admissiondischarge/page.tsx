import { Suspense } from "react";
import AdmissionDischargeHome from "@/components/inpatient/admissiondischarge/AdmissionDischargeHome";

// 입원 목록이 useSearchParams(?filter=, ?admissionId=)를 쓰므로 Suspense로 감쌈 (Next.js 권장 사항)
export default function AdmissionDischargePage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-500">Loading...</p>}>
      <AdmissionDischargeHome />
    </Suspense>
  );
}

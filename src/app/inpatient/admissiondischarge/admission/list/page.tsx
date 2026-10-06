import { Suspense } from "react";
import AdmissionList from "@/components/inpatient/admissiondischarge/admission/list";

// AdmissionList가 useSearchParams(?filter=, ?admissionId=)를 쓰므로 Suspense로 감쌈 (Next.js 권장 사항)
export default function AdmissionDischargeListPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-500">Loading...</p>}>
      <AdmissionList />
    </Suspense>
  );
}

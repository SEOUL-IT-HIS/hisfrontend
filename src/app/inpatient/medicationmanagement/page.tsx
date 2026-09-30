import { Suspense } from "react";
import PrescriptionRequestHome from "@/components/inpatient/medicationmanagement/PrescriptionRequestHome";

// PrescriptionRequestHome이 useSearchParams(?admissionId=)를 쓰므로 Suspense로 감쌈 (Next.js 권장 사항)
export default function MedicationManagementPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-500">Loading...</p>}>
      <PrescriptionRequestHome />
    </Suspense>
  );
}

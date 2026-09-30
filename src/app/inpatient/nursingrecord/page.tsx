import { Suspense } from "react";
import NursingRecordHome from "@/components/inpatient/nursingrecord/NursingRecordHome";

// NursingRecordHome이 useSearchParams(?admissionId=, ?tab=)를 쓰므로 Suspense로 감쌈 (Next.js 권장 사항)
export default function NursingRecordPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-500">Loading...</p>}>
      <NursingRecordHome />
    </Suspense>
  );
}

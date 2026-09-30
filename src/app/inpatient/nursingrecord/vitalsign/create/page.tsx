import { Suspense } from "react";
import VitalSignRegisterForm from "@/components/inpatient/nursingrecord/vitalsign/registerForm";

// VitalSignRegisterForm이 useSearchParams(?admissionId=)를 쓰므로 Suspense로 감쌈 (Next.js 권장 사항)
const VitalSignRegisterPage = () => {
    return (
        <Suspense fallback={<p className="p-6 text-sm text-slate-500">Loading...</p>}>
            <VitalSignRegisterForm />
        </Suspense>
    );
};

export default VitalSignRegisterPage;

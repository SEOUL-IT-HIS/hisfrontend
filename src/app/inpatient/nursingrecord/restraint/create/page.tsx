import { Suspense } from "react";
import RestraintRegisterForm from "@/components/inpatient/nursingrecord/restraint/registerForm";

// RestraintRegisterForm이 useSearchParams(?admissionId=)를 쓰므로 Suspense로 감쌈 (Next.js 권장 사항)
const RestraintRegisterPage = () => {
    return (
        <Suspense fallback={<p className="p-6 text-sm text-slate-500">Loading...</p>}>
            <RestraintRegisterForm />
        </Suspense>
    );
};

export default RestraintRegisterPage;

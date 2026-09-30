import { Suspense } from "react";
import RiskAssessmentRegisterForm from "@/components/inpatient/nursingrecord/riskassessment/registerForm";

// RiskAssessmentRegisterForm이 useSearchParams(?admissionId=)를 쓰므로 Suspense로 감쌈 (Next.js 권장 사항)
const RiskAssessmentRegisterPage = () => {
    return (
        <Suspense fallback={<p className="p-6 text-sm text-slate-500">Loading...</p>}>
            <RiskAssessmentRegisterForm />
        </Suspense>
    );
};

export default RiskAssessmentRegisterPage;

import { Suspense } from "react";
import NursingAssessmentRegisterForm from "@/components/inpatient/nursingrecord/nursingassessment/registerForm";

// NursingAssessmentRegisterForm이 useSearchParams(?admissionId=)를 쓰므로 Suspense로 감쌈 (Next.js 권장 사항)
const NursingAssessmentRegisterPage = () => {
    return (
        <Suspense fallback={<p className="p-6 text-sm text-slate-500">Loading...</p>}>
            <NursingAssessmentRegisterForm />
        </Suspense>
    );
};

export default NursingAssessmentRegisterPage;

import { Suspense } from "react";
import IandORecordRegisterForm from "@/components/inpatient/nursingrecord/iandorecord/registerForm";

// IandORecordRegisterForm이 useSearchParams(?admissionId=)를 쓰므로 Suspense로 감쌈 (Next.js 권장 사항)
const IandORecordRegisterPage = () => {
    return (
        <Suspense fallback={<p className="p-6 text-sm text-slate-500">Loading...</p>}>
            <IandORecordRegisterForm />
        </Suspense>
    );
};

export default IandORecordRegisterPage;

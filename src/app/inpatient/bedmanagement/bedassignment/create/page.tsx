import { Suspense } from "react";
import BedAssignmentRegisterForm from "@/components/inpatient/bedmanagement/bedassignment/registerForm";

const BedAssignmentRegisterPage = () => {
    return (
        <div>
            <Suspense fallback={<p>로딩중...</p>}>
                <BedAssignmentRegisterForm />
            </Suspense>
        </div>
    );
};

export default BedAssignmentRegisterPage;
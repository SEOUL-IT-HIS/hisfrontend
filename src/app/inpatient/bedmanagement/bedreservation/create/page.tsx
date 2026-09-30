import { Suspense } from "react";
import BedReservationRegisterForm from "@/components/inpatient/bedmanagement/bedreservation/registerForm";

const BedReservationRegisterPage = () => {
    return (
        <div>
            <Suspense fallback={<p>로딩중...</p>}>
                <BedReservationRegisterForm />
            </Suspense>
        </div>
    );
};

export default BedReservationRegisterPage;
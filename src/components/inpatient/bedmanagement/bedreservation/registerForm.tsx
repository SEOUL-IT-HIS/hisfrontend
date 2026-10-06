"use client";

import { AppDispatch, RootState } from "@/store/store";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MAX_RESERVATION_DAYS, useDayEnd, useDayStart, futureTimeError, useNowInput } from "@/features/inpatient/dateLimits";
import { createBedReservationRequest } from "@/features/inpatient/bedmanagement/bedreservation/slice";
import { fetchBedRequest, selectBed } from "@/features/inpatient/bedmanagement/bedstatus/slice";
import { fetchPatientListRequest } from "@/features/patient/slice/patientSlice";
import { LABEL, FIELD } from "@/components/inpatient/common/styles";
import { Alert, Button, PageHeader } from "@/components/common";


const BedReservationRegisterForm = () => {
    // 예약일시는 미래 불가(오늘까지), 입원 예정일은 오늘 ~ 30일 후 (서버 검증과 같은 기준)
    const maxReserveAt = useDayEnd();
    const minExpectedAdmissionAt = useDayStart();
    const maxExpectedAdmissionAt = useDayEnd(MAX_RESERVATION_DAYS);
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const searchParams = useSearchParams();
    const patientIdParam = searchParams.get("patientId");
    const { loading, error, success } = useSelector((state: RootState) => ({
        loading: state.inpatient.bedreservation.createStatus.loading,
        error: state.inpatient.bedreservation.createStatus.error,
        success: state.inpatient.bedreservation.createStatus.success,
    }), shallowEqual);

    const[form, setForm] = useState({
        bedId: "",
        patientId: patientIdParam ?? "",
        reserveAt: "",
        expectedAdmissionAt: "",

    });
    // 기록 시각 기본값을 지금으로 — 화면을 연 직후 한 번만 채움 (서버 렌더 땐 값이 없어서 클라이언트에서 채움)
    const nowInput = useNowInput();
    const [timePrefilled, setTimePrefilled] = useState(false);
    if (nowInput && !timePrefilled) {
        setTimePrefilled(true);
        setForm((prev) => ({ ...prev, reserveAt: prev.reserveAt || nowInput }));
    }
    // 제출 직전 미래 시각 확인 결과 (서버도 같은 기준으로 거절함)
    const [timeError, setTimeError] = useState<string | null>(null);
      const beds = useSelector(selectBed);
      const patients = useSelector((state: RootState) => state.patient.patients);
      useEffect(() => {
        dispatch(fetchBedRequest());
        dispatch(fetchPatientListRequest({}));
      }, [dispatch]);

      const emptyBeds = useMemo(
        () => beds.filter((bed) => bed.bedStatus === "EMPTY"),
        [beds]
        );

      const patientName = useMemo(
        () => patients.find((p) => p.patientId === patientIdParam)?.patientName ?? patientIdParam,
        [patients, patientIdParam]
      );

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((prevForm) => ({...prevForm, [name]: value }));}

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const futureError = futureTimeError(form.reserveAt, "Reserved at");
        setTimeError(futureError);
        if (futureError) return;
        dispatch(createBedReservationRequest({ ...form }));
    };
    useEffect(() => {
        if (success) {
            router.push("/inpatient/bedmanagement/bedreservation/list");
        }
    }, [success, router]);
    return (
        <div className="mx-auto flex w-full max-w-lg flex-col gap-4 p-6">
            <PageHeader title="Register Bed Reservation" description="Reserve a bed in advance for a patient who has not yet been admitted." />

            {loading && <p className="text-sm text-slate-400">Loading...</p>}
            {error && <Alert>{error}</Alert>}
            {timeError && <Alert>{timeError}</Alert>}

            <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <div>
                    <label htmlFor="bedId" className={LABEL}>Bed</label>
                    <select id="bedId" name="bedId" value={form.bedId} onChange={onChange} required className={FIELD}>
                        <option value="">Select</option>
                        {emptyBeds.map((bed) => (
                            <option key={bed.bedId} value={bed.bedId}>
                                Room {bed.roomNo}, Bed {bed.bedNo}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="patientId" className={LABEL}>Patient</label>
                    {patientIdParam ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">{patientName}</div>
                    ) : (
                        <select id="patientId" name="patientId" value={form.patientId} onChange={onChange} required className={FIELD}>
                            <option value="">Select</option>
                            {patients.map((patient) => (
                                <option key={patient.patientId} value={patient.patientId}>
                                    {patient.patientName}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                <div>
                    <label htmlFor="reserveAt" className={LABEL}>Reserved At</label>
                    <input type="datetime-local" id="reserveAt" name="reserveAt" max={maxReserveAt} value={form.reserveAt} onChange={onChange} required className={FIELD} />
                </div>
                <div>
                    <label htmlFor="expectedAdmissionAt" className={LABEL}>Expected Admission At</label>
                    <input type="datetime-local" id="expectedAdmissionAt" name="expectedAdmissionAt" min={minExpectedAdmissionAt} max={maxExpectedAdmissionAt} value={form.expectedAdmissionAt} onChange={onChange} required className={FIELD} />
                </div>
                <Button className="w-full"
                    type="submit"
                    disabled={loading}
                >
                    Register
                </Button>
            </form>
        </div>
    );
}
export default BedReservationRegisterForm;

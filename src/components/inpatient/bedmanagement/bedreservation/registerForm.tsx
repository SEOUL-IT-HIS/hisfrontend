"use client";

import { AppDispatch, RootState } from "@/store/store";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createBedReservationRequest } from "@/features/inpatient/bedmanagement/bedreservation/slice";
import { fetchBedRequest, selectBed } from "@/features/inpatient/bedmanagement/bedstatus/slice";
import { fetchPatientListRequest } from "@/features/patient/slice/patientSlice";

const LABEL = "mb-1 block text-sm font-medium text-slate-700";
const FIELD = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

const BedReservationRegisterForm = () => {
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
        dispatch(createBedReservationRequest({ ...form }));
    };
    useEffect(() => {
        if (success) {
            router.push("/inpatient/bedmanagement/bedreservation/list");
        }
    }, [success, router]);
    return (
        <div className="mx-auto w-full max-w-lg p-6">
            <div className="mb-6">
                <h1 className="text-lg font-semibold text-slate-800">Register Bed Reservation</h1>
                <p className="mt-1 text-sm text-slate-500">Reserve a bed in advance for a patient who has not yet been admitted.</p>
            </div>

            {loading && <p className="mb-3 text-sm text-slate-500">Loading...</p>}
            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

            <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                    <label htmlFor="bedId" className={LABEL}>Bed ID</label>
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
                        <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{patientName}</div>
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
                    <input type="datetime-local" id="reserveAt" name="reserveAt" value={form.reserveAt} onChange={onChange} required className={FIELD} />
                </div>
                <div>
                    <label htmlFor="expectedAdmissionAt" className={LABEL}>Expected Admission At</label>
                    <input type="datetime-local" id="expectedAdmissionAt" name="expectedAdmissionAt" value={form.expectedAdmissionAt} onChange={onChange} required className={FIELD} />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
                >
                    Register
                </button>
            </form>
        </div>
    );
}
export default BedReservationRegisterForm;

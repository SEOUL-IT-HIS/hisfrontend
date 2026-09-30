"use client";

import { AppDispatch, RootState } from "@/store/store";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { createBedAssignmentRequest } from "@/features/inpatient/bedmanagement/bedassignment/slice";
import { fetchBedRequest, selectBed } from "@/features/inpatient/bedmanagement/bedstatus/slice";
import { fetchAdmissionsRequest, selectAdmissions } from "@/features/inpatient/admissiondischarge/slice";
import { fetchBedAssignmentsRequest, selectBedAssignments } from "@/features/inpatient/bedmanagement/bedassignment/slice";

const LABEL = "mb-1 block text-sm font-medium text-slate-700";
const FIELD = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

const BedAssignmentRegisterForm = () => {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const searchParams = useSearchParams();
    // 입원 상세 화면의 "병상 배정하기" 링크(?admissionId=...)를 타고 들어왔을 때만 값이 있음.
    // 값이 있으면 입원ID를 고정 표시(아래 JSX 참고), 없으면 직접 드롭다운에서 고르게 함
    const admissionIdParam = searchParams.get("admissionId");
    const { loading, error, success } = useSelector((state: RootState) => ({
        loading: state.inpatient.bedmanagement.createStatus.loading,
        error: state.inpatient.bedmanagement.createStatus.error,
        success: state.inpatient.bedmanagement.createStatus.success,
    }), shallowEqual);
    const beds = useSelector(selectBed);
    const admissions = useSelector(selectAdmissions);
    // "이미 배정된 입원건"을 걸러내기 위해 배정 목록 전체를 따로 불러옴 (아래 assignedAdmissionIds에서 사용)
    const bedAssignments = useSelector(selectBedAssignments);
    const[form, setForm] = useState({
        bedId: "",
        // admissionIdParam이 있으면(링크로 진입) 폼 최초값으로 미리 채워둠
        admissionId: admissionIdParam ?? "",
        assignedAt: "",
        releasedAt: "",
    });

    // 모든 입력 필드가 공유하는 change 핸들러 — name 속성으로 어떤 필드인지 구분해서 그 값만 갱신
    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {

        const { name, value } = e.target;
        setForm((prevForm) => ({...prevForm, [name]: value }));}

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // 새로 만드는 배정은 아직 퇴상 안 된 상태이므로 releasedAt은 항상 null로 고정해서 보냄
        dispatch(createBedAssignmentRequest({ ...form, releasedAt: null }));
    };
    // 화면 진입 시 드롭다운 채우기용 데이터 3종 세트를 각각 불러옴:
    // beds(빈 병상 고르기), admissions(입원건 고르기), bedAssignments(이미 배정된 입원건 제외용)
    useEffect(() => {
        dispatch(fetchBedRequest());
        dispatch(fetchAdmissionsRequest());
        dispatch(fetchBedAssignmentsRequest());
    }, [dispatch]);
    // 병상ID 드롭다운엔 EMPTY(빈 병상)만 노출 — 이미 사용중/예약된 병상은 선택 못 하게 막음
    const emptyBeds = useMemo(() => beds.filter((bed) => bed.bedStatus === "EMPTY"), [beds]);

    // 아직 퇴상 처리 안 된(releasedAt === null) 배정 건들의 admissionId만 뽑음
    // = "현재 이미 병상이 배정되어 있는 입원건" 목록
    const assignedAdmissionIds = useMemo( () => bedAssignments.filter((ba)=>ba.releasedAt === null).map((ba) => ba.admissionId), [bedAssignments]);
    // 전체 입원건에서 위에서 뽑은 "이미 배정된 입원건"을 제외 → 한 입원건이 병상 두 개에 중복 배정되는 것을 방지
    const availableAdmissions = useMemo(() => admissions.filter((admission) => !assignedAdmissionIds.includes(admission.admissionId)), [admissions, assignedAdmissionIds]);

    // 등록 성공하면 목록 화면으로 돌려보냄
    // useEffect(() => {
    //     if (success) {
    //         router.push("/inpatient/bedmanagement/bedassignment/list");
    //     }
    // }, [success, router]);
    const lastBedAssignment = bedAssignments[bedAssignments.length - 1];
    const assignedBed = beds.find((bed) => bed.bedId === lastBedAssignment?.bedId);
    if (success && lastBedAssignment) {
  return (
    <div className="mx-auto w-full max-w-lg p-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-700">
          Assignment complete: Room {assignedBed?.roomNo}, Bed {assignedBed?.bedNo}.
        </p>
        <div className="mt-4 flex gap-2">
          {admissionIdParam && (
            <button
              onClick={() => router.push(`/inpatient/admissiondischarge/admission/detail?admissionId=${admissionIdParam}`)}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white"
            >
              Back to Admission Details
            </button>
          )}
          <button
            onClick={() => router.push(`/inpatient/bedmanagement/bedassignment/list?highlight=${lastBedAssignment.assignmentId}`)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            View in Assignment List
          </button>
        </div>
      </div>
    </div>
  );
}

    return (
        <div className="mx-auto w-full max-w-lg p-6">
            <div className="mb-6">
                <h1 className="text-lg font-semibold text-slate-800">Register Bed Assignment</h1>
                <p className="mt-1 text-sm text-slate-500">Assign a patient to a bed.</p>
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
                    <label htmlFor="admissionId" className={LABEL}>Admission ID</label>
                    {/* 링크로 admissionId를 받아 들어왔으면 수정 못 하게 고정 표시, 아니면 드롭다운으로 직접 선택 */}
                    {admissionIdParam ? (
                        <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{form.admissionId}</div>
                    ) : (
                        <select id="admissionId" name="admissionId" value={form.admissionId} onChange={onChange} required className={FIELD}>
                            <option value="">Select</option>
                            {availableAdmissions.map((admission) => (
                                <option key={admission.admissionId} value={admission.admissionId}>
                                    {admission.admissionId}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                <div>
                    <label htmlFor="assignedAt" className={LABEL}>Assigned At</label>
                    <input type="datetime-local" id="assignedAt" name="assignedAt" value={form.assignedAt} onChange={onChange} required className={FIELD} />
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
export default BedAssignmentRegisterForm;

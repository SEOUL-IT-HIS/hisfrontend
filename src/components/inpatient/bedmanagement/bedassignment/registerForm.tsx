"use client";

import { AppDispatch, RootState } from "@/store/store";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo, useSyncExternalStore } from "react";
import { createBedAssignmentRequest } from "@/features/inpatient/bedmanagement/bedassignment/slice";
import { fetchBedRequest, selectBed } from "@/features/inpatient/bedmanagement/bedstatus/slice";
import { fetchAdmissionsRequest, selectAdmissions } from "@/features/inpatient/admissiondischarge/slice";
import { fetchBedAssignmentsRequest, selectBedAssignments } from "@/features/inpatient/bedmanagement/bedassignment/slice";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";

const LABEL = "mb-1 block text-sm font-medium text-slate-700";
const FIELD = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

// 병실 유형 코드(bed.roomTypeCode) → 표시 라벨 (입원료 매핑과 같은 기준: 01 1인실 / 02 다인실)
const ROOM_TYPE_LABEL: Record<string, string> = { "01": "Single", "02": "Multi" };

// 배정일시 입력 하한 = 오늘 00:00 (datetime-local 형식 "YYYY-MM-DDTHH:mm", 브라우저 로컬 시간 기준)
// 날짜(일) 기준으로만 막음 — 오늘 아침에 배정한 것을 지금 입력하는 경우는 허용 (서버 검증과 같은 기준)
const todayStartLocal = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T00:00`;
};
// 구독할 외부 변화가 없으므로 아무것도 하지 않음 (useSyncExternalStore용)
const noopSubscribe = () => () => {};

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

    // 배정일시 하한은 브라우저에서만 계산 (서버 렌더에서는 undefined)
    // — 서버(UTC)와 브라우저(KST)의 "오늘"이 달라 생기는 hydration 불일치 방지
    const minAssignedAt = useSyncExternalStore(noopSubscribe, todayStartLocal, () => undefined);

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

    // 병동 코드(WARD_CD) → 병동명. 공통코드를 못 불러오면 코드값 그대로 표시
    const { options: wardOptions } = useCommonCodeOptions("WARD_CD");
    const wardNameByCd = useMemo(() => new Map(wardOptions.map((opt) => [opt.value, opt.label])), [wardOptions]);
    const wardLabel = (wardCd: string | null) => (wardCd ? wardNameByCd.get(wardCd) ?? wardCd : "No Ward");

    // 지금 배정하려는 입원 건 — 응급에서 온 건이면 희망 병동/격리 여부를 보여주고, 희망 병동을 목록 맨 위로 올림
    const selectedAdmission = admissions.find((a) => a.admissionId === form.admissionId) ?? null;
    const preferredWard = selectedAdmission?.wardPref ?? null;

    // 빈 병상을 병동별로 묶음 (희망 병동 먼저, 나머지는 병동 코드 순) → 드롭다운에서 <optgroup>으로 병동 구분
    const emptyBedsByWard = useMemo(() => {
        const groups = new Map<string, typeof emptyBeds>();
        emptyBeds.forEach((bed) => {
            const key = bed.wardCd ?? "";
            groups.set(key, [...(groups.get(key) ?? []), bed]);
        });
        return Array.from(groups.entries())
            .map(([wardCd, wardBeds]) => ({
                wardCd: wardCd || null,
                beds: [...wardBeds].sort((a, b) => a.bedId.localeCompare(b.bedId)),
            }))
            .sort((a, b) => {
                if (a.wardCd === preferredWard) return -1;
                if (b.wardCd === preferredWard) return 1;
                return (a.wardCd ?? "").localeCompare(b.wardCd ?? "");
            });
    }, [emptyBeds, preferredWard]);
    const selectedBed = emptyBeds.find((bed) => bed.bedId === form.bedId) ?? null;
    const preferredWardHasBed = !!preferredWard && emptyBeds.some((bed) => bed.wardCd === preferredWard);

    // 아직 퇴상 처리 안 된(releasedAt === null) 배정 건들의 admissionId만 뽑음
    // = "현재 이미 병상이 배정되어 있는 입원건" 목록
    const assignedAdmissionIds = useMemo( () => bedAssignments.filter((ba)=>ba.releasedAt === null).map((ba) => ba.admissionId), [bedAssignments]);
    // 병상을 새로 배정할 대상 = 입원요청(REQUESTED) 상태이면서 아직 병상이 없는 입원건
    // - 이미 배정된 건 제외 → 한 입원건이 병상 두 개에 중복 배정되는 것을 방지
    // - 퇴원신청/퇴원완료 건 제외 → 퇴원하면서 병상이 해제된 건이 "병상 없음"으로 다시 목록에 나오던 문제 방지
    const availableAdmissions = useMemo(
        () => admissions.filter(
            (admission) => admission.status === "REQUESTED" && !assignedAdmissionIds.includes(admission.admissionId),
        ),
        [admissions, assignedAdmissionIds],
    );

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
          Assignment complete: {wardLabel(assignedBed?.wardCd ?? null)} · Room {assignedBed?.roomNo}, Bed {assignedBed?.bedNo}.
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
                {/* 응급 입원요청 건이면 배정 전에 희망 병동/격리 여부를 확인할 수 있게 표시 */}
                {selectedAdmission?.dispositionId && (
                    <div className="space-y-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm">
                        <p className="font-medium text-rose-800">Emergency Request</p>
                        <p className="text-rose-700">
                            Preferred Ward: {preferredWard ? wardLabel(preferredWard) : "-"}
                            {preferredWard && !preferredWardHasBed && " (no empty bed — choose another ward)"}
                        </p>
                        {selectedAdmission.isolationYn === "Y" && (
                            <p className="font-medium text-rose-700">Isolation required — assign an isolation / single room</p>
                        )}
                    </div>
                )}
                <div>
                    <label htmlFor="bedId" className={LABEL}>Bed</label>
                    {/* 병동별로 묶어서 표시 — 어느 병동의 병상에 배정하는지 바로 보이게 */}
                    <select id="bedId" name="bedId" value={form.bedId} onChange={onChange} required className={FIELD}>
                        <option value="">Select</option>
                        {emptyBedsByWard.map(({ wardCd, beds: wardBeds }) => (
                            <optgroup
                                key={wardCd ?? "none"}
                                label={`${wardLabel(wardCd)}${wardCd && wardCd === preferredWard ? " (Preferred)" : ""}`}
                            >
                                {wardBeds.map((bed) => (
                                    <option key={bed.bedId} value={bed.bedId}>
                                        {wardLabel(bed.wardCd)} · Room {bed.roomNo}, Bed {bed.bedNo}
                                        {bed.roomTypeCode ? ` · ${ROOM_TYPE_LABEL[bed.roomTypeCode] ?? bed.roomTypeCode}` : ""}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                    {selectedBed && (
                        <p className="mt-1 text-xs text-slate-500">
                            Ward: <span className="font-medium text-slate-700">{wardLabel(selectedBed.wardCd)}</span>
                            {" · "}{selectedBed.bedId}
                        </p>
                    )}
                    {emptyBeds.length === 0 && <p className="mt-1 text-xs text-rose-600">No empty beds available.</p>}
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
                    {/* min: 오늘 이전 날짜는 달력에서 선택 불가, 직접 입력해도 제출 시 브라우저가 막음 (서버에서도 한 번 더 검증) */}
                    <input type="datetime-local" id="assignedAt" name="assignedAt" value={form.assignedAt} onChange={onChange} min={minAssignedAt} required className={FIELD} />
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

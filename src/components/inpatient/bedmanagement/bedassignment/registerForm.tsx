"use client";

import { AppDispatch, RootState } from "@/store/store";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { formatDateTime, useDayEnd, useDayStart, futureTimeError, useNowInput } from "@/features/inpatient/dateLimits";
import { fetchPatientListRequest } from "@/features/patient/slice/patientSlice";
import { useDepartmentNames } from "@/features/commonCode/hooks/useDepartmentNames";
import { createBedAssignmentRequest, resetBedAssignmentCreateStatus } from "@/features/inpatient/bedmanagement/bedassignment/slice";
import { fetchBedRequest, selectBed } from "@/features/inpatient/bedmanagement/bedstatus/slice";
import { fetchAdmissionsRequest, selectAdmissions } from "@/features/inpatient/admissiondischarge/slice";
import { fetchBedAssignmentsRequest, selectBedAssignments } from "@/features/inpatient/bedmanagement/bedassignment/slice";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import { LABEL, FIELD } from "@/components/inpatient/common/styles";
import { Alert, Button, PageHeader } from "@/components/common";


// 병실 유형 코드(bed.roomTypeCode) → 표시 라벨 (admin ROOM_TYPE_CD: 01 1인실 / 02 다인실 / 03 격리실 / 04 특실)
const ROOM_TYPE_LABEL: Record<string, string> = { "01": "Single", "02": "Multi", "03": "Isolation", "04": "VIP" };
// 격리 환자에게 허용하는 병실 유형 — 서버(BedAssignmentServiceImpl)와 같은 기준
const ISOLATION_ALLOWED_ROOM_TYPES = ["01", "03", "04"];

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
    // 기록 시각 기본값을 지금으로 — 화면을 연 직후 한 번만 채움 (서버 렌더 땐 값이 없어서 클라이언트에서 채움)
    const nowInput = useNowInput();
    const [timePrefilled, setTimePrefilled] = useState(false);
    if (nowInput && !timePrefilled) {
        setTimePrefilled(true);
        setForm((prev) => ({ ...prev, assignedAt: prev.assignedAt || nowInput }));
    }
    // 제출 직전 미래 시각 확인 결과 (서버도 같은 기준으로 거절함)
    const [timeError, setTimeError] = useState<string | null>(null);

    // 배정일시는 오늘만 선택 가능 (지난 날짜로 새로 배정 불가, 배정하는 순간 병상이 사용중이 되므로 미래도 불가)
    // 화면 입력은 날짜 단위로만 막고, "지금 이후 시각"은 제출하는 순간 futureTimeError로 확인 (서버도 한 번 더 검증)
    const minAssignedAt = useDayStart();
    const maxAssignedAt = useDayEnd();

    // 모든 입력 필드가 공유하는 change 핸들러 — name 속성으로 어떤 필드인지 구분해서 그 값만 갱신
    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {

        const { name, value } = e.target;
        setForm((prevForm) => ({...prevForm, [name]: value }));}

    // 이 화면에서 실제로 등록을 눌렀는지 — 이전에 남은 "등록 성공" 상태로 들어오자마자 이동하는 것을 막음
    const [submitted, setSubmitted] = useState(false);
    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const futureError = futureTimeError(form.assignedAt, "Assigned at");
        setTimeError(futureError);
        if (futureError) return;
        setSubmitted(true);
        // 새로 만드는 배정은 아직 퇴상 안 된 상태이므로 releasedAt은 항상 null로 고정해서 보냄
        dispatch(createBedAssignmentRequest({ ...form, releasedAt: null }));
    };
    // 화면 진입 시 드롭다운 채우기용 데이터 3종 세트를 각각 불러옴:
    // beds(빈 병상 고르기), admissions(입원건 고르기), bedAssignments(이미 배정된 입원건 제외용)
    useEffect(() => {
        dispatch(fetchBedRequest());
        dispatch(fetchAdmissionsRequest());
        dispatch(fetchBedAssignmentsRequest());
        dispatch(fetchPatientListRequest({}));
    }, [dispatch]);
    // 지금 배정하려는 입원 건 — 응급에서 온 건이면 희망 병동/격리 여부를 보여주고, 희망 병동을 목록 맨 위로 올림
    const selectedAdmission = admissions.find((a) => a.admissionId === form.admissionId) ?? null;
    const preferredWard = selectedAdmission?.wardPref ?? null;
    const isolationRequired = selectedAdmission?.isolationYn === "Y";

    // 병상ID 드롭다운엔 EMPTY(빈 병상)만 노출 — 이미 사용중/예약된 병상은 선택 못 하게 막음
    // 격리 환자면 1인실 · 격리실 · 특실만 (다인실은 다른 환자와 같은 방이라 불가 — 서버에서도 거절함)
    const emptyBeds = useMemo(
        () =>
            beds.filter(
                (bed) =>
                    bed.bedStatus === "EMPTY" &&
                    (!isolationRequired || ISOLATION_ALLOWED_ROOM_TYPES.includes(bed.roomTypeCode ?? "")),
            ),
        [beds, isolationRequired],
    );

    // 병동 코드(WARD_CD) → 병동명. 공통코드를 못 불러오면 코드값 그대로 표시
    const { options: wardOptions } = useCommonCodeOptions("WARD_CD");
    const wardNameByCd = useMemo(() => new Map(wardOptions.map((opt) => [opt.value, opt.label])), [wardOptions]);
    const wardLabel = (wardCd: string | null) => (wardCd ? wardNameByCd.get(wardCd) ?? wardCd : "No Ward");

    // 빈 병상을 병동별로 묶음 (희망 병동 먼저, 나머지는 병동 코드 순) → 드롭다운에서 <optgroup>으로 병동 구분
    // (병상 수십 개라 매번 계산해도 가벼움 — React Compiler가 자동으로 메모이즈)
    const emptyBedsByWard = (() => {
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
    })();
    const selectedBed = emptyBeds.find((bed) => bed.bedId === form.bedId) ?? null;
    const preferredWardHasBed = !!preferredWard && emptyBeds.some((bed) => bed.wardCd === preferredWard);

    // 입원 건 표시용 — 입원 ID 대신 "환자명 · 입원일 · 진료과"로 보여줌
    const patients = useSelector((state: RootState) => state.patient.patients);
    const patientNameById = new Map(patients.map((p) => [p.patientId, p.patientName]));
    const { names: deptNames } = useDepartmentNames();
    const admissionLabel = (admission: (typeof admissions)[number]) =>
        [
            patientNameById.get(admission.patientId) ?? "Unknown patient",
            formatDateTime(admission.admissionDate).slice(0, 10),
            admission.admissionDeptId ? deptNames[admission.admissionDeptId] ?? admission.admissionDeptId : null,
        ]
            .filter(Boolean)
            .join(" · ");
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

    // 등록 성공하면 별도 완료 화면 없이 들어온 목록으로 바로 돌아감 (replace — 뒤로가기로 등록 폼에 다시 오지 않게)
    // - 입원 상세에서 들어왔으면 입퇴원 목록의 "Waiting (Bed Assigned)" 필터로 가서 방금 배정한 입원 건을 선택해 둠
    //   (배정되면 "Assignment Needed"에서 빠지므로, 그대로 두면 방금 처리한 건이 목록에서 사라진 것처럼 보임)
    // - 병상현황 탭에서 들어왔으면 병상현황 탭
    // - 그 외(병상배정 탭)는 병상배정 탭으로 가서 방금 만든 배정을 선택(상세 패널)해 둠
    const from = searchParams.get("from");
    useEffect(() => {
        if (!submitted || !success) return;
        const created = bedAssignments[bedAssignments.length - 1];
        dispatch(resetBedAssignmentCreateStatus());
        if (admissionIdParam) {
            router.replace(`/inpatient/admissiondischarge?filter=waitingAssigned&admissionId=${admissionIdParam}`);
        } else if (from === "status") {
            router.replace("/inpatient/bedmanagement?tab=status");
        } else {
            router.replace(`/inpatient/bedmanagement?tab=assignment${created ? `&highlight=${created.assignmentId}` : ""}`);
        }
    }, [submitted, success, bedAssignments, admissionIdParam, from, router, dispatch]);

    // 화면에 들어올 때 이전 등록의 "성공" 상태가 남아 있으면 바로 이동해 버리므로 먼저 초기화
    useEffect(() => {
        dispatch(resetBedAssignmentCreateStatus());
    }, [dispatch]);

    return (
        <div className="mx-auto flex w-full max-w-lg flex-col gap-4 p-6">
            <PageHeader title="Register Bed Assignment" description="Assign a patient to a bed." />

            {loading && <p className="text-sm text-slate-400">Loading...</p>}
            {error && <Alert>{error}</Alert>}
            {timeError && <Alert>{timeError}</Alert>}

            <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                {/* 응급 입원요청 건이면 배정 전에 희망 병동/격리 여부를 확인할 수 있게 표시 */}
                {selectedAdmission?.dispositionId && (
                    <div className="space-y-1 rounded-xl border border-rose-200/80 bg-rose-50 px-3 py-2 text-sm">
                        <p className="font-medium text-rose-800">Emergency Request</p>
                        <p className="text-rose-700">
                            Preferred Ward: {preferredWard ? wardLabel(preferredWard) : "-"}
                            {preferredWard && !preferredWardHasBed && " (no empty bed — choose another ward)"}
                        </p>
                        {selectedAdmission.isolationYn === "Y" && (
                            <p className="font-medium text-rose-700">Isolation required — only single, isolation, and VIP rooms are listed</p>
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
                            {" · "}Room {selectedBed.roomNo}, Bed {selectedBed.bedNo}
                        </p>
                    )}
                    {emptyBeds.length === 0 && <p className="mt-1 text-xs text-rose-600">No empty beds available.</p>}
                </div>
                <div>
                    <label htmlFor="admissionId" className={LABEL}>Patient (Admission)</label>
                    {/* 링크로 admissionId를 받아 들어왔으면 수정 못 하게 고정 표시, 아니면 드롭다운으로 직접 선택 */}
                    {admissionIdParam ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                            {selectedAdmission ? admissionLabel(selectedAdmission) : "Loading..."}
                        </div>
                    ) : (
                        <select id="admissionId" name="admissionId" value={form.admissionId} onChange={onChange} required className={FIELD}>
                            <option value="">Select</option>
                            {availableAdmissions.map((admission) => (
                                <option key={admission.admissionId} value={admission.admissionId}>
                                    {admissionLabel(admission)}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                <div>
                    <label htmlFor="assignedAt" className={LABEL}>Assigned At</label>
                    {/* min/max: 오늘 외의 날짜는 달력에서 선택 불가, 직접 입력해도 제출 시 브라우저가 막음 (서버에서도 한 번 더 검증) */}
                    <input type="datetime-local" id="assignedAt" name="assignedAt" value={form.assignedAt} onChange={onChange} min={minAssignedAt} max={maxAssignedAt} required className={FIELD} />
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
export default BedAssignmentRegisterForm;

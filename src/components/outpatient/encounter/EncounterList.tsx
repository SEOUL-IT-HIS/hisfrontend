"use client";

import { fetchEncounterListRequest } from "@/features/outpatient/encounter/slice";
import type { EncounterDto } from "@/features/outpatient/encounter/types";
import { useEmpNames } from "@/features/emp/hooks/useEmpNames";
import { saveConsultationRequest } from "@/features/outpatient/consultation/slice";
import type { PrescriptionItemInput } from "@/features/outpatient/prescription/types";
import { AppDispatch, RootState } from "@/store/store";
import { useEffect, useRef, useState } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { Alert, Button } from "@/components/common";
import MedicalRecordList from "../medicalrecord/MedicalRecordList";
import PrescriptionList from "../prescription/PrescriptionList";
import PrescriptionForm from "./PrescriptionForm";

//진료상태를 깔끔한 텍스트로 변경
const getStatusText = (status: string) => {
    switch (status) {
        case 'WAITING':
        case 'PENDING':
            return 'Waiting'; // 대기중
        case 'IN_PROGRESS':
            return 'In Progress'; // 진료중
        case 'COMPLETED':
            return 'Completed'; // 진료완료
        case 'CANCELLED':
            return 'Cancelled'; // 취소
        default:
            return status;
    }
};

// 당일 환자 목록 자동 갱신 주기
const ENCOUNTER_REFRESH_INTERVAL_MS = 10_000;

// 상태 필터/뱃지에서 쓰는 대표 상태 (WAITING·PENDING은 대기중으로 묶는다)
const normalizeStatus = (status: string) => (status === 'PENDING' ? 'WAITING' : status);

// 상태별 뱃지 색상
const STATUS_BADGE_CLASS: Record<string, string> = {
    WAITING: 'bg-sky-50 text-sky-800 border-sky-200',
    COMPLETED: 'bg-slate-100 text-slate-700 border-slate-200',
    CANCELLED: 'bg-red-50 text-red-600 border-red-200',
};
const DEFAULT_BADGE_CLASS = 'bg-slate-100 text-slate-600 border-slate-200';

// 목록 상태 필터 (기본값: 대기중)
const STATUS_FILTER_ALL = 'ALL';
const STATUS_FILTER_OPTIONS = [
    { value: 'WAITING', label: 'Waiting' }, // 대기중
    { value: 'COMPLETED', label: 'Completed' }, // 진료완료
    { value: 'CANCELLED', label: 'Cancelled' }, // 취소
    { value: STATUS_FILTER_ALL, label: 'All' }, // 전체
];

// 접수(RCP)에서 받은 초진/재진, 예약/당일 값을 화면 라벨로 변경
// (값이 없으면 "-", 모르는 값이면 원본 표시)
const VISIT_TYPE_LABEL: Record<string, string> = {
    INITIAL: 'Initial Visit', // 초진
    REVISIT: 'Revisit', // 재진
};
const RECEPTION_TYPE_LABEL: Record<string, string> = {
    RESERVATION: 'Reservation', // 예약
    WALK_IN: 'Walk-in', // 당일
};
const getLabel = (labels: Record<string, string>, value?: string | null) =>
    value ? (labels[value] ?? value) : '-';

const EncounterList = () => {
    //스토어에 액션을 전달하는 역할
    const dispatch = useDispatch<AppDispatch>();

    // 담당의 empId -> 이름 (ADM 직원 목록 기반, 조회 실패 시 ID 그대로 표시)
    const { names: empNames } = useEmpNames();

    //필요한 데이터 찾아와서 리렌더링함
    const { loading, error, list } = useSelector((state: RootState) => ({
        loading: state.outpatient.encounter.listStatus.loading,
        error: state.outpatient.encounter.listStatus.error,
        list: state.outpatient.encounter.list
    }), shallowEqual);

    const { createLoading, createError } = useSelector((state: RootState) => ({
        createLoading: state.outpatient.consultation.saveStatus.loading,
        createError: state.outpatient.consultation.saveStatus.error,
    }), shallowEqual);

    // 현재 선택된 환자 상태 관리(바뀐값으로 리렌더링)
    const [selectedEncounter, setSelectedEncounter] = useState<EncounterDto | null>(null);

    // 목록 상태 필터 (최초 진입 시 대기중)
    const [statusFilter, setStatusFilter] = useState<string>('WAITING');
    const filteredList = (list ?? []).filter(
        (enc) => statusFilter === STATUS_FILTER_ALL || normalizeStatus(enc.status) === statusFilter
    );

    // 선택한 환자의 최신 상태 (저장 후 목록이 갱신되면 새 상태를 쓴다)
    const currentStatus = selectedEncounter
        ? (list ?? []).find((enc) => enc.receptionId === selectedEncounter.receptionId)?.status ?? selectedEncounter.status
        : null;

    // 우측 화면 탭 상태
    const [activeTab, setActiveTab] = useState<'FORM' | 'PRESCRIPTION' | 'HISTORY'>('FORM');

    // 오늘 진료 작성 폼 상태
    const [chiefComplaint, setChiefComplaint] = useState("");
    const [examinationNote, setExaminationNote] = useState("");
    const [assessmentNote, setAssessmentNote] = useState("");
    const [planNote, setPlanNote] = useState("");
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    // 저장을 시도했는지 (필수 항목 안내를 저장 시도 후에만 보여준다)
    const [saveAttempted, setSaveAttempted] = useState(false);
    // 처방 입력칸에 Add 안 누른 항목이 있는지 (PrescriptionForm 이 알려줌)
    const [orderPending, setOrderPending] = useState(false);
    const chiefComplaintMissing = saveAttempted && !chiefComplaint.trim();
    const assessmentNoteMissing = saveAttempted && !assessmentNote.trim();

    // 처방 정보 (약제/검사/수술)
    const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItemInput[]>([]);

    //백엔드에 환자목록 달라고 요청
    useEffect(() => {
        dispatch(fetchEncounterListRequest({}));
    }, [dispatch]);

    // 접수에서 들어온 환자/취소를 새로고침 없이 반영하려고 주기적으로 재조회
    // (화면이 보일 때만 조회하고, 다시 보이는 순간 한 번 바로 조회한다)
    useEffect(() => {
        const refresh = () => {
            if (document.visibilityState === 'visible') {
                dispatch(fetchEncounterListRequest({ silent: true }));
            }
        };
        const timer = setInterval(refresh, ENCOUNTER_REFRESH_INTERVAL_MS);
        document.addEventListener('visibilitychange', refresh);
        return () => {
            clearInterval(timer);
            document.removeEventListener('visibilitychange', refresh);
        };
    }, [dispatch]);

    // 저장 요청(loading true -> false) 에러가 없으면 성공으로 보고 폼을 비움
    const prevCreateLoading = useRef(false);
    useEffect(() => {
        if (prevCreateLoading.current && !createLoading && !createError) {
            setChiefComplaint("");
            setExaminationNote("");
            setAssessmentNote("");
            setPlanNote("");
            setPrescriptionItems([]);
            setSaveAttempted(false);
            setSaveMessage("Medical record saved."); // 진료 기록이 저장되었습니다.
            // 진료완료로 바뀐 상태를 목록에 반영
            dispatch(fetchEncounterListRequest({ silent: true }));
        }
        prevCreateLoading.current = createLoading;
    }, [createLoading, createError, dispatch]);

    // 환자 선택했을때 실행
    const handleSelectPatient = (enc: EncounterDto) => {
        setSelectedEncounter(enc);
        setActiveTab('FORM');
        setChiefComplaint('');
        setExaminationNote('');
        setAssessmentNote('');
        setPlanNote('');
        setPrescriptionItems([]);
        setSaveMessage(null);
        setSaveAttempted(false);
    };

    // 진료 저장버튼 눌렀을때 - 진료기록 + 처방을 한 번에 저장
    const handleSaveChart = () => {
        if (!selectedEncounter) return;
        setSaveMessage(null);

        // 필수값 누락, 또는 Add 안 누른 처방 입력이 남았으면 저장 안 하고 안내
        if (!chiefComplaint.trim() || !assessmentNote.trim() || orderPending) {
            setSaveAttempted(true);
            return;
        }

        dispatch(saveConsultationRequest({
            // encounterId가 없으면 receptionId를 대신 사용하도록 안전장치 추가
            encounterId: selectedEncounter.encounterId || selectedEncounter.receptionId,
            payload: {
                medicalRecord: {
                    chiefComplaint,
                    examinationNote,
                    assessmentNote,
                    planNote,
                },
                prescription: {
                    serviceType: "OP",
                    orderMethod: "EMR",
                    priorityCode: "03", // ADM 공통코드 ORDER_PRIORITY_CD 의 Routine
                    timingCode: "03", // ADM 공통코드 ORDER_TIMING_CD 의 Once
                    items: prescriptionItems,
                },
            },
        }));
    };


    return (
        <div className="flex h-full min-h-0 flex-col gap-3 p-4">
            {/* 외래진료 통합 차트 */}
            <h1 className="px-1 text-2xl font-bold text-slate-800">Outpatient Care Chart</h1>
            {/* 당일 외래 진료 기록 작성, 처방 및 과거 진료 이력 통합 조회 */}
            <p className="px-1 text-sm text-slate-500">
                Create today&apos;s outpatient medical records and view prescriptions and past visit history in one place.
            </p>
            {error && <Alert variant="error">{error}</Alert>}

            <div className="flex flex-1 gap-4 overflow-hidden min-h-[600px]">

                {/* 당일 외래 환자 목록 (너비 약 40%) */}
                <div className="w-3/12 flex flex-col rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between gap-2 bg-slate-100 p-3 border-b border-slate-200 font-semibold text-slate-700">
                        {/* 당일 외래 환자 목록 */}
                        <span>Today&apos;s Outpatient List</span>
                        {/* 상태 필터 */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            aria-label="Status filter"
                            className="h-10 min-w-[120px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 shadow-sm outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                        >
                            {STATUS_FILTER_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>
                    {loading ? (
                        // 환자 목록을 불러오는 중입니다...
                        <p className="p-4 text-center text-slate-500">Loading patient list...</p>
                    ) : (
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0">
                                <tr>
                                    {/* 환자명 / 진료과 / 상태 */}
                                    <th className="w-[100px] p-3 font-semibold">Patient</th>
                                    <th className="w-[100px] p-3 font-semibold">Department</th>
                                    <th className="w-[100px] p-3 font-semibold">Status</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 text-slate-800">
                                {filteredList.length > 0 ? (
                                    filteredList.map((enc) => {
                                        const isSelected = selectedEncounter?.receptionId === enc.receptionId;
                                        return (
                                            <tr
                                                key={enc.receptionId}
                                                onClick={() => handleSelectPatient(enc)}
                                                className={`cursor-pointer transition hover:bg-blue-50 ${isSelected ? 'bg-blue-100 font-medium' : ''}`}
                                            >
                                                <td className="p-3">{enc.patientName}</td>
                                                <td className="p-3">{enc.departmentName ?? enc.departmentCode}</td>
                                                <td className="p-3">
                                                    <span className={`rounded-full px-2 py-1 text-xs border ${STATUS_BADGE_CLASS[normalizeStatus(enc.status)] ?? DEFAULT_BADGE_CLASS}`}>
                                                        {getStatusText(enc.status)}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="p-6 text-center text-slate-500">
                                            {/* 조회된 환자가 없습니다. */}
                                            No patients found.
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* 환자 상세 및 진료 작성 / 과거 기록 영역 (너비 약 60%) */}
                <div className="w-9/12 flex flex-col rounded-lg border border-slate-200 bg-white shadow-sm p-4 overflow-y-auto">

                    {/* 우측 상단 탭 메뉴 (항상 노출) */}
                    <div className="flex border-b border-slate-200 gap-2 mb-4">
                        <button
                            onClick={() => setActiveTab('FORM')}
                            className={`py-2 px-4 font-semibold text-sm border-b-2 transition ${
                                activeTab === 'FORM'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {/* 진료 작성 */}
                            New Record
                        </button>
                        <button
                            onClick={() => setActiveTab('HISTORY')}
                            className={`py-2 px-4 font-semibold text-sm border-b-2 transition ${
                                activeTab === 'HISTORY'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {/* 진료기록 조회 */}
                            Medical Records
                        </button>
                        <button
                            onClick={() => setActiveTab('PRESCRIPTION')}
                            className={`py-2 px-4 font-semibold text-sm border-b-2 transition ${
                                activeTab === 'PRESCRIPTION'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {/* 처방 조회 */}
                            Prescriptions
                        </button>
                    </div>

                    {/* 환자 정보 헤더 ("오늘 진료 작성" 탭에서만 노출) */}
                    {selectedEncounter && activeTab === 'FORM' && (
                        <div className="mb-4 shrink-0 rounded-2xl border border-sky-100 bg-sky-50 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                            <div className="flex items-baseline justify-between">
                                <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                                    {selectedEncounter.patientName}
                                </h3>
                                <span className="text-xs text-slate-500">Visit Date: {selectedEncounter.visitDate}</span>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                                <div>
                                    <div className="text-xs text-slate-500">Doctor</div>
                                    <div className="mt-0.5 text-slate-800">{empNames[selectedEncounter.doctorId] ?? selectedEncounter.doctorId}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500">Visit Reason</div>
                                    <div className="mt-0.5 text-slate-800">{selectedEncounter.visitReason ?? "-"}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500">Visit Type</div>
                                    <div className="mt-0.5 text-slate-800">{getLabel(VISIT_TYPE_LABEL, selectedEncounter.visitType)}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500">Reception Type</div>
                                    <div className="mt-0.5 text-slate-800">{getLabel(RECEPTION_TYPE_LABEL, selectedEncounter.receptionType)}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 탭에 따른 본문 콘텐츠 분기 */}
                    {activeTab === 'FORM' ? (
                        /* 오늘 진료 작성 탭 */
                        selectedEncounter && (currentStatus === 'CANCELLED' || currentStatus === 'COMPLETED') ? (
                            <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 text-slate-500 text-sm">
                                {saveMessage && <Alert variant="success">{saveMessage}</Alert>}
                                {currentStatus === 'CANCELLED'
                                    // 접수 취소된 환자는 진료기록 작성 불가
                                    ? "This reception was cancelled. Medical records cannot be created."
                                    // 이미 진료 완료된 환자. 수정은 Medical Records 탭에서
                                    : "This visit is already completed. To change the record, use the Medical Records tab."}
                            </div>
                        ) : selectedEncounter ? (
                            <div className="flex flex-col gap-4 flex-1">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        {/* 주호소 ( 내원 원인 ) */}
                                        Chief Complaint
                                        <span className="text-rose-500"> *</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={chiefComplaint}
                                        onChange={(e) => setChiefComplaint(e.target.value)}
                                        // 예: 기침 및 발열 증상 (3일 전부터 시작)
                                        placeholder="e.g., Cough and fever (started 3 days ago)"
                                        className={`w-full rounded-md border p-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 ${
                                            chiefComplaintMissing ? 'border-rose-400' : 'border-slate-300'
                                        }`}
                                    />
                                    {chiefComplaintMissing && (
                                        <p className="mt-1 text-xs text-rose-500">Chief Complaint is required.</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        {/* 진찰내용 */}
                                        Examination Notes
                                    </label>
                                    <textarea
                                        value={examinationNote}
                                        onChange={(e) => setExaminationNote(e.target.value)}
                                        // 진찰 소견, 신체검진 결과 등을 작성해 주세요.
                                        placeholder="Enter examination findings, physical exam results, etc."
                                        className="w-full rounded-md border border-slate-300 p-2 text-sm min-h-[80px] outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        {/* 진단명 */}
                                        Diagnosis
                                        <span className="text-rose-500"> *</span>
                                    </label>
                                    <textarea
                                        value={assessmentNote}
                                        onChange={(e) => setAssessmentNote(e.target.value)}
                                        // 진단명 및 평가 소견을 작성해 주세요.
                                        placeholder="Enter the diagnosis and assessment."
                                        className={`w-full rounded-md border p-2 text-sm min-h-[80px] outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 ${
                                            assessmentNoteMissing ? 'border-rose-400' : 'border-slate-300'
                                        }`}
                                    />
                                    {assessmentNoteMissing && (
                                        <p className="mt-1 text-xs text-rose-500">Diagnosis is required.</p>
                                    )}
                                </div>

                                <div className="flex-1 flex flex-col">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        {/* 치료계획 */}
                                        Treatment Plan
                                    </label>
                                    <textarea
                                        value={planNote}
                                        onChange={(e) => setPlanNote(e.target.value)}
                                        // 처방 및 향후 치료 계획을 작성해 주세요.
                                        placeholder="Enter the prescription and future treatment plan."
                                        className="w-full flex-1 rounded-md border border-slate-300 p-2 text-sm min-h-[80px] outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                    />
                                </div>

                                {/* key: 환자를 바꾸면 처방 입력칸도 초기화 */}
                                <PrescriptionForm
                                    key={selectedEncounter.receptionId}
                                    items={prescriptionItems}
                                    onChange={setPrescriptionItems}
                                    onPendingChange={setOrderPending}
                                    showPendingWarning={saveAttempted}
                                />

                                {createError && <Alert variant="error">{createError}</Alert>}
                                {saveMessage && <Alert variant="success">{saveMessage}</Alert>}

                                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                                    <Button variant="primary" onClick={handleSaveChart} disabled={createLoading}>
                                        {/* 저장 중... / 진료 저장 */}
                                        {createLoading ? "Saving..." : "Save Record"}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-full min-h-[300px] items-center justify-center text-slate-400 text-sm">
                                {/* 좌측 목록에서 진료할 환자를 선택해 주세요. */}
                                Select a patient from the list on the left.
                            </div>
                        )
                    ) : activeTab === 'PRESCRIPTION' ? (
                        /* 처방조회 탭 - 환자 선택 여부와 상관없이 바로 렌더링 */
                        <div className="flex-1 overflow-y-auto">
                            <PrescriptionList />
                        </div>
                    ) : (
                        /* 과거 진료기록 조회 탭 (환자 선택과 무관) */
                        <div className="flex-1 overflow-y-auto">
                            <MedicalRecordList />
                        </div>
                    )}

                </div>

            </div>
        </div>
    );
};

export default EncounterList;

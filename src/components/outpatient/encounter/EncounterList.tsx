"use client";

import { fetchEncounterListRequest } from "@/features/outpatient/encounter/slice";
import type { EncounterDto } from "@/features/outpatient/encounter/types";
import { saveConsultationRequest } from "@/features/outpatient/consultation/slice";
import type { PrescriptionItemInput } from "@/features/outpatient/prescription/types";
import { AppDispatch, RootState } from "@/store/store";
import { useEffect, useRef, useState } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { Alert, Button } from "@/components/common";
import MedicalRecordList from "../medicalrecord/MedicalRecordList";
import PrescriptionList from "../prescription/PrescriptionList";
import PrescriptionForm from "./PrescriptionForm";

//진료상태를 한글로 변경
const getStatusText = (status: string) => {
    switch (status) {
        case 'WAITING':
        case 'PENDING':
            return 'Waiting'; // 대기중
        case 'IN_PROGRESS':
            return 'In Progress'; // 진료중
        case 'COMPLETED':
            return 'Completed'; // 진료완료
        default:
            return status;
    }
};

const EncounterList = () => {
    //스토어에 액션을 전달하는 역할
    const dispatch = useDispatch<AppDispatch>();

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

    // 우측 화면 탭 상태
    const [activeTab, setActiveTab] = useState<'FORM' | 'PRESCRIPTION' | 'HISTORY'>('FORM');

    // 오늘 진료 작성 폼 상태
    const [chiefComplaint, setChiefComplaint] = useState("");
    const [examinationNote, setExaminationNote] = useState("");
    const [assessmentNote, setAssessmentNote] = useState("");
    const [planNote, setPlanNote] = useState("");
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    // 처방 정보 (약제/검사/수술)
    const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItemInput[]>([]);

    //백엔드에 환자목록 달라고 요청
    useEffect(() => {
        dispatch(fetchEncounterListRequest({}));
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
            setSaveMessage("Medical record saved."); // 진료 기록이 저장되었습니다.
        }
        prevCreateLoading.current = createLoading;
    }, [createLoading, createError]);

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
    };

    // 진료 저장버튼 눌렀을때 - 진료기록 + 처방을 한 번에 저장
    const handleSaveChart = () => {
        if (!selectedEncounter) return;
        setSaveMessage(null);

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
                    priorityCode: "ROUTINE",
                    timingCode: "ONCE",
                    items: prescriptionItems,
                },
            },
        }));
    };


    return (
        <div className="flex h-full min-h-0 flex-col gap-3 p-4">
            {/* 외래진료 통합 차트 */}
            <h1 className="px-1 text-2xl font-bold text-slate-800">Outpatient Care Chart</h1>
            {/* 환자의 당일 외래 진료 기록을 작성하고, 처방 및 과거 진료 이력을 통합 조회할 수 있습니다. */}
            <p className="px-1 text-sm text-slate-500">
                Create today&apos;s outpatient medical records and view prescriptions and past visit history in one place.
            </p>
            {error && <Alert variant="error">{error}</Alert>}

            <div className="flex flex-1 gap-4 overflow-hidden min-h-[600px]">

                {/* 당일 외래 환자 목록 (너비 약 40%) */}
                <div className="w-3/12 flex flex-col rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="bg-slate-100 p-3 border-b border-slate-200 font-semibold text-slate-700">
                        {/* 당일 외래 환자 목록 */}
                        Today&apos;s Outpatient List
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
                                {list && list.length > 0 ? (
                                    list.map((enc) => {
                                        const isSelected = selectedEncounter?.receptionId === enc.receptionId;
                                        return (
                                            <tr
                                                key={enc.receptionId}
                                                onClick={() => handleSelectPatient(enc)}
                                                className={`cursor-pointer transition hover:bg-blue-50 ${isSelected ? 'bg-blue-100 font-medium' : ''}`}
                                            >
                                                <td className="p-3">{enc.patientName}</td>
                                                <td className="p-3">{enc.departmentCode}</td>
                                                <td className="p-3">
                                                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 border border-slate-200">
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

                    {/* 환자 정보 헤더 (환자가 선택되었고, "오늘 진료 작성" 탭일 때만 노출) */}
                    {selectedEncounter && activeTab === 'FORM' && (
                        <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 border border-slate-200 mb-4">
                            <div>
                                <span className="text-base font-bold text-slate-800">{selectedEncounter.patientName}</span>
                                <span className="ml-2 text-xs text-slate-500">({selectedEncounter.patientId})</span>
                            </div>
                            <div className="text-xs text-slate-600">
                                {/* 내원일: ... | 진료과: ... */}
                                Visit Date: {selectedEncounter.visitDate} | Department: {selectedEncounter.departmentCode}
                            </div>
                        </div>
                    )}

                    {/* 탭에 따른 본문 콘텐츠 분기 */}
                    {activeTab === 'FORM' ? (
                        /* 오늘 진료 작성 탭 */
                        selectedEncounter ? (
                            <div className="flex flex-col gap-4 flex-1">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        {/* 주호소 ( 내원 원인 ) */}
                                        Chief Complaint (Reason for Visit)
                                    </label>
                                    <input
                                        type="text"
                                        value={chiefComplaint}
                                        onChange={(e) => setChiefComplaint(e.target.value)}
                                        // 예: 기침 및 발열 증상 (3일 전부터 시작)
                                        placeholder="e.g., Cough and fever (started 3 days ago)"
                                        className="w-full rounded-md border border-slate-300 p-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                    />
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
                                    </label>
                                    <textarea
                                        value={assessmentNote}
                                        onChange={(e) => setAssessmentNote(e.target.value)}
                                        // 진단명 및 평가 소견을 작성해 주세요.
                                        placeholder="Enter the diagnosis and assessment."
                                        className="w-full rounded-md border border-slate-300 p-2 text-sm min-h-[80px] outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                    />
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

                                <PrescriptionForm items={prescriptionItems} onChange={setPrescriptionItems} />

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
                        /* 과거 진료기록 조회 탭 - 환자 선택 여부와 상관없이 바로 렌더링 */
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

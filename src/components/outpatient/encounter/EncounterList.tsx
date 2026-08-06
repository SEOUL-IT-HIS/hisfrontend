"use client";

import { fetchEncounterListRequest } from "@/features/outpatient/encounter/slice";
import { AppDispatch, RootState } from "@/store/store";
import { useEffect, useState } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { Alert, Button } from "@/components/common";
import MedicalRecordList from "../medicalrecord/MedicalRecordList"; // 프로젝트 경로 확인 필요

const EncounterList = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error, list } = useSelector((state: RootState) => ({
        loading: state.outpatient.encounter.listStatus.loading,
        error: state.outpatient.encounter.listStatus.error,
        list: state.outpatient.encounter.list
    }), shallowEqual);

    // 1. 현재 선택된 환자(Encounter) 상태 관리
    const [selectedEncounter, setSelectedEncounter] = useState<any | null>(null);

    // 2. 우측 화면 탭 상태 ('FORM': 오늘 진료 작성, 'HISTORY': 과거 진료기록 조회)
    const [activeTab, setActiveTab] = useState<'FORM' | 'HISTORY'>('FORM');

    // 3. 오늘 진료 작성 폼 상태
    const [chiefComplaint, setChiefComplaint] = useState("");
    const [soapNote, setSoapNote] = useState("");

    useEffect(() => {
        dispatch(fetchEncounterListRequest({}));
    }, [dispatch]);

    // 환자 선택 핸들러
    const handleSelectPatient = (enc: any) => {
        setSelectedEncounter(enc);
        setActiveTab('FORM'); // 환자 선택 시 기본 탭을 오늘 진료 작성으로 설정
        setChiefComplaint("");
        setSoapNote("");
    };

    // 오늘 진료 저장 핸들러
    const handleSaveChart = () => {
        if (!selectedEncounter) return;
        alert(`${selectedEncounter.patientName} 님의 진료 기록이 저장되었습니다.`);
        // TODO: dispatch(createMedicalRecordRequest({ encounterId: selectedEncounter.encounterId, chiefComplaint, soapNote }))
    };

    return (
        <div className="flex h-full min-h-0 flex-col gap-3 p-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h1 className="text-lg font-bold text-slate-800">외래진료 통합 차트</h1>
            </div>

            {error && <Alert variant="error">{error}</Alert>}

            {/* 메인 2단 분할 레이아웃 */}
            <div className="flex flex-1 gap-4 overflow-hidden min-h-[600px]">

                {/* [좌측] 당일 외래 환자 목록 (너비 약 40%) */}
                <div className="w-5/12 flex flex-col rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="bg-slate-100 p-3 border-b border-slate-200 font-semibold text-slate-700">
                        당일 외래 환자 목록
                    </div>
                    {loading ? (
                        <p className="p-4 text-center text-slate-500">환자 목록을 불러오는 중입니다...</p>
                    ) : (
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0">
                                <tr>
                                    <th className="w-[100px] p-3 font-semibold">환자번호</th>
                                    <th className="w-[100px] p-3 font-semibold">환자명</th>
                                    <th className="w-[100px] p-3 font-semibold">진료과</th>
                                    <th className="w-[100px] p-3 font-semibold">상태</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 text-slate-800">
                                {list && list.length > 0 ? (
                                    list.map((enc) => {
                                        const isSelected = selectedEncounter?.encounterId === enc.encounterId;
                                        return (
                                            <tr
                                                key={enc.encounterId}
                                                onClick={() => handleSelectPatient(enc)}
                                                className={`cursor-pointer transition hover:bg-blue-50 ${isSelected ? 'bg-blue-100 font-medium' : ''}`}
                                            >
                                                <td className="p-3">{enc.patientNo}</td>
                                                <td className="p-3">{enc.patientName}</td>
                                                <td className="p-3">{enc.departmentCode}</td>
                                                <td className="p-3">
                                                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 border border-slate-200">
                                                        {enc.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="p-6 text-center text-slate-500">
                                            조회된 환자가 없습니다.
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* [우측] 환자 상세 및 진료 작성 / 과거 기록 영역 (너비 약 60%) */}
                <div className="w-7/12 flex flex-col rounded-lg border border-slate-200 bg-white shadow-sm p-4 overflow-y-auto">

                    {/* 1. 우측 상단 탭 메뉴 (항상 노출) */}
                    <div className="flex border-b border-slate-200 gap-2 mb-4">
                        <button
                            onClick={() => setActiveTab('FORM')}
                            className={`py-2 px-4 font-semibold text-sm border-b-2 transition ${
                                activeTab === 'FORM'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            오늘 진료 작성
                        </button>
                        <button
                            onClick={() => setActiveTab('HISTORY')}
                            className={`py-2 px-4 font-semibold text-sm border-b-2 transition ${
                                activeTab === 'HISTORY'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            진료기록 조회
                        </button>
                    </div>

                    {/* 2. 환자 정보 헤더 (환자가 선택되었을 때만 노출) */}
                    {selectedEncounter && (
                        <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 border border-slate-200 mb-4">
                            <div>
                                <span className="text-base font-bold text-slate-800">{selectedEncounter.patientName}</span>
                                <span className="ml-2 text-xs text-slate-500">({selectedEncounter.patientNo})</span>
                            </div>
                            <div className="text-xs text-slate-600">
                                내원일: {selectedEncounter.visitDate} | 진료과: {selectedEncounter.departmentCode}
                            </div>
                        </div>
                    )}

                    {/* 3. 탭에 따른 본문 콘텐츠 분기 */}
                    {activeTab === 'FORM' ? (
                        /* [오늘 진료 작성 탭] */
                        selectedEncounter ? (
                            <div className="flex flex-col gap-4 flex-1">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        주호소 (Chief Complaint / 내원 원인)
                                    </label>
                                    <input
                                        type="text"
                                        value={chiefComplaint}
                                        onChange={(e) => setChiefComplaint(e.target.value)}
                                        placeholder="예: 기침 및 발열 증상 (3일 전부터 시작)"
                                        className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                                    />
                                </div>

                                <div className="flex-1 flex flex-col">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        진단 및 SOAP 노트
                                    </label>
                                    <textarea
                                        value={soapNote}
                                        onChange={(e) => setSoapNote(e.target.value)}
                                        placeholder="진단명, 소견 및 처방 내역을 작성해 주세요."
                                        className="w-full flex-1 rounded-md border border-slate-300 p-2 text-sm min-h-[150px] focus:border-blue-500 focus:outline-none"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                                    <Button variant="secondary" onClick={() => setActiveTab('HISTORY')}>
                                        과거 진료기록 확인
                                    </Button>
                                    <Button variant="primary" onClick={handleSaveChart}>
                                        진료 저장 및 완료
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-full min-h-[300px] items-center justify-center text-slate-400 text-sm">
                                좌측 목록에서 진료할 환자를 선택해 주세요.
                            </div>
                        )
                    ) : (
                        /* [과거 진료기록 조회 탭] - 환자 선택 여부와 상관없이 바로 렌더링 */
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
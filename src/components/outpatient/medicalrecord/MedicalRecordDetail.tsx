"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, FormField, Modal } from "@/components/common";
import {
    clearSelectedRecord,
    fetchRecordDetailRequest,
} from "@/features/outpatient/medicalrecord/slice";
import type { AppDispatch, RootState } from "@/store/store";

type MedicalRecordDetailProps = {
    /** 상세 조회할 진료기록 ID. null이면 모달을 닫힌 상태로 렌더링한다 */
    recordId: string | null;
    onClose: () => void;
};

const formatDateTime = (value?: string) => (value ? value.replace("T", " ").slice(0, 19) : "-");

const noteFields: { label: string; key: "chiefComplaint" | "examinationNote" | "assessmentNote" | "planNote" }[] = [
    { label: "주호소", key: "chiefComplaint" },
    { label: "진찰내용", key: "examinationNote" },
    { label: "진료소견", key: "assessmentNote" },
    { label: "치료계획", key: "planNote" },
];

const MedicalRecordDetail = ({ recordId, onClose }: MedicalRecordDetailProps) => {
    const dispatch = useDispatch<AppDispatch>();

    const record = useSelector((state: RootState) => state.outpatient.medicalrecord.selectedRecord);
    const { loading, error } = useSelector(
        (state: RootState) => state.outpatient.medicalrecord.detailStatus
    );

    useEffect(() => {
        if (recordId) {
            dispatch(fetchRecordDetailRequest(recordId));
        }
        // 모달을 닫거나 다른 기록을 열기 전에 이전 상세 데이터를 비워, 다음 조회 시 잠깐이라도 이전 내용이 보이지 않게 한다
        return () => {
            dispatch(clearSelectedRecord());
        };
    }, [dispatch, recordId]);

    return (
        <Modal
            open={recordId != null}
            title="진료기록 상세"
            onClose={onClose}
            maxWidthClassName="max-w-2xl"
        >
            {loading ? (
                <p className="p-8 text-center text-sm text-slate-500">진료기록을 불러오는 중입니다...</p>
            ) : error ? (
                <Alert variant="error">{error}</Alert>
            ) : record ? (
                <div className="space-y-4">
                    {/* 상단 환자 정보 영역 */}
                    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
                        <h3 className="text-lg font-bold text-slate-800">
                            {record.patientName ?? "미상"}
                        </h3>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-600 border border-slate-200">
                            {record.patientNo ?? "-"}
                        </span>
                        <span className="ml-auto text-xs text-slate-500">
                            작성일시: {formatDateTime(record.createdAt)}
                        </span>
                    </div>

                    {/* 기본 정보 (상태, 작성자 ID) */}
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="기록 상태">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 font-medium">
                                {record.status}
                            </div>
                        </FormField>
                        <FormField label="작성자 ID">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                                {record.authorId}
                            </div>
                        </FormField>
                    </div>

                    {/* 진료 노트 영역 */}
                    <div className="space-y-3">
                        {noteFields.map(({ label, key }) => (
                            <FormField key={key} label={label}>
                                <div className="min-h-[2.5rem] whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-800">
                                    {record[key] ?? "-"}
                                </div>
                            </FormField>
                        ))}
                    </div>

                    {/* 하단 수정일시 및 닫기 버튼 */}
                    <div className="pt-2 border-t border-slate-200">
                        {record.updatedAt && (
                            <p className="text-right text-xs text-slate-400 mb-3">
                                수정일시: {formatDateTime(record.updatedAt)}
                            </p>
                        )}
                        <div className="flex justify-end">
                            <Button variant="secondary" onClick={onClose}>
                                닫기
                            </Button>
                        </div>
                    </div>
                </div>
            ) : null}
        </Modal>
    );
};

export default MedicalRecordDetail;
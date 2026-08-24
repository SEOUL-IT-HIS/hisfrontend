"use client";

import { useEffect, useRef, useState } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { Alert, Button, FormField, Input, Modal } from "@/components/common";
import {
    clearSelectedRecord,
    deactivateRecordRequest,
    fetchRecordDetailRequest,
    updateRecordRequest,
} from "@/features/outpatient/medicalrecord/slice";
import type { AppDispatch, RootState } from "@/store/store";

type MedicalRecordDetailProps = {
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
    const { updateLoading, updateError } = useSelector((state: RootState) => ({
        updateLoading: state.outpatient.medicalrecord.updateStatus.loading,
        updateError: state.outpatient.medicalrecord.updateStatus.error,
    }), shallowEqual);
    const { deactivateLoading, deactivateError } = useSelector((state: RootState) => ({
        deactivateLoading: state.outpatient.medicalrecord.deactivateStatus.loading,
        deactivateError: state.outpatient.medicalrecord.deactivateStatus.error,
    }), shallowEqual);
    const currentUserId = useSelector((state: RootState) => state.auth.user?.loginId ?? "UNKNOWN");

    const [isEditing, setIsEditing] = useState(false);
    const [editChiefComplaint, setEditChiefComplaint] = useState("");
    const [editExaminationNote, setEditExaminationNote] = useState("");
    const [editAssessmentNote, setEditAssessmentNote] = useState("");
    const [editPlanNote, setEditPlanNote] = useState("");
    const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

    // 첨부파일 상태 관리 (파일명 목록)
    const [editFileNames, setEditFileNames] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 다른 기록을 열거나 모달을 닫을 때는 항상 조회 모드로 돌아간다
    const [prevRecordId, setPrevRecordId] = useState(recordId);
    if (recordId !== prevRecordId) {
        setPrevRecordId(recordId);
        setIsEditing(false);
    }

    useEffect(() => {
        if (recordId) {
            dispatch(fetchRecordDetailRequest(recordId));
        }
        return () => {
            dispatch(clearSelectedRecord());
        };
    }, [dispatch, recordId]);

    // 수정 요청 성공 시 조회 모드로 복귀
    const prevUpdateLoading = useRef(false);
    useEffect(() => {
        if (prevUpdateLoading.current && !updateLoading && !updateError) {
            setIsEditing(false);
        }
        prevUpdateLoading.current = updateLoading;
    }, [updateLoading, updateError]);

    // 비활성화 성공 시 모달 닫기
    const prevDeactivateLoading = useRef(false);
    useEffect(() => {
        if (prevDeactivateLoading.current && !deactivateLoading && !deactivateError) {
            onClose();
        }
        prevDeactivateLoading.current = deactivateLoading;
    }, [deactivateLoading, deactivateError, onClose]);

    function handleStartEdit() {
        if (!record) return;
        setEditChiefComplaint(record.chiefComplaint ?? "");
        setEditExaminationNote(record.examinationNote ?? "");
        setEditAssessmentNote(record.assessmentNote ?? "");
        setEditPlanNote(record.planNote ?? "");

        // 기존에 저장된 파일 이름이 있다면 불러옴
        setEditFileNames(record.fileNames ?? []);
        setIsEditing(true);
    }

    function handleCancelEdit() {
        setIsEditing(false);
    }

    // 파일 선택 시 리스트에 추가
    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files).map((file) => file.name);
            setEditFileNames((prev) => [...prev, ...newFiles]);
        }
    }

    // 첨부파일 삭제 버튼
    function handleRemoveFile(indexToRemove: number) {
        setEditFileNames((prev) => prev.filter((_, index) => index !== indexToRemove));
    }

    function handleSaveEdit() {
        if (!recordId) return;
        dispatch(
            updateRecordRequest({
                recordId,
                params: {
                    chiefComplaint: editChiefComplaint,
                    examinationNote: editExaminationNote,
                    assessmentNote: editAssessmentNote,
                    planNote: editPlanNote,
                    fileNames: editFileNames, // 수정할 때 파일 이름 목록 함께 전송
                },
            })
        );
    }

    function handleDeactivate() {
        if (!recordId) return;
        dispatch(deactivateRecordRequest({ recordId, userId: currentUserId }));
        setShowDeactivateConfirm(false);
    }

    return (
        <>
            <Modal
                open={recordId != null}
                title={isEditing ? "진료기록 수정" : "진료기록 상세"}
                onClose={onClose}
                closeDisabled={updateLoading}
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
                            {record.departmentName && (
                                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
                                {record.departmentName}
                            </span>
                            )}
                            <span className="ml-auto text-xs text-slate-500">
                            작성일시: {formatDateTime(record.createdAt)}
                        </span>
                        </div>

                        {/* 기본 정보 */}
                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="기록 상태">
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 font-medium">
                                    {record.status}
                                </div>
                            </FormField>
                            <FormField label="담당의">
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                                    {record.doctorName
                                        ? `${record.doctorName} (${record.doctorId})`
                                        : record.doctorId}
                                </div>
                            </FormField>
                        </div>

                        {/* 진료 노트 영역 */}
                        {isEditing ? (
                            <div className="space-y-3">
                                <FormField label="주호소">
                                    <Input
                                        value={editChiefComplaint}
                                        onChange={(e) => setEditChiefComplaint(e.target.value)}
                                    />
                                </FormField>
                                <FormField label="진찰내용">
                                <textarea
                                    value={editExaminationNote}
                                    onChange={(e) => setEditExaminationNote(e.target.value)}
                                    className="w-full min-h-[80px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                />
                                </FormField>
                                <FormField label="진료소견">
                                <textarea
                                    value={editAssessmentNote}
                                    onChange={(e) => setEditAssessmentNote(e.target.value)}
                                    className="w-full min-h-[80px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                />
                                </FormField>
                                <FormField label="치료계획">
                                <textarea
                                    value={editPlanNote}
                                    onChange={(e) => setEditPlanNote(e.target.value)}
                                    className="w-full min-h-[80px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                />
                                </FormField>

                                {/* 수정 모드일 때 파일 업로드 및 목록 UI */}
                                <FormField label="첨부파일">
                                    <div className="space-y-2">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            파일 선택
                                        </Button>
                                        <ul className="text-xs text-slate-600 space-y-1 mt-1">
                                            {editFileNames.map((name, idx) => (
                                                <li key={idx} className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded border border-slate-200">
                                                    <span>📄 {name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveFile(idx)}
                                                        className="text-red-500 hover:text-red-700 font-bold ml-2"
                                                    >
                                                        삭제
                                                    </button>
                                                </li>
                                            ))}
                                            {editFileNames.length === 0 && (
                                                <li className="text-slate-400">첨부된 파일이 없습니다.</li>
                                            )}
                                        </ul>
                                    </div>
                                </FormField>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {noteFields.map(({ label, key }) => (
                                    <FormField key={key} label={label}>
                                        <div className="min-h-[2.5rem] whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-800">
                                            {record[key] ?? "-"}
                                        </div>
                                    </FormField>
                                ))}

                                {/* 상세 조회 모드일 때 첨부파일 목록 표시 */}
                                <FormField label="첨부파일 목록">
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                                        {record.fileNames && record.fileNames.length > 0 ? (
                                            <ul className="list-disc list-inside space-y-1">
                                                {record.fileNames.map((name, idx) => (
                                                    <li key={idx} className="text-sky-600 font-medium">
                                                        {name}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <span className="text-slate-400">첨부파일이 없습니다.</span>
                                        )}
                                    </div>
                                </FormField>
                            </div>
                        )}

                        {updateError && <Alert variant="error">{updateError}</Alert>}
                        {deactivateError && <Alert variant="error">{deactivateError}</Alert>}

                        {/* 하단 버튼 영역 */}
                        <div className="pt-2 border-t border-slate-200">
                            {record.updatedAt && (
                                <p className="text-right text-xs text-slate-400 mb-3">
                                    수정일시: {formatDateTime(record.updatedAt)}
                                </p>
                            )}
                            <div className="flex justify-end gap-2">
                                {isEditing ? (
                                    <>
                                        <Button variant="secondary" onClick={handleCancelEdit} disabled={updateLoading}>
                                            취소
                                        </Button>
                                        <Button variant="primary" onClick={handleSaveEdit} disabled={updateLoading}>
                                            {updateLoading ? "저장 중..." : "저장"}
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            variant="danger"
                                            onClick={() => setShowDeactivateConfirm(true)}
                                            disabled={deactivateLoading}
                                            className="mr-auto"
                                        >
                                            비활성화
                                        </Button>
                                        <Button variant="secondary" onClick={onClose}>
                                            닫기
                                        </Button>
                                        <Button variant="primary" onClick={handleStartEdit}>
                                            수정
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ) : null}
            </Modal>

            {/* 비활성화 확인 모달 */}
            <Modal
                open={showDeactivateConfirm}
                title="진료기록 비활성화"
                onClose={() => setShowDeactivateConfirm(false)}
                maxWidthClassName="max-w-md"
            >
                <div className="space-y-4">
                    <div className="space-y-2 text-sm text-slate-600">
                        <p className="font-medium text-red-600">
                            비활성화하면 목록과 조회에서 더 이상 보이지 않습니다.
                        </p>
                        <p className="text-slate-800">
                            이 진료기록을 비활성화하시겠습니까?
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                        <Button
                            variant="secondary"
                            onClick={() => setShowDeactivateConfirm(false)}
                            disabled={deactivateLoading}
                        >
                            취소
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleDeactivate}
                            disabled={deactivateLoading}
                        >
                            {deactivateLoading ? "비활성화 중..." : "비활성화"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default MedicalRecordDetail;
"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, FormField, Modal } from "@/components/common";
import {
    clearSelectedPrescription,
    fetchPrescriptionDetailRequest,
} from "@/features/outpatient/prescription/slice";
import type { AppDispatch, RootState } from "@/store/store";

type PrescriptionDetailProps = {
    prescriptionId: string | null;
    onClose: () => void;
};

const getStatusText = (status: string) => {
    switch (status) {
        case 'REQUESTED':
        case 'ORDERED':
        case 'PENDING':
            return '처방대기';
        case 'ISSUED':
        case 'IN_PROGRESS':
            return '처방중';
        case 'COMPLETED':
            return '처방완료';
        case 'HOLD':
            return '보류';
        case 'DISCONTINUED':
            return '중단';
        case 'CANCELLED':
            return '취소';
        default:
            return status;
    }
};

const formatDateTime = (value?: string | null) => (value ? value.replace("T", " ").slice(0, 19) : "-");

const PrescriptionDetail = ({ prescriptionId, onClose }: PrescriptionDetailProps) => {
    const dispatch = useDispatch<AppDispatch>();

    const prescription = useSelector((state: RootState) => state.outpatient.prescription.selectedPrescription);
    const { loading, error } = useSelector(
        (state: RootState) => state.outpatient.prescription.detailStatus
    );

    useEffect(() => {
        if (prescriptionId) {
            dispatch(fetchPrescriptionDetailRequest(prescriptionId));
        }
        return () => {
            dispatch(clearSelectedPrescription());
        };
    }, [dispatch, prescriptionId]);

    return (
        <Modal
            open={prescriptionId != null}
            title="처방 상세"
            onClose={onClose}
            maxWidthClassName="max-w-2xl"
        >
            {loading ? (
                <p className="p-8 text-center text-sm text-slate-500">처방 내역을 불러오는 중입니다...</p>
            ) : error ? (
                <Alert variant="error">{error}</Alert>
            ) : prescription ? (
                <div className="space-y-4">
                    {/* 상단 처방 기본 정보 */}
                    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
                        <h3 className="text-lg font-bold text-slate-800">
                            {prescription.patientName ?? "미상"}
                        </h3>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-600 border border-slate-200">
                            {prescription.patientNo ?? prescription.patientId}
                        </span>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-600 border border-slate-200">
                            진료ID: {prescription.encounterId}
                        </span>
                        <span className="ml-auto text-xs text-slate-500">
                            처방일시: {formatDateTime(prescription.prescribedAt)}
                        </span>
                    </div>

                    {/* 기본 정보 */}
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="처방상태">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 font-medium">
                                {getStatusText(prescription.status)}
                            </div>
                        </FormField>
                        <FormField label="처방자ID">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                                {prescription.prescribedBy}
                            </div>
                        </FormField>
                        <FormField label="진료구분">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                                {prescription.serviceType ?? "-"}
                            </div>
                        </FormField>
                        <FormField label="처방유형">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                                {prescription.orderMethod ?? "-"}
                            </div>
                        </FormField>
                        <FormField label="우선순위">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                                {prescription.priorityCode ?? "-"}
                            </div>
                        </FormField>
                        <FormField label="처방패턴">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                                {prescription.timingCode ?? "-"}
                            </div>
                        </FormField>
                    </div>

                    {/* 처방 항목 목록 */}
                    <FormField label="처방 항목">
                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                <tr>
                                    <th className="p-2 font-semibold">항목명</th>
                                    <th className="p-2 font-semibold">용량</th>
                                    <th className="p-2 font-semibold">횟수</th>
                                    <th className="p-2 font-semibold">투약일수</th>
                                    <th className="p-2 font-semibold">상세정보</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 text-slate-800">
                                {prescription.items && prescription.items.length > 0 ? (
                                    prescription.items.map((item) => (
                                        <tr key={item.itemId}>
                                            <td className="p-2">{item.itemName}</td>
                                            <td className="p-2">{item.dosage ?? "-"}</td>
                                            <td className="p-2">{item.frequency ?? "-"}</td>
                                            <td className="p-2">{item.durationDays ?? "-"}</td>
                                            <td className="p-2">{item.detailInfo ?? "-"}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="p-4 text-center text-slate-400">
                                            처방 항목이 없습니다.
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </FormField>

                    {/* 취소/보류/중단된 처방인 경우 사유 노출 */}
                    {prescription.status === "CANCELLED" && (
                        <FormField label="취소 사유">
                            <div className="min-h-[2.5rem] whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-800">
                                {prescription.cancelReason ?? "-"}
                            </div>
                        </FormField>
                    )}
                    {prescription.status === "HOLD" && (
                        <FormField label="보류 사유">
                            <div className="min-h-[2.5rem] whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-800">
                                {prescription.holdReason ?? "-"}
                            </div>
                        </FormField>
                    )}
                    {prescription.status === "DISCONTINUED" && (
                        <FormField label="중단 사유">
                            <div className="min-h-[2.5rem] whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-800">
                                {prescription.discontinuedReason ?? "-"}
                            </div>
                        </FormField>
                    )}

                    {/* 하단 버튼 영역 */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                        <Button variant="secondary" onClick={onClose}>
                            닫기
                        </Button>
                    </div>
                </div>
            ) : null}
        </Modal>
    );
};

export default PrescriptionDetail;

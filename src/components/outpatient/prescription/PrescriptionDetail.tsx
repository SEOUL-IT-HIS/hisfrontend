"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, FormField, Modal } from "@/components/common";
import {
    clearSelectedPrescription,
    deactivatePrescriptionRequest,
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
            return 'Pending'; // 처방대기
        case 'ISSUED':
        case 'IN_PROGRESS':
            return 'In Progress'; // 처방중
        case 'COMPLETED':
            return 'Completed'; // 처방완료
        case 'HOLD':
            return 'On Hold'; // 보류
        case 'DISCONTINUED':
            return 'Discontinued'; // 중단
        case 'CANCELLED':
            return 'Cancelled'; // 취소
        default:
            return status;
    }
};

const formatDateTime = (value?: string | null) => (value ? value.replace("T", " ").slice(0, 19) : "-");

// 이상여부 표시 (N=정상, H=높음, L=낮음, null=판정불가)
const ABNORMAL_BADGE: Record<string, { label: string; className: string }> = {
    N: { label: "Normal", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/15" },
    H: { label: "High", className: "bg-red-50 text-red-700 ring-red-600/20" },
    L: { label: "Low", className: "bg-blue-50 text-blue-700 ring-blue-600/20" },
};

const AbnormalBadge = ({ flag }: { flag?: string | null }) => {
    const badge = flag ? ABNORMAL_BADGE[flag] : undefined;
    if (!badge) return <span className="text-slate-400">-</span>;
    return (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${badge.className}`}>
            {badge.label}
        </span>
    );
};

const PrescriptionDetail = ({ prescriptionId, onClose }: PrescriptionDetailProps) => {
    const dispatch = useDispatch<AppDispatch>();

    const prescription = useSelector((state: RootState) => state.outpatient.prescription.selectedPrescription);
    const { loading, error } = useSelector(
        (state: RootState) => state.outpatient.prescription.detailStatus
    );
    const deactivateLoading = useSelector(
        (state: RootState) => state.outpatient.prescription.deactivateStatus.loading
    );
    const currentUserId = useSelector((state: RootState) => state.auth.user?.loginId ?? "UNKNOWN");

    useEffect(() => {
        if (prescriptionId) {
            dispatch(fetchPrescriptionDetailRequest(prescriptionId));
        }
        return () => {
            dispatch(clearSelectedPrescription());
        };
    }, [dispatch, prescriptionId]);

    // 검사 처방 항목만 추출 (prescriptionType 은 표시값이 아닌 실제 데이터 값이라 한글 그대로 비교)
    const labItems = prescription?.items?.filter((item) => item.prescriptionType === "검사") ?? [];

    // 처방 비활성화 (취소 사유는 간단하게 prompt로 받음)
    function handleDeactivate() {
        if (!prescriptionId) return;
        const cancelReason = window.prompt("Enter cancellation reason:");
        if (!cancelReason?.trim()) return;
        dispatch(deactivatePrescriptionRequest({ prescriptionId, cancelReason, userId: currentUserId }));
    }

    return (
        <Modal
            open={prescriptionId != null}
            // 처방 상세
            title="Prescription Details"
            onClose={onClose}
            maxWidthClassName="max-w-3xl"
        >
            {loading ? (
                // 처방 내역을 불러오는 중입니다...
                <p className="p-8 text-center text-sm text-slate-500">Loading prescription...</p>
            ) : error ? (
                <Alert variant="error">{error}</Alert>
            ) : prescription ? (
                <div className="space-y-4">
                    {/* 상단 처방 기본 정보 */}
                    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
                        <h3 className="text-lg font-bold text-slate-800">
                            {prescription.patientName ?? "Unknown"}
                        </h3>
                        <span className="ml-auto text-xs text-slate-500">
                            {/* 처방일시: */}
                            Prescribed At: {formatDateTime(prescription.prescribedAt)}
                        </span>
                    </div>

                    {/* 기본 정보 */}
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Status">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 font-medium">
                                {getStatusText(prescription.status)}
                            </div>
                        </FormField>
                        <FormField label="Prescriber ID">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                                {prescription.prescribedBy}
                            </div>
                        </FormField>
                        <FormField label="Service Type">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                                {prescription.serviceType ?? "-"}
                            </div>
                        </FormField>
                        <FormField label="Priority">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                                {prescription.priorityName ?? prescription.priorityCode ?? "-"}
                            </div>
                        </FormField>
                    </div>

                    {/* 처방 항목 목록 */}
                    <FormField label="Prescription Items">
                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                <tr>
                                    {/* 항목명 / 용량 / 횟수 / 투약일수 / 상세정보 */}
                                    <th className="p-2 font-semibold">Item</th>
                                    <th className="p-2 font-semibold">Dosage</th>
                                    <th className="p-2 font-semibold">Frequency</th>
                                    <th className="p-2 font-semibold">Duration (days)</th>
                                    <th className="p-2 font-semibold">Details</th>
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
                                            {/* 처방 항목이 없습니다. */}
                                            No prescription items.
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </FormField>

                    {/* 검사결과 (검사 처방 항목이 있을 때만 노출) */}
                    {labItems.length > 0 && (
                        <FormField label="Lab Results">
                            <div className="overflow-x-auto rounded-lg border border-slate-200">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                    <tr>
                                        {/* 검사항목 / 결과항목 / 결과값 / 참고범위 / 판정 */}
                                        <th className="p-2 font-semibold">Test</th>
                                        <th className="p-2 font-semibold">Result Item</th>
                                        <th className="p-2 font-semibold">Value</th>
                                        <th className="p-2 font-semibold">Reference Range</th>
                                        <th className="p-2 font-semibold">Flag</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 text-slate-800">
                                    {labItems.map((item) => {
                                        const details = item.resultDetails ?? [];

                                        // 결과가 아직 없는 경우: 전송 실패 / 결과 대기중
                                        if (details.length === 0) {
                                            return (
                                                <tr key={item.itemId}>
                                                    <td className="p-2 font-medium">{item.itemName}</td>
                                                    <td colSpan={4} className="p-2 text-slate-500">
                                                        {item.sendStatus === "FAILED"
                                                            // 검사오더 전송 실패
                                                            ? `Order failed${item.rejectReason ? `: ${item.rejectReason}` : ""}`
                                                            // 결과 대기중
                                                            : "Result pending"}
                                                    </td>
                                                </tr>
                                            );
                                        }

                                        return details.map((detail, index) => (
                                            <tr key={`${item.itemId}-${detail.seq}`}>
                                                <td className="p-2 font-medium">
                                                    {index === 0 ? (
                                                        <>
                                                            {item.itemName}
                                                            {item.resultReportedAt && (
                                                                <div className="text-xs font-normal text-slate-400">
                                                                    {/* 보고일시 */}
                                                                    Reported: {formatDateTime(item.resultReportedAt)}
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : null}
                                                </td>
                                                <td className="p-2">{detail.detailName ?? detail.detailCode ?? "-"}</td>
                                                <td className="p-2">
                                                    {detail.resultValue ?? "-"}
                                                    {detail.resultValue && detail.resultUnit ? ` ${detail.resultUnit}` : ""}
                                                </td>
                                                <td className="p-2">{detail.referenceRange ?? "-"}</td>
                                                <td className="p-2"><AbnormalBadge flag={detail.abnormalFlag} /></td>
                                            </tr>
                                        ));
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        </FormField>
                    )}

                    {/* 취소/보류/중단된 처방인 경우 사유 노출 */}
                    {prescription.status === "CANCELLED" && (
                        <FormField label="Cancellation Reason">
                            <div className="min-h-[2.5rem] whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-800">
                                {prescription.cancelReason ?? "-"}
                            </div>
                        </FormField>
                    )}
                    {prescription.status === "HOLD" && (
                        <FormField label="Hold Reason">
                            <div className="min-h-[2.5rem] whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-800">
                                {prescription.holdReason ?? "-"}
                            </div>
                        </FormField>
                    )}
                    {prescription.status === "DISCONTINUED" && (
                        <FormField label="Discontinuation Reason">
                            <div className="min-h-[2.5rem] whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-800">
                                {prescription.discontinuedReason ?? "-"}
                            </div>
                        </FormField>
                    )}

                    {/* 하단 버튼 영역 */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                        <Button
                            variant="danger"
                            onClick={handleDeactivate}
                            disabled={deactivateLoading}
                            className="mr-auto"
                        >
                            {deactivateLoading ? "Deactivating..." : "Deactivate"}
                        </Button>
                    </div>
                </div>
            ) : null}
        </Modal>
    );
};

export default PrescriptionDetail;

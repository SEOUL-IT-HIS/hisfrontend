"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import {
  cancelPrescriptionRequest,
  clearPrescriptionActionStatus,
  fetchPrescriptionDetailRequest,
  retryDispatchRequest,
  selectPrescriptionActionStatus,
  selectPrescriptionDetail,
  selectPrescriptionDetailStatus,
} from "@/features/inpatient/medicationmanagement/prescription/slice";
import {
  PRESCRIPTION_STATUS_CANCELLED,
  PRESCRIPTION_TYPE_MEDICATION,
  SEND_STATUS_FAILED,
  SEND_STATUS_SENT,
} from "@/features/inpatient/medicationmanagement/types";
import { useDoctorOptions } from "@/features/inpatient/admissiondischarge/useDoctorOptions";
import { INFO_ROW } from "@/components/inpatient/common/styles";
import { Alert, Button, Input } from "@/components/common";
import { InfoRow } from "@/components/inpatient/common/SectionCard";

const BADGE = "inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset";

// 항목 전송 상태 배지 (병동 백엔드가 등록 직후 검사실/약제부로 전송한 결과)
const SendBadge = ({ status }: { status: string | null }) => {
  if (status === SEND_STATUS_SENT) return <span className={`${BADGE} bg-emerald-50 text-emerald-700 ring-emerald-200`}>Sent</span>;
  if (status === SEND_STATUS_FAILED) return <span className={`${BADGE} bg-rose-50 text-rose-700 ring-rose-200`}>Send Failed</span>;
  return <span className={`${BADGE} bg-slate-100 text-slate-500 ring-slate-200`}>{status || "Not Sent"}</span>;
};

const formatDateTime = (value: string | Date | null | undefined) =>
  value ? new Date(value).toLocaleString() : "-";

type PrescriptionDetailProps = {
  prescriptionId: string;
};

const PrescriptionDetail = ({ prescriptionId }: PrescriptionDetailProps) => {
  // 처방의사 ID(empId) → 의사 이름
  const { nameById: doctorNameById } = useDoctorOptions();
  const dispatch = useDispatch<AppDispatch>();
  const prescription = useSelector(selectPrescriptionDetail);
  const { loading, error } = useSelector(selectPrescriptionDetailStatus);
  const actionStatus = useSelector(selectPrescriptionActionStatus);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);

  useEffect(() => {
    if (!prescriptionId) return;
    dispatch(fetchPrescriptionDetailRequest(prescriptionId));
    // 다른 처방을 열면 이전 처방의 재전송/취소 결과 메시지를 지움
    // (취소 사유 입력값은 부모가 key={prescriptionId}로 이 컴포넌트를 새로 그려서 자동으로 초기화됨)
    dispatch(clearPrescriptionActionStatus());
  }, [dispatch, prescriptionId]);

  const isCancelled = prescription?.status === PRESCRIPTION_STATUS_CANCELLED;
  // 아직 전송되지 않은(실패 포함) 항목이 있으면 재전송 버튼 노출
  const hasUnsent = prescription?.items?.some((item) => item.sendStatus !== SEND_STATUS_SENT) ?? false;
  // 이미 검사실/약제부로 전송된 항목 — 외래 취소(deactivate)는 처방 상태만 바꾸고 검사/약제서비스에는 전달되지 않음
  const sentItems = prescription?.items?.filter((item) => item.sendStatus === SEND_STATUS_SENT) ?? [];

  const onCancelSubmit = () => {
    if (!cancelReason.trim()) return;
    dispatch(cancelPrescriptionRequest({ prescriptionId, cancelReason: cancelReason.trim() }));
  };

  return (
    <div className="w-full">
      {loading && <p className="text-sm text-slate-400">Loading...</p>}
      {error && <Alert>{error}</Alert>}

      {!loading && prescription && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-3">
              <span className="text-sm font-semibold text-slate-800">Prescription Info</span>
              {/* 검사 결과는 나중에 도착하므로, 다시 불러와서 확인 */}
              <Button variant="secondary" className="!h-7 !rounded-lg !px-2.5 !text-xs"
                onClick={() => dispatch(fetchPrescriptionDetailRequest(prescriptionId))}
              >
                Refresh
              </Button>
            </div>
            <div>
              <div className={INFO_ROW}>
                <span className="text-slate-400">Status</span>
                {isCancelled ? (
                  <span className={`${BADGE} bg-rose-50 text-rose-700 ring-rose-200`}>Cancelled</span>
                ) : (
                  <span className="text-slate-800">{prescription.status}</span>
                )}
              </div>
              {isCancelled && (
                <>
                  <InfoRow label="Cancelled At">{formatDateTime(prescription.cancelledAt)}</InfoRow>
                  <InfoRow label="Cancel Reason">{prescription.cancelReason ?? "-"}</InfoRow>
                </>
              )}
              <InfoRow label="Service Type">{prescription.serviceType}</InfoRow>
              <InfoRow label="Order Method">{prescription.orderMethod}</InfoRow>
              <InfoRow label="Priority / Timing">{prescription.priorityCode} / {prescription.timingCode}</InfoRow>
              <InfoRow label="Prescribed At">{formatDateTime(prescription.prescribedAt)}</InfoRow>
              <InfoRow label="Prescribed By">{prescription.prescribedBy ? doctorNameById.get(prescription.prescribedBy) ?? prescription.prescribedBy : "-"}</InfoRow>
              <InfoRow label="Created At">{formatDateTime(prescription.createdAt)}</InfoRow>
              <InfoRow label="Updated At">{formatDateTime(prescription.updatedAt)}</InfoRow>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
              <span className="text-sm font-semibold text-slate-800">Prescription Items</span>
            </div>
            <div className="divide-y divide-slate-100">
              {prescription.items?.map((item) => {
                const isMedication = item.prescriptionType === PRESCRIPTION_TYPE_MEDICATION;
                return (
                  <div key={item.itemId} className="space-y-1.5 px-5 py-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-800">
                        {item.itemName}
                        <span className="ml-2 text-xs font-normal text-slate-500">
                          {item.prescriptionType} · {item.itemCode}
                        </span>
                      </span>
                      <SendBadge status={item.sendStatus} />
                    </div>
                    <p className="text-xs text-slate-500">
                      {isMedication && `${item.dosage ?? "-"} ${item.dosageFormCd ?? ""} · `}
                      {item.frequency || "-"} · {item.durationDays || "-"} day(s)
                      {item.sentAt && ` · sent ${formatDateTime(item.sentAt)}`}
                    </p>
                    {/* 검사 결과 — 검사서비스 결과 이벤트가 도착하면 표시 */}
                    {!isMedication && (
                      item.resultStatus ? (
                        <div className="rounded-xl border border-sky-200/80 bg-sky-50 px-3 py-2 text-xs text-sky-900">
                          <span className="font-medium">Result {item.resultStatus}</span>
                          <span className="ml-2 text-sky-700">{formatDateTime(item.resultReportedAt)}</span>
                          {item.resultSummary && <p className="mt-1 whitespace-pre-wrap">{item.resultSummary}</p>}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">Waiting for lab result</p>
                      )
                    )}
                  </div>
                );
              })}
              {(!prescription.items || prescription.items.length === 0) && (
                <p className="px-5 py-10 text-center text-sm text-slate-400">No items available.</p>
              )}
            </div>
          </div>

          {/* 재전송 / 취소 — 취소된 처방은 더 할 수 있는 동작이 없으므로 숨김 */}
          {!isCancelled && (
            <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="flex flex-wrap gap-2">
                {hasUnsent && (
                  <Button
                    onClick={() => dispatch(retryDispatchRequest(prescriptionId))}
                    disabled={actionStatus.loading}
                  >
                    Retry Send
                  </Button>
                )}
                <Button variant="danger"
                  onClick={() => setShowCancel((v) => !v)}
                  disabled={actionStatus.loading}
                >
                  Cancel Prescription
                </Button>
              </div>

              {/* 취소를 막지는 않음 — 등록 직후 자동 전송되므로 막으면 사실상 모든 처방이 취소 불가가 됨 */}
              {showCancel && sentItems.length > 0 && (
                <p className="rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Already sent to the lab / pharmacy: {sentItems.map((item) => item.itemName).join(", ")}.
                  Cancelling here does not withdraw those orders — please notify the lab / pharmacy separately.
                </p>
              )}
              {showCancel && (
                <div className="flex gap-2">
                  <Input
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Cancel reason"
                  />
                  <Button variant="danger" className="shrink-0"
                    onClick={onCancelSubmit}
                    disabled={actionStatus.loading || !cancelReason.trim()}
                  >
                    {actionStatus.loading ? "Processing..." : "Confirm Cancel"}
                  </Button>
                </div>
              )}

              {actionStatus.error && <Alert>{actionStatus.error}</Alert>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PrescriptionDetail;

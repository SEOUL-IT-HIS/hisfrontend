"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  cancelDispensePrescriptionRequest,
  dispensePrescriptionRequest,
  fetchPrescriptionDetailRequest,
  rejectPrescriptionRequest,
} from "@/features/pharmacy/slice";
import type { RootState } from "@/store/store";
import {
  Button,
  DataTable,
  FormField,
  Input,
  Modal,
  PageHeader,
  Panel,
} from "@/components/common";
import type { DataTableColumn } from "@/components/common";
import type { PrescriptionItem } from "@/features/pharmacy/types";
import { dosageFormLabel } from "@/features/pharmacy/labels";
import { useActor } from "@/features/pharmacy/useActor";
import { usePatientNames } from "@/features/labimaging/common/hooks/usePatientNames";
import { useEmpNames } from "@/features/emp/hooks/useEmpNames";
import { useDepartmentNames } from "@/features/commonCode/hooks/useDepartmentNames";
import ReleasePanel from "./ReleasePanel";
import ReturnCell from "./ReturnCell";
import PrescriptionSteps from "./PrescriptionSteps";
import OrderMetaBadges from "./OrderMetaBadges";
import PrescriptionItemModal from "./PrescriptionItemModal";

// 환자 일괄 조회(POST /api/patient/batch)는 UUID 아닌 값이 하나라도 섞이면 요청 전체가 실패하므로,
// 테스트용 더미 ID(TEST-PATIENT-001 등)는 걸러내고 UUID 형식만 보낸다(목록 화면과 동일).
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatDateTime(value: string): string {
  return value.replace("T", " ").slice(0, 19);
}

export default function PrescriptionDetail() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch();
  const { actorId, actorName } = useActor();
  const detail = useSelector((state: RootState) => state.pharmacy.prescriptionDetail);
  const loading = useSelector(
    (state: RootState) => state.pharmacy.prescriptionDetailLoading
  );
  const error = useSelector(
    (state: RootState) => state.pharmacy.prescriptionDetailError
  );
  const actionLoading = useSelector(
    (state: RootState) => state.pharmacy.prescriptionActionLoading
  );
  const actionError = useSelector(
    (state: RootState) => state.pharmacy.prescriptionActionError
  );
  const [rejectReason, setRejectReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [dispenseConfirmOpen, setDispenseConfirmOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    dispatch(fetchPrescriptionDetailRequest(id));
  }, [id, dispatch]);

  // 조제/불출/반납 처리 후 상세를 다시 불러오는 동안에도 화면을 그대로 두어야 입력 중이던 상태(반납 후
  // 폐기 입력 등)가 사라지지 않는다. 다른 처방전으로 이동했을 때만 이전 데이터를 숨긴다.
  const current = detail && detail.prescriptionLinkId === id ? detail : null;

  // 목록 화면과 동일하게, ID는 표시하지 않고 이름으로만 보여준다.
  const { names: patientNames } = usePatientNames(
    current && UUID_PATTERN.test(current.patientId) ? [current.patientId] : []
  );
  const { names: empNames } = useEmpNames();
  const { names: departmentNames } = useDepartmentNames();

  const hasReturns = current
    ? current.items.some((item) => item.dispensingLots.some((lot) => lot.returnedQty > 0))
    : false;
  const releasedNow = current?.release?.releaseStatusCd === "RELEASED";
  const selectedItem = current?.items.find((item) => item.prescriptionItemLinkId === selectedItemId) ?? null;
  const shortageItems = current
    ? current.items.filter((item) => item.availableQty < item.expectedQty)
    : [];

  const handleConfirmDispense = () => {
    if (!id || !actorId) return;
    dispatch(dispensePrescriptionRequest({ prescriptionLinkId: id, actorId }));
    setDispenseConfirmOpen(false);
  };

  const handleReject = () => {
    // 백엔드도 reason을 @NotBlank로 막지만, 빈 사유로는 아예 요청을 보내지 않는다.
    if (!id || !actorId || !rejectReason.trim()) return;
    dispatch(
      rejectPrescriptionRequest({
        prescriptionLinkId: id,
        reason: rejectReason.trim(),
        actorId,
      })
    );
  };

  const handleCancelDispense = () => {
    if (!id || !actorId || !cancelReason.trim()) return;
    dispatch(
      cancelDispensePrescriptionRequest({
        prescriptionLinkId: id,
        reason: cancelReason.trim(),
        actorId,
      })
    );
    setCancelReason("");
  };

  const columns: DataTableColumn<PrescriptionItem>[] = useMemo(
    () => [
      {
        key: "medication",
        header: "Medication",
        render: (row) => (
          <div>
            <p className="font-medium text-sky-700">{row.medicationName ?? row.medicationId}</p>
            <p className="text-xs text-slate-400">EDI {row.ediCode ?? "-"}</p>
          </div>
        ),
      },
      {
        key: "dosage",
        header: "Dosage",
        render: (row) => (
          <div>
            <p>{row.dosageQty}</p>
            <p className="text-xs text-slate-400">{dosageFormLabel(row.dosageFormCd)}</p>
          </div>
        ),
      },
      { key: "frequency", header: "Frequency", render: (row) => row.frequency || "-" },
      { key: "durationDays", header: "Days", render: (row) => row.durationDays || "-" },
      {
        key: "expectedQty",
        header: "Expected Qty",
        render: (row) => (
          <div>
            <p>{row.expectedQty}</p>
            {row.qtyAmbiguous && <p className="text-xs text-amber-600">Check quantity</p>}
          </div>
        ),
      },
      {
        key: "availableQty",
        header: "In Stock",
        render: (row) => {
          // 아직 조제 전(RECEIVED)일 때만 부족 여부가 의미 있다 — 조제 후에는 이미 차감된 뒤의 재고다.
          const short = current?.status === "RECEIVED" && row.availableQty < row.expectedQty;
          return <span className={short ? "font-semibold text-rose-600" : undefined}>{row.availableQty}</span>;
        },
      },
      {
        key: "dispensedQty",
        header: "Dispensed",
        render: (row) => row.dispensedQty ?? "-",
      },
      {
        // 불출(RELEASED)된 건만 반납을 받을 수 있다 — 아직 환자에게 전달 안 됐으면 반납 자체가 성립 안 함.
        // 한 항목이 여러 로트에서 조제됐으면 로트마다 한 줄씩 반납 입력이 나온다.
        key: "return",
        header: "Return",
        render: (row) =>
          releasedNow && id && row.dispensingLots.length > 0 ? (
            // 행 전체가 클릭(상세 모달)되는 표라서, 반납 입력을 눌러도 모달이 같이 열리지 않게 막는다.
            <div className="flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
              {row.dispensingLots.map((lot) => (
                <ReturnCell key={lot.dispensingItemId} lot={lot} prescriptionLinkId={id} />
              ))}
            </div>
          ) : (
            <span className="text-xs text-slate-300">-</span>
          ),
      },
    ],
    [current?.status, releasedNow, id]
  );

  return (
    <div className="flex flex-col gap-4 pb-8">
      <PageHeader title="Prescription Details" description="Details of a prescription forwarded to pharmacy." />
      <Link href="/pharmacy/prescription" className="text-sm text-sky-700 underline">
        Back to Prescription List
      </Link>

      {!current && loading && <p className="text-sm text-slate-400">Loading...</p>}
      {error && <p className="text-sm text-rose-500">{error}</p>}

      {current && (
        <>
          {current.cancelOutcome === "REFUSED" && (
            <div className="shrink-0 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold">The prescriber cancelled this prescription, but it could not be cancelled automatically.</p>
              <p className="mt-1">
                It has already been released, so the pharmacy must check it manually.
                {current.cancelReason ? ` Reason: ${current.cancelReason}` : ""}
                {current.cancelRequestedAt ? ` (requested ${formatDateTime(current.cancelRequestedAt)})` : ""}
              </p>
            </div>
          )}
          <Panel className="shrink-0 p-5">
            <PrescriptionSteps
              status={current.status}
              releaseStatusCd={current.release?.releaseStatusCd ?? null}
              hasReturns={hasReturns}
            />
          </Panel>

          <Panel className="shrink-0 p-5">
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-slate-400">Patient</dt>
                <dd className="text-slate-700">
                  {patientNames[current.patientId] ?? current.patientId}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Doctor</dt>
                <dd className="text-slate-700">
                  {empNames[current.physicianId] ?? current.physicianId}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Department</dt>
                <dd className="text-slate-700">
                  {departmentNames[current.departmentId] ?? current.departmentId}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Created At</dt>
                <dd className="text-slate-700">{formatDateTime(current.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Status</dt>
                <dd className="inline-flex flex-wrap items-center gap-1.5 text-slate-700">
                  {current.status}
                  <OrderMetaBadges
                    encounterType={current.encounterType}
                    priorityCode={current.priorityCode}
                    verbalYn={current.verbalYn}
                  />
                </dd>
              </div>
              {current.dispensedById && (
                <div>
                  <dt className="text-xs text-slate-400">Dispensed by</dt>
                  <dd className="text-slate-700">{empNames[current.dispensedById] ?? current.dispensedById}</dd>
                </div>
              )}
              {current.status === "CANCELLED" && (
                <>
                  <div>
                    <dt className="text-xs text-slate-400">Cancel Reason</dt>
                    <dd className="text-slate-700">{current.cancelReason || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400">Cancelled by</dt>
                    <dd className="text-slate-700">
                      {current.cancelledById ? empNames[current.cancelledById] ?? current.cancelledById : "-"}
                    </dd>
                  </div>
                  {current.cancelRequestedAt && (
                    <div>
                      <dt className="text-xs text-slate-400">Cancelled At</dt>
                      <dd className="text-slate-700">{formatDateTime(current.cancelRequestedAt)}</dd>
                    </div>
                  )}
                </>
              )}
              {current.status === "REJECTED" && (
                <>
                  <div>
                    <dt className="text-xs text-slate-400">Reject Reason</dt>
                    <dd className="text-slate-700">{current.rejectReason}</dd>
                  </div>
                  {current.rejectedById && (
                    <div>
                      <dt className="text-xs text-slate-400">Rejected by</dt>
                      <dd className="text-slate-700">{empNames[current.rejectedById] ?? current.rejectedById}</dd>
                    </div>
                  )}
                </>
              )}
            </dl>
          </Panel>

          <Panel className="shrink-0 p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">
              Prescribed Medications <span className="font-normal text-slate-400">(click a row for details)</span>
            </h3>
            <DataTable
              columns={columns}
              rows={current.items}
              rowKey={(row) => row.prescriptionItemLinkId}
              emptyMessage="No prescription items."
              minWidthClassName="min-w-[760px]"
              onRowClick={(row) => setSelectedItemId(row.prescriptionItemLinkId)}
            />
            {current.status === "RECEIVED" && shortageItems.length > 0 && (
              <p className="mt-3 text-sm text-rose-600">
                Not enough stock for: {shortageItems.map((item) => item.medicationName ?? item.medicationId).join(", ")}.
                Receive more stock before dispensing, or reject this prescription.
              </p>
            )}
          </Panel>

          {/* 조제완료/거절은 접수(RECEIVED) 상태에서만 가능하다. 그 외 상태는 백엔드가 PHM010으로 막는다. */}
          {current.status === "RECEIVED" && (
            <Panel className="shrink-0 p-5">
              <div className="flex flex-col gap-4">
                <p className="text-xs text-slate-400">Processing as: {actorName || "-"} (signed-in user)</p>
                <div className="flex justify-end">
                  <Button
                    onClick={() => setDispenseConfirmOpen(true)}
                    disabled={actionLoading || !actorId}
                  >
                    Dispense
                  </Button>
                </div>
                <FormField label="Reject Reason" required>
                  <Input
                    type="text"
                    placeholder="Reject Reason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </FormField>
                <div className="flex justify-end">
                  <Button
                    variant="danger"
                    onClick={handleReject}
                    disabled={actionLoading || !actorId || !rejectReason.trim()}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </Panel>
          )}

          {/* 조제취소는 조제완료(DISPENSED) 상태에서만 가능하다. 재고가 그대로 복구되고 RECEIVED로 돌아간다.
              이미 불출된 건은 먼저 불출을 취소해야 한다(서버도 PHM025로 막는다). */}
          {current.status === "DISPENSED" && (
            <Panel className="shrink-0 p-5">
              <div className="flex flex-col gap-4">
                {releasedNow ? (
                  <p className="text-sm text-slate-400">
                    This prescription has been released. To cancel the dispensing, cancel the release first.
                  </p>
                ) : (
                  <>
                    <FormField label="Cancel Dispense Reason" required>
                      <Input
                        type="text"
                        placeholder="Cancel Dispense Reason"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                      />
                    </FormField>
                    <div className="flex justify-end">
                      <Button
                        variant="danger"
                        onClick={handleCancelDispense}
                        disabled={actionLoading || !actorId || !cancelReason.trim()}
                      >
                        Cancel Dispense
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Panel>
          )}
          {actionError && <p className="text-sm text-rose-500">{actionError}</p>}

          {current.status === "DISPENSED" && id && (
            <ReleasePanel
              prescriptionLinkId={id}
              release={current.release}
              hasReturns={hasReturns}
            />
          )}

          <PrescriptionItemModal
            item={selectedItem}
            prescriptionStatus={current.status}
            onClose={() => setSelectedItemId(null)}
          />

          <Modal
            open={dispenseConfirmOpen}
            title="Confirm Dispensing"
            onClose={() => setDispenseConfirmOpen(false)}
            maxWidthClassName="max-w-2xl"
            footer={
              <>
                <Button variant="secondary" onClick={() => setDispenseConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDispense}
                  disabled={actionLoading || !actorId || shortageItems.length > 0}
                >
                  Confirm Dispense
                </Button>
              </>
            }
          >
            <p className="mb-3 text-sm text-slate-600">
              The following will be deducted from stock (earliest-expiring lot first). This can be undone with
              &quot;Cancel Dispense&quot; until the medication is released.
            </p>
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-400">
                <tr>
                  <th className="py-1 pr-3 font-medium">Medication</th>
                  <th className="py-1 pr-3 font-medium">Deduct</th>
                  <th className="py-1 font-medium">In stock</th>
                </tr>
              </thead>
              <tbody>
                {current.items.map((item) => {
                  const short = item.availableQty < item.expectedQty;
                  return (
                    <tr key={item.prescriptionItemLinkId} className="border-t border-slate-100 text-slate-700">
                      <td className="py-1.5 pr-3">
                        {item.medicationName ?? item.medicationId}
                        {item.qtyAmbiguous && (
                          <span className="ml-2 text-xs text-amber-600">check quantity</span>
                        )}
                      </td>
                      <td className="py-1.5 pr-3">{item.expectedQty}</td>
                      <td className={`py-1.5 ${short ? "font-semibold text-rose-600" : ""}`}>
                        {item.availableQty}
                        {short && " (insufficient)"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {current.items.some((item) => item.qtyAmbiguous) && (
              <p className="mt-3 text-xs text-amber-600">
                For items marked &quot;check quantity&quot;, the frequency or duration was free text that could not be read
                as a single number, so that part was counted as 1. Confirm the quantity is right before dispensing.
              </p>
            )}
            {shortageItems.length > 0 && (
              <p className="mt-3 text-sm text-rose-600">Dispensing is disabled because stock is insufficient.</p>
            )}
            <p className="mt-3 text-xs text-slate-400">Dispensed by: {actorName || "-"}</p>
          </Modal>
        </>
      )}
    </div>
  );
}

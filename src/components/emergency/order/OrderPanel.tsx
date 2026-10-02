"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, FormField, Input, Select } from "@/components/common";
import { resolveEmergencyMessage } from "@/features/emergency/messages";
import { CODE_GROUP, optionLabel, toCodeOptions } from "@/features/emergency/codes";
import {
  cancelOrderRequest,
  clearOrderErrors,
  createOrderRequest,
  dispatchOrderRequest,
  fetchOrderRequest,
  selectOrderActionError,
  selectOrderBusyId,
  selectOrdersByReception,
  selectOrderSubmitError,
  selectOrderSubmitting,
} from "@/features/emergency/order/slice";
import {
  ORDER_ITEM_TYPE,
  ORDER_ITEM_TYPE_OPTIONS,
  ORDER_PRIORITY_FALLBACK_OPTIONS,
  ORDER_TIMING_FALLBACK_OPTIONS,
  type Order,
  type OrderItem,
} from "@/features/emergency/order/types";
import {
  fetchAllCommonCodesRequest,
  selectCommonCodeLoaded,
  selectCommonCodesByGroup,
} from "@/features/emergency/commonCode/slice";
import { formatDateTime } from "@/features/emergency/utils";

type OrderPanelProps = { receptionNo: string; className?: string };

type ItemForm = {
  prescriptionType: string;
  itemCode: string;
  itemName: string;
  dosage: string;
  dosageFormCd: string;
  frequency: string;
  durationDays: string;
};

const emptyItem = (): ItemForm => ({
  prescriptionType: ORDER_ITEM_TYPE.LAB,
  itemCode: "",
  itemName: "",
  dosage: "",
  dosageFormCd: "",
  frequency: "",
  durationDays: "",
});

const initialForm = { prescribedBy: "", priorityCode: "01", timingCode: "03", verbal: false, dispatchNow: true };
const initialCancel = { cancelReason: "", userId: "" };

/** 처방 상태 문구 — 처방코어가 돌려준 상태를 그대로 보여준다(예: ORDERED, CANCELLED) */
function statusStyle(status: string | null): string {
  const value = (status ?? "").toUpperCase();
  if (value.startsWith("CANCEL") || value.startsWith("DEACTIV")) return "bg-slate-100 text-slate-500";
  return "bg-sky-50 text-sky-700";
}

function dispatchLabel(status: string | null): string | null {
  if (status === "SENT") return "Sent";
  if (status === "FAILED") return "Send failed";
  return null;
}

/**
 * 응급 처방 패널 — 검사·약품 처방 등록, 전송, 취소 (처방코어 OPD 연동, BFF /api/emergency/orders)
 * - 처방 원장은 처방코어가 소유한다. 응급은 호출만 하고 처방 내용을 응급 DB에 저장하지 않는다.
 * - 영상(방사선) 오더는 처방코어가 받지 않아 제외했다.
 * - 처방 수정은 없다 — 변경은 취소 후 재등록.
 * - 구두처방은 지금은 일반 처방으로 등록만 된다(처방코어가 구두 표시·확정을 지원하면 붙인다).
 * - 목록: 처방코어의 receptionId 목록 조회가 나오기 전까지는 이 화면에서 등록했거나 처방ID로 불러온 처방만 보인다.
 */
export default function OrderPanel({ receptionNo, className = "" }: OrderPanelProps) {
  const dispatch = useDispatch<AppDispatch>();
  const orders = useSelector(selectOrdersByReception(receptionNo));
  const submitting = useSelector(selectOrderSubmitting);
  const submitError = useSelector(selectOrderSubmitError);
  const busyOrderId = useSelector(selectOrderBusyId);
  const actionError = useSelector(selectOrderActionError);
  const commonCodeLoaded = useSelector(selectCommonCodeLoaded);
  const priorityCodes = useSelector(selectCommonCodesByGroup(CODE_GROUP.ORDER_PRIORITY));
  const timingCodes = useSelector(selectCommonCodesByGroup(CODE_GROUP.ORDER_TIMING));

  const [form, setForm] = useState(initialForm);
  const [items, setItems] = useState<ItemForm[]>([emptyItem()]);
  const [lookupId, setLookupId] = useState("");
  const [cancelTarget, setCancelTarget] = useState("");
  const [cancelForm, setCancelForm] = useState(initialCancel);
  const [lastCount, setLastCount] = useState(0);
  const [lastReceptionNo, setLastReceptionNo] = useState(receptionNo);

  useEffect(() => {
    if (!commonCodeLoaded) dispatch(fetchAllCommonCodesRequest());
  }, [dispatch, commonCodeLoaded]);

  // 환자를 바꾸면 입력 중이던 값과 이전 오류를 지운다.
  if (receptionNo !== lastReceptionNo) {
    setLastReceptionNo(receptionNo);
    setForm(initialForm);
    setItems([emptyItem()]);
    setLookupId("");
    setCancelTarget("");
    setCancelForm(initialCancel);
    setLastCount(orders.length);
    dispatch(clearOrderErrors());
  }

  // 등록에 성공해 목록이 늘어나면 폼을 비운다(실패했을 때는 입력을 남겨 고칠 수 있게).
  if (orders.length > lastCount) {
    setLastCount(orders.length);
    if (!submitting && !submitError) {
      setForm((prev) => ({ ...initialForm, prescribedBy: prev.prescribedBy }));
      setItems([emptyItem()]);
    }
  } else if (orders.length < lastCount) {
    setLastCount(orders.length);
  }

  const priorityOptions = toCodeOptions(priorityCodes, ORDER_PRIORITY_FALLBACK_OPTIONS);
  const timingOptions = toCodeOptions(timingCodes, ORDER_TIMING_FALLBACK_OPTIONS);

  const itemsValid = items.every((item) => !!item.itemCode.trim() && !!item.itemName.trim());
  const canSubmit =
    !!receptionNo &&
    !submitting &&
    !!form.prescribedBy.trim() &&
    !!form.priorityCode &&
    !!form.timingCode &&
    items.length > 0 &&
    itemsValid;

  function handleFormChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  function handleItemChange(index: number, e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [name]: value } : item)));
  }

  function toRequestItem(item: ItemForm): OrderItem {
    const isDrug = item.prescriptionType === ORDER_ITEM_TYPE.DRUG;
    const dosage = Number(item.dosage);
    return {
      prescriptionType: item.prescriptionType,
      itemCode: item.itemCode.trim(),
      itemName: item.itemName.trim(),
      // 용량·제형·횟수·일수는 약품에만 보낸다
      dosage: isDrug && item.dosage.trim() && Number.isFinite(dosage) ? dosage : undefined,
      dosageFormCd: isDrug ? item.dosageFormCd.trim() || undefined : undefined,
      frequency: isDrug ? item.frequency.trim() || undefined : undefined,
      durationDays: isDrug ? item.durationDays.trim() || undefined : undefined,
    };
  }

  function handleSubmit() {
    if (!canSubmit) return;
    dispatch(
      createOrderRequest({
        encounterId: receptionNo,
        prescribedBy: form.prescribedBy.trim(),
        priorityCode: form.priorityCode,
        timingCode: form.timingCode,
        verbalYn: form.verbal ? "Y" : "N",
        dispatchNow: form.dispatchNow,
        items: items.map(toRequestItem),
      }),
    );
  }

  function handleLookup() {
    const id = lookupId.trim();
    if (!id || !receptionNo) return;
    dispatch(fetchOrderRequest(receptionNo, id));
    setLookupId("");
  }

  function handleCancel(order: Order) {
    if (!cancelForm.cancelReason.trim() || !cancelForm.userId.trim()) return;
    dispatch(
      cancelOrderRequest(order.orderId, {
        cancelReason: cancelForm.cancelReason.trim(),
        userId: cancelForm.userId.trim(),
      }),
    );
    setCancelTarget("");
    setCancelForm(initialCancel);
  }

  function isCancelled(order: Order): boolean {
    return !!order.cancelledAt || /^(CANCEL|DEACTIV)/i.test(order.status ?? "");
  }

  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
      {/* 처방 (검사·약품) */}
      <h3 className="mb-1 text-sm font-semibold text-slate-800">Orders (Lab Tests · Drugs)</h3>
      <p className="mb-3 text-xs text-slate-400">
        {/* 처방 원장은 처방코어가 소유합니다. 영상 오더는 지원하지 않고, 수정은 취소 후 재등록입니다. */}
        Orders are kept in the order core. Imaging orders are not supported. To change an order, cancel it and register a new one.
      </p>

      {actionError ? <Alert variant="error">{resolveEmergencyMessage(actionError)}</Alert> : null}

      {/* 처방 목록 */}
      {orders.length > 0 ? (
        <ul className="mb-4 space-y-2">
          {orders.map((order) => {
            const cancelled = isCancelled(order);
            const busy = busyOrderId === order.orderId;
            const orderItems = order.items ?? [];
            const hasLab = orderItems.some((item) => item.prescriptionType === ORDER_ITEM_TYPE.LAB);
            const hasDrug = orderItems.some((item) => item.prescriptionType === ORDER_ITEM_TYPE.DRUG);
            const labState = dispatchLabel(order.labDispatchStatus);
            const pharmacyState = dispatchLabel(order.pharmacyDispatchStatus);
            return (
              <li key={order.orderId} className="rounded-lg bg-slate-50 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle(order.status)}`}>
                    {order.status ?? "-"}
                  </span>
                  {order.priorityCode ? (
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                      {optionLabel(priorityOptions, order.priorityCode)}
                    </span>
                  ) : null}
                  {order.timingCode ? (
                    <span className="text-xs text-slate-500">{optionLabel(timingOptions, order.timingCode)}</span>
                  ) : null}
                  {order.verbalYn === "Y" ? <span className="text-xs text-amber-600">Verbal</span> : null}
                  <span className="ml-auto text-xs text-slate-400">
                    {/* 처방ID */}
                    Order ID: <span className="select-all font-mono">{order.orderId}</span>
                  </span>
                </div>

                {orderItems.length > 0 ? (
                  <ul className="mt-2 space-y-0.5 text-slate-800">
                    {orderItems.map((item, index) => (
                      <li key={`${item.itemCode}-${index}`}>
                        <span className="text-xs font-medium text-sky-600">
                          {item.prescriptionType === ORDER_ITEM_TYPE.DRUG ? "Drug" : "Lab"}
                        </span>{" "}
                        {item.itemName} <span className="text-xs text-slate-400">({item.itemCode})</span>
                        {item.dosage ? (
                          <span className="text-xs text-slate-500">
                            {" "}
                            · {item.dosage}
                            {item.dosageFormCd ? ` ${item.dosageFormCd}` : ""}
                            {item.frequency ? ` ${item.frequency}` : ""}
                            {item.durationDays ? ` · ${item.durationDays}d` : ""}
                          </span>
                        ) : null}
                        {item.sendStatus ? (
                          <span className="text-xs text-slate-400"> · Status: {item.sendStatus}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <p className="mt-1 text-xs text-slate-400">
                  {order.prescribedBy ?? "-"}
                  {order.prescribedAt ? ` · ${formatDateTime(order.prescribedAt)}` : ""}
                  {labState ? ` · Lab: ${labState}` : ""}
                  {pharmacyState ? ` · Pharmacy: ${pharmacyState}` : ""}
                  {cancelled && order.cancelReason ? ` · Cancelled: ${order.cancelReason}` : ""}
                </p>

                {!cancelled ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {hasLab ? (
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onClick={() => dispatch(dispatchOrderRequest(order.orderId, "LAB"))}
                      >
                        {order.labDispatchStatus === "FAILED" ? "Resend to Lab" : "Send to Lab"}
                      </Button>
                    ) : null}
                    {hasDrug ? (
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onClick={() => dispatch(dispatchOrderRequest(order.orderId, "PHARMACY"))}
                      >
                        {order.pharmacyDispatchStatus === "FAILED" ? "Resend to Pharmacy" : "Send to Pharmacy"}
                      </Button>
                    ) : null}
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() => dispatch(fetchOrderRequest(receptionNo, order.orderId))}
                    >
                      Refresh
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={busy}
                      onClick={() => setCancelTarget(cancelTarget === order.orderId ? "" : order.orderId)}
                    >
                      Cancel Order
                    </Button>
                  </div>
                ) : null}

                {cancelTarget === order.orderId && !cancelled ? (
                  <div className="mt-2 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-3">
                    <FormField label="Cancel Reason" required className="w-[260px]">
                      <Input
                        value={cancelForm.cancelReason}
                        onChange={(e) => setCancelForm((prev) => ({ ...prev, cancelReason: e.target.value }))}
                        maxLength={200}
                      />
                    </FormField>
                    <FormField label="Cancelled By ID" required className="w-[180px]">
                      <Input
                        value={cancelForm.userId}
                        onChange={(e) => setCancelForm((prev) => ({ ...prev, userId: e.target.value }))}
                        maxLength={36}
                      />
                    </FormField>
                    <Button
                      variant="danger"
                      disabled={busy || !cancelForm.cancelReason.trim() || !cancelForm.userId.trim()}
                      onClick={() => handleCancel(order)}
                    >
                      Confirm Cancel
                    </Button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        // 이 화면에서 등록했거나 불러온 처방이 없습니다.
        <p className="mb-4 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-400">
          {receptionNo ? "No orders registered or loaded in this screen yet." : "Select a patient first."}
        </p>
      )}

      {/* 처방ID로 불러오기 (처방코어의 접수별 목록 조회가 나오기 전까지 쓰는 방법) */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <FormField label="Load an existing order by ID" className="w-[420px]">
          <Input
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
            placeholder="Order ID (36 characters)"
            disabled={!receptionNo}
            maxLength={36}
          />
        </FormField>
        <Button variant="secondary" onClick={handleLookup} disabled={!receptionNo || !lookupId.trim() || !!busyOrderId}>
          Load
        </Button>
      </div>

      <h4 className="mb-2 text-sm font-semibold text-slate-700">New Order</h4>
      {submitError ? <Alert variant="error">{resolveEmergencyMessage(submitError)}</Alert> : null}

      <div className="flex flex-wrap gap-3">
        {/* 처방의 ID */}
        <FormField label="Prescribed By ID" required className="w-[180px]">
          <Input name="prescribedBy" value={form.prescribedBy} onChange={handleFormChange} disabled={submitting} maxLength={36} />
        </FormField>
        {/* 우선순위 */}
        <FormField label="Priority" required className="w-[160px]">
          <Select name="priorityCode" value={form.priorityCode} onChange={handleFormChange} options={priorityOptions} disabled={submitting} />
        </FormField>
        {/* 시점 */}
        <FormField label="Timing" required className="w-[200px]">
          <Select name="timingCode" value={form.timingCode} onChange={handleFormChange} options={timingOptions} disabled={submitting} />
        </FormField>
      </div>

      <div className="mt-3 space-y-3">
        {items.map((item, index) => {
          const isDrug = item.prescriptionType === ORDER_ITEM_TYPE.DRUG;
          return (
            <div key={index} className="rounded-lg border border-slate-200 p-3">
              <div className="flex flex-wrap gap-3">
                <FormField label="Type" required className="w-[140px]">
                  <Select
                    name="prescriptionType"
                    value={item.prescriptionType}
                    onChange={(e) => handleItemChange(index, e)}
                    options={[...ORDER_ITEM_TYPE_OPTIONS]}
                    disabled={submitting}
                  />
                </FormField>
                <FormField label="Item Code" required className="w-[160px]">
                  <Input name="itemCode" value={item.itemCode} onChange={(e) => handleItemChange(index, e)} disabled={submitting} maxLength={50} />
                </FormField>
                <FormField label="Item Name" required className="w-[240px]">
                  <Input name="itemName" value={item.itemName} onChange={(e) => handleItemChange(index, e)} disabled={submitting} maxLength={100} />
                </FormField>
                {items.length > 1 ? (
                  <div className="flex items-end">
                    <Button variant="ghost" disabled={submitting} onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}>
                      Remove
                    </Button>
                  </div>
                ) : null}
              </div>
              {isDrug ? (
                <div className="mt-3 flex flex-wrap gap-3">
                  <FormField label="Dosage" className="w-[110px]">
                    <Input name="dosage" value={item.dosage} onChange={(e) => handleItemChange(index, e)} disabled={submitting} inputMode="decimal" />
                  </FormField>
                  <FormField label="Form" className="w-[110px]">
                    <Input name="dosageFormCd" value={item.dosageFormCd} onChange={(e) => handleItemChange(index, e)} disabled={submitting} placeholder="TAB" maxLength={20} />
                  </FormField>
                  <FormField label="Frequency" className="w-[120px]">
                    <Input name="frequency" value={item.frequency} onChange={(e) => handleItemChange(index, e)} disabled={submitting} placeholder="TID" maxLength={20} />
                  </FormField>
                  <FormField label="Days" className="w-[100px]">
                    <Input name="durationDays" value={item.durationDays} onChange={(e) => handleItemChange(index, e)} disabled={submitting} maxLength={10} />
                  </FormField>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-700">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="verbal" checked={form.verbal} onChange={handleFormChange} disabled={submitting} />
          {/* 구두처방 — 지금은 일반 처방으로 등록됩니다 */}
          Verbal order <span className="text-xs text-slate-400">(registered as an ordinary order for now)</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="dispatchNow" checked={form.dispatchNow} onChange={handleFormChange} disabled={submitting} />
          {/* 등록 직후 검사·약제로 전송 */}
          Send to Lab / Pharmacy right away
        </label>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <Button variant="secondary" disabled={submitting} onClick={() => setItems((prev) => [...prev, emptyItem()])}>
          Add Item
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {/* 등록 중... / 처방 등록 */}
          {submitting ? "Registering..." : "Register Order"}
        </Button>
      </div>
    </section>
  );
}

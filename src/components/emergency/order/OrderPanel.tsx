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
  confirmVerbalRequest,
  createOrderRequest,
  dispatchOrderRequest,
  fetchOrderRequest,
  fetchOrdersRequest,
  searchLabItemsRequest,
  selectLabItems,
  selectLabItemsError,
  selectLabItemsLoading,
  selectOrderActionError,
  selectOrderBusyId,
  selectOrderListError,
  selectOrderListStatus,
  selectOrdersByReception,
  selectOrderSubmitError,
  selectOrderSubmitting,
} from "@/features/emergency/order/slice";
import {
  ORDER_ITEM_TYPE,
  ORDER_ITEM_TYPE_OPTIONS,
  ORDER_PRIORITY_FALLBACK_OPTIONS,
  ORDER_TIMING_FALLBACK_OPTIONS,
  type LabItem,
  type Order,
  type OrderItem,
} from "@/features/emergency/order/types";
import {
  isOrderCancelled,
  labSendState,
  mayHaveDrug,
  mayHaveLab,
  pharmacySendState,
  visiblePharmacyState,
} from "@/features/emergency/order/utils";
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

/** 구두처방을 확정한 처방인지 */
function isVerbalConfirmed(order: Order): boolean {
  return !!order.verbalConfirmedAt || !!order.verbalConfirmedBy;
}

/** 처방 상태 문구 — 처방코어가 돌려준 상태를 그대로 보여준다(예: ORDERED, CANCELLED) */
function statusStyle(status: string | null): string {
  const value = (status ?? "").toUpperCase();
  if (value.startsWith("CANCEL") || value.startsWith("DEACTIV")) return "bg-slate-100 text-slate-500";
  return "bg-sky-50 text-sky-700";
}

/** 처방코어 전송 상태 → 화면 문구 */
function sendLabel(status: string | null): string | null {
  if (status === "SENT") return "Sent";
  if (status === "FAILED") return "Send failed";
  // PENDING: 아직 보내지 않았거나, 보냈고 LAB·약제의 처리 결과를 기다리는 중(처방코어는 두 경우 모두 PENDING 으로 둔다)
  if (status === "PENDING") return "Pending";
  if (status === "REQUESTED") return "Requested";
  return null;
}

function sendStyle(status: string | null): string {
  if (status === "FAILED") return "bg-rose-50 text-rose-700";
  if (status === "SENT") return "bg-emerald-50 text-emerald-700";
  return "bg-amber-50 text-amber-700";
}

/**
 * 응급 처방 패널 — 검사·약품 처방 등록, 전송, 취소 (처방코어 OPD 연동, BFF /api/emergency/orders)
 * - 처방 원장은 처방코어가 소유한다. 응급은 호출만 하고 처방 내용을 응급 DB에 저장하지 않는다.
 * - 영상(방사선) 오더는 처방코어가 받지 않아 제외했다.
 * - 처방 수정은 없다 — 변경은 취소 후 재등록.
 * - 구두처방: 등록 때 Verbal order 를 체크하면 구두(02)로 등록되고, 카드의 "Confirm Verbal Order"로 의사가 사후 확정한다.
 * - 검사 항목은 "Find a lab test"로 처방코어 검사항목을 검색해 추가한다(직접 입력도 가능).
 * - 목록: 환자를 고르면 처방코어의 receptionId 목록 조회로 이 접수의 처방을 불러온다(다른 사람이 낸 처방, 새로고침·교대 뒤에도 보인다).
 *   목록은 가벼워서(항목 없음) 검사/약제 전송 상태만 오고, 항목은 "Load details"(단건 조회)로 본다.
 */
export default function OrderPanel({ receptionNo, className = "" }: OrderPanelProps) {
  const dispatch = useDispatch<AppDispatch>();
  const orders = useSelector(selectOrdersByReception(receptionNo));
  const submitting = useSelector(selectOrderSubmitting);
  const submitError = useSelector(selectOrderSubmitError);
  const busyOrderId = useSelector(selectOrderBusyId);
  const actionError = useSelector(selectOrderActionError);
  const labItems = useSelector(selectLabItems);
  const labItemsLoading = useSelector(selectLabItemsLoading);
  const labItemsError = useSelector(selectLabItemsError);
  const listStatus = useSelector(selectOrderListStatus(receptionNo));
  const listError = useSelector(selectOrderListError);
  const commonCodeLoaded = useSelector(selectCommonCodeLoaded);
  const priorityCodes = useSelector(selectCommonCodesByGroup(CODE_GROUP.ORDER_PRIORITY));
  const timingCodes = useSelector(selectCommonCodesByGroup(CODE_GROUP.ORDER_TIMING));

  const [form, setForm] = useState(initialForm);
  const [items, setItems] = useState<ItemForm[]>([emptyItem()]);
  const [lookupId, setLookupId] = useState("");
  const [labQuery, setLabQuery] = useState("");
  const [labSearched, setLabSearched] = useState(false);
  const [verbalTarget, setVerbalTarget] = useState("");
  const [verbalDoctor, setVerbalDoctor] = useState("");
  const [cancelTarget, setCancelTarget] = useState("");
  const [cancelForm, setCancelForm] = useState(initialCancel);
  const [lastCount, setLastCount] = useState(0);
  const [lastReceptionNo, setLastReceptionNo] = useState(receptionNo);

  useEffect(() => {
    if (!commonCodeLoaded) dispatch(fetchAllCommonCodesRequest());
  }, [dispatch, commonCodeLoaded]);

  // 환자를 고르면 그 접수의 처방 목록을 불러온다.
  useEffect(() => {
    if (receptionNo) dispatch(fetchOrdersRequest(receptionNo));
  }, [dispatch, receptionNo]);

  // 환자를 바꾸면 입력 중이던 값과 이전 오류를 지운다.
  if (receptionNo !== lastReceptionNo) {
    setLastReceptionNo(receptionNo);
    setForm(initialForm);
    setItems([emptyItem()]);
    setLookupId("");
    setLabQuery("");
    setLabSearched(false);
    setVerbalTarget("");
    setVerbalDoctor("");
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

  function handleLabSearch() {
    dispatch(searchLabItemsRequest(labQuery.trim()));
    setLabSearched(true);
  }

  /** 검색 결과의 검사 항목을 처방 항목에 추가한다(맨 앞의 빈 검사 항목 칸이 있으면 그 자리에 채운다). */
  function handleAddLabItem(item: LabItem) {
    setItems((prev) => {
      if (prev.some((p) => p.prescriptionType === ORDER_ITEM_TYPE.LAB && p.itemCode === item.itemCode)) return prev;
      const filled: ItemForm = { ...emptyItem(), prescriptionType: ORDER_ITEM_TYPE.LAB, itemCode: item.itemCode, itemName: item.itemName };
      const emptyIndex = prev.findIndex(
        (p) => p.prescriptionType === ORDER_ITEM_TYPE.LAB && !p.itemCode.trim() && !p.itemName.trim(),
      );
      if (emptyIndex >= 0) return prev.map((p, i) => (i === emptyIndex ? filled : p));
      return [...prev, filled];
    });
  }

  function handleVerbalConfirm(order: Order) {
    if (!verbalDoctor.trim()) return;
    dispatch(confirmVerbalRequest(order.orderId, verbalDoctor.trim()));
    setVerbalTarget("");
    setVerbalDoctor("");
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

  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
      {/* 처방 (검사·약품) */}
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Orders (Lab Tests · Drugs)</h3>
        <Button
          variant="secondary"
          disabled={!receptionNo || listStatus === "loading"}
          onClick={() => dispatch(fetchOrdersRequest(receptionNo))}
        >
          {listStatus === "loading" ? "Loading..." : "Refresh List"}
        </Button>
      </div>
      <p className="mb-3 text-xs text-slate-400">
        {/* 처방 원장은 처방코어가 소유합니다. 영상 오더는 지원하지 않고, 수정은 취소 후 재등록입니다. */}
        Orders are kept in the order core. Imaging orders are not supported. To change an order, cancel it and register a new one.
      </p>

      {listStatus === "error" && listError ? (
        <Alert variant="error">{resolveEmergencyMessage(listError)}</Alert>
      ) : null}
      {actionError ? <Alert variant="error">{resolveEmergencyMessage(actionError)}</Alert> : null}

      {/* 처방 목록 */}
      {orders.length > 0 ? (
        <ul className="mb-4 space-y-2">
          {orders.map((order) => {
            const cancelled = isOrderCancelled(order);
            const busy = busyOrderId === order.orderId;
            const orderItems = order.items ?? [];
            const labState = labSendState(order);
            const pharmacyState = visiblePharmacyState(order);
            // 검사는 처방코어가 검사 항목이 없으면 labSendStatus 를 null 로 주므로 그걸로 판단하고,
            // 약품은 항목을 불러온 뒤에만 판단한다(약제 전송 상태는 약품이 없어도 PENDING 으로 와서 믿을 수 없다).
            // 이미 전송했으면(SENT) 버튼을 감춘다.
            const canSendLab = mayHaveLab(order) && labState !== "SENT";
            const canSendPharmacy = mayHaveDrug(order) && pharmacySendState(order) !== "SENT";
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
                  {order.orderMethodName ? (
                    <span className="text-xs text-slate-500">{order.orderMethodName}</span>
                  ) : null}
                  {order.verbalYn === "Y" ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        isVerbalConfirmed(order) ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {isVerbalConfirmed(order)
                        ? `Verbal · Confirmed${order.verbalConfirmedBy ? ` by ${order.verbalConfirmedBy}` : ""}`
                        : "Verbal · Awaiting confirmation"}
                    </span>
                  ) : null}
                  {sendLabel(labState) ? (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${sendStyle(labState)}`}>
                      Lab: {sendLabel(labState)}
                    </span>
                  ) : null}
                  {sendLabel(pharmacyState) ? (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${sendStyle(pharmacyState)}`}>
                      Pharmacy: {sendLabel(pharmacyState)}
                    </span>
                  ) : null}
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
                  {cancelled && order.cancelReason ? ` · Cancelled: ${order.cancelReason}` : ""}
                  {orderItems.length === 0 ? " · Items not loaded (use Load details)" : ""}
                </p>

                {!cancelled ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {canSendLab ? (
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onClick={() => dispatch(dispatchOrderRequest(order.orderId, "LAB", receptionNo))}
                      >
                        {labState === "FAILED" ? "Resend to Lab" : "Send to Lab"}
                      </Button>
                    ) : null}
                    {canSendPharmacy ? (
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onClick={() => dispatch(dispatchOrderRequest(order.orderId, "PHARMACY", receptionNo))}
                      >
                        {pharmacyState === "FAILED" ? "Resend to Pharmacy" : "Send to Pharmacy"}
                      </Button>
                    ) : null}
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() => dispatch(fetchOrderRequest(receptionNo, order.orderId))}
                    >
                      {/* 항목·결과 상세 보기 */}
                      Load details
                    </Button>
                    {order.verbalYn === "Y" && !isVerbalConfirmed(order) ? (
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onClick={() => setVerbalTarget(verbalTarget === order.orderId ? "" : order.orderId)}
                      >
                        Confirm Verbal Order
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      disabled={busy}
                      onClick={() => setCancelTarget(cancelTarget === order.orderId ? "" : order.orderId)}
                    >
                      Cancel Order
                    </Button>
                  </div>
                ) : null}

                {verbalTarget === order.orderId && !cancelled ? (
                  <div className="mt-2 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-3">
                    <FormField label="Confirmed By (Doctor ID)" required className="w-[220px]">
                      <Input value={verbalDoctor} onChange={(e) => setVerbalDoctor(e.target.value)} maxLength={36} />
                    </FormField>
                    <Button disabled={busy || !verbalDoctor.trim()} onClick={() => handleVerbalConfirm(order)}>
                      Confirm
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
        // 이 접수에 등록된 처방이 없습니다.
        <p className="mb-4 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-400">
          {!receptionNo
            ? "Select a patient first."
            : listStatus === "loading"
              ? "Loading orders..."
              : "No orders for this patient yet."}
        </p>
      )}

      {/* 처방ID로 불러오기 (다른 접수에서 만든 처방 등 목록에 없는 처방을 직접 확인할 때) */}
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

      {/* 검사항목 검색 — 결과를 누르면 처방 항목으로 추가된다(코드·이름을 직접 입력해도 된다) */}
      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap items-end gap-3">
          <FormField label="Find a lab test" hint="Search by name or code. Leave empty to list all." className="w-[320px]">
            <Input
              value={labQuery}
              onChange={(e) => setLabQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLabSearch();
              }}
              placeholder="e.g. CBC"
              disabled={submitting}
            />
          </FormField>
          <Button variant="secondary" onClick={handleLabSearch} disabled={submitting || labItemsLoading}>
            {labItemsLoading ? "Searching..." : "Search"}
          </Button>
        </div>
        {labItemsError ? <Alert variant="error">{resolveEmergencyMessage(labItemsError)}</Alert> : null}
        {labSearched && !labItemsLoading && !labItemsError ? (
          labItems.length === 0 ? (
            <p className="mt-2 text-xs text-slate-400">No lab tests found.</p>
          ) : (
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
              {labItems.map((item) => (
                <li key={item.itemCode} className="flex items-center justify-between gap-2 rounded-md bg-white px-3 py-1.5 text-sm">
                  <span className="text-slate-800">
                    {item.itemName} <span className="text-xs text-slate-400">({item.itemCode})</span>
                    <span className="text-xs text-slate-500">
                      {item.testClassification ? ` · ${item.testClassification}` : ""}
                      {item.specimenTypes && item.specimenTypes.length > 0 ? ` · ${item.specimenTypes.join("/")}` : ""}
                    </span>
                  </span>
                  <Button variant="secondary" onClick={() => handleAddLabItem(item)} disabled={submitting}>
                    Add
                  </Button>
                </li>
              ))}
            </ul>
          )
        ) : null}
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
          {/* 구두처방 — 등록 뒤 의사가 사후 확정해야 합니다 */}
          Verbal order <span className="text-xs text-slate-400">(the physician confirms it afterwards)</span>
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

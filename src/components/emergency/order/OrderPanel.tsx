"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import ActorField from "@/components/emergency/common/ActorField";
import DischargedNotice from "@/components/emergency/common/DischargedNotice";
import StaffName from "@/components/emergency/common/StaffName";
import { useActorId } from "@/features/emergency/common/staff";
import { selectIsDischarged } from "@/features/emergency/disposition/slice";
import { Alert, Button, FormField, Input } from "@/components/common";
import DownSelect from "@/components/emergency/common/DownSelect";
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
  clearMedicationSearch,
  searchMedicationsRequest,
  selectMedications,
  selectMedicationsError,
  selectMedicationsLoading,
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
  PHARMACY_DISPATCH_ENABLED,
  ORDER_PRIORITY_FALLBACK_OPTIONS,
  ORDER_TIMING_FALLBACK_OPTIONS,
  type MedicationItem,
  type Order,
  type OrderItem,
} from "@/features/emergency/order/types";
import {
  abnormalFlagLabel,
  awaitingLabResult,
  dosageFormFromName,
  isOrderCancelled,
  labItemHasResult,
  labItemReceived,
  labRejectedItems,
  labResultExpected,
  LAB_NO_RESULT_ITEM_CODES,
  LAB_TEST_FALLBACK_OPTIONS,
  labSendState,
  mayHaveDrug,
  mayHaveLab,
  pharmacySendState,
  visiblePharmacyState,
} from "@/features/emergency/order/utils";
import { COMMON_ER_DRUGS, DOSAGE_FORM_FALLBACK_OPTIONS, type CommonDrug } from "@/features/emergency/order/commonDrugs";
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

/** 검사 결과를 기다리는 동안 자동으로 다시 불러오는 간격과 최대 횟수(30초 × 20회 = 10분) */
const RESULT_POLL_INTERVAL_MS = 30000;
const RESULT_POLL_MAX = 20;

/** 약품 검색: 이 글자 수부터 검색하고, 입력을 멈춘 뒤 이 시간(ms)이 지나면 부른다 */
const DRUG_SEARCH_MIN_LENGTH = 2;
const DRUG_SEARCH_DELAY_MS = 400;

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
  const discharged = useSelector(selectIsDischarged(receptionNo));
  const orders = useSelector(selectOrdersByReception(receptionNo));
  const submitting = useSelector(selectOrderSubmitting);
  const submitError = useSelector(selectOrderSubmitError);
  const busyOrderId = useSelector(selectOrderBusyId);
  const actionError = useSelector(selectOrderActionError);
  const listStatus = useSelector(selectOrderListStatus(receptionNo));
  const listError = useSelector(selectOrderListError);
  const commonCodeLoaded = useSelector(selectCommonCodeLoaded);
  const priorityCodes = useSelector(selectCommonCodesByGroup(CODE_GROUP.ORDER_PRIORITY));
  const dosageFormCodes = useSelector(selectCommonCodesByGroup(CODE_GROUP.DOSAGE_FORM));
  const timingCodes = useSelector(selectCommonCodesByGroup(CODE_GROUP.ORDER_TIMING));
  const labTestCodes = useSelector(selectCommonCodesByGroup(CODE_GROUP.LAB_TEST));
  const medications = useSelector(selectMedications);
  const medicationsLoading = useSelector(selectMedicationsLoading);
  const medicationsError = useSelector(selectMedicationsError);

  const [form, setForm] = useState(initialForm);
  const [items, setItems] = useState<ItemForm[]>([emptyItem()]);
  const [labQuery, setLabQuery] = useState("");
  const [drugQuery, setDrugQuery] = useState("");
  // 검색어가 충분히 길고 검색이 실패하지 않았으면 검색 결과를, 아니면 자주 쓰는 약 목록을 보여준다
  const showSearchResults = drugQuery.trim().length >= DRUG_SEARCH_MIN_LENGTH && !medicationsError;
  const [verbalTarget, setVerbalTarget] = useState("");
  const [verbalDoctor, setVerbalDoctor] = useState("");
  const [cancelTarget, setCancelTarget] = useState("");
  const [cancelForm, setCancelForm] = useState(initialCancel);
  const [lastCount, setLastCount] = useState(0);
  const [lastReceptionNo, setLastReceptionNo] = useState(receptionNo);
  // 처방의·구두 확정자는 의사 — 직접 안 고르면 로그인한 사람이 의사일 때 그 사람이다. 취소자는 기본이 로그인한 사람이다.
  const prescribedBy = useActorId(form.prescribedBy, "DOCTOR");
  const confirmedBy = useActorId(verbalDoctor, "DOCTOR");
  const cancelledBy = useActorId(cancelForm.userId, "STAFF");

  useEffect(() => {
    if (!commonCodeLoaded) dispatch(fetchAllCommonCodesRequest());
  }, [dispatch, commonCodeLoaded]);

  // 환자를 고르면 그 접수의 처방 목록을 불러온다.
  useEffect(() => {
    if (receptionNo) dispatch(fetchOrdersRequest(receptionNo));
  }, [dispatch, receptionNo]);

  // LAB 이 받았지만 결과가 아직 안 온 검사가 있으면 30초마다 목록(항목·결과 포함)을 다시 불러온다. 결과가 오면 멈춘다.
  // 처방코어가 일부 결과(미생물·병리)를 반영하지 않아 결과가 끝내 안 올 수 있으므로 10분(20회)까지만 자동으로 다시 불러온다.
  // 그 뒤에는 Refresh List / Refresh 로 직접 확인한다.
  const awaitingResult = orders.some(awaitingLabResult);
  useEffect(() => {
    if (!receptionNo || !awaitingResult) return;
    let polls = 0;
    const timer = setInterval(() => {
      if (++polls > RESULT_POLL_MAX) {
        clearInterval(timer);
        return;
      }
      dispatch(fetchOrdersRequest(receptionNo));
    }, RESULT_POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [dispatch, receptionNo, awaitingResult]);

  // 약품 검색 — 글자를 멈추고 0.4초 뒤에 검색한다. 2글자 미만이면 결과를 비운다(처방코어는 이름 없이는 오류를 낸다).
  useEffect(() => {
    const query = drugQuery.trim();
    if (query.length < DRUG_SEARCH_MIN_LENGTH) {
      dispatch(clearMedicationSearch());
      return;
    }
    const timer = setTimeout(() => dispatch(searchMedicationsRequest(query)), DRUG_SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [dispatch, drugQuery]);

  // 환자를 바꾸면 입력 중이던 값과 이전 오류를 지운다.
  if (receptionNo !== lastReceptionNo) {
    setLastReceptionNo(receptionNo);
    setForm(initialForm);
    setItems([emptyItem()]);
    setLabQuery("");
    setDrugQuery("");
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
  const dosageFormOptions = toCodeOptions(dosageFormCodes, DOSAGE_FORM_FALLBACK_OPTIONS);

  // 검사 종류는 admin 공통코드 TEST_TYPE_CD(01~08) — 외래·병동·LAB 이 같은 값을 검사 항목 코드로 쓴다. 처방코어의 검사항목 검색을 부르지 않는다.
  const labTestOptions = toCodeOptions(labTestCodes, LAB_TEST_FALLBACK_OPTIONS);
  // 입력한 글자가 검사 이름에 들어 있는 검사만 보여준다(대소문자 구분 없음). 코드 번호로는 찾지 않는다 — 직원은 코드를 외우지 않는다
  const labFilter = labQuery.trim().toLowerCase();
  const shownLabTests = labFilter
    ? labTestOptions.filter((test) => test.label.toLowerCase().includes(labFilter))
    : labTestOptions;

  const itemsValid = items.every((item) => !!item.itemCode.trim() && !!item.itemName.trim());
  // 퇴실 처리가 끝난 환자에게는 새 처방을 등록하지 않는다(기존 처방의 취소·전송·구두 확정은 가능)
  const canSubmit =
    !!receptionNo &&
    !discharged &&
    !submitting &&
    !!prescribedBy &&
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

  function setItemField(index: number, name: keyof ItemForm, value: string) {
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
        prescribedBy,
        priorityCode: form.priorityCode,
        timingCode: form.timingCode,
        verbalYn: form.verbal ? "Y" : "N",
        dispatchNow: form.dispatchNow,
        items: items.map(toRequestItem),
      }),
    );
  }

  /** 자주 쓰는 약을 처방 항목에 추가한다(맨 앞의 빈 항목 칸이 있으면 그 자리에 채운다). 같은 약이 이미 있으면 다시 넣지 않는다. */
  function handleAddCommonDrug(drug: CommonDrug) {
    setItems((prev) => {
      if (prev.some((p) => p.prescriptionType === ORDER_ITEM_TYPE.DRUG && p.itemCode === drug.itemCode)) return prev;
      const filled: ItemForm = {
        prescriptionType: ORDER_ITEM_TYPE.DRUG,
        itemCode: drug.itemCode,
        itemName: drug.itemName,
        dosage: drug.dosage,
        dosageFormCd: drug.dosageFormCd,
        frequency: drug.frequency,
        durationDays: drug.durationDays,
      };
      const emptyIndex = prev.findIndex((p) => !p.itemCode.trim() && !p.itemName.trim());
      if (emptyIndex >= 0) return prev.map((p, i) => (i === emptyIndex ? filled : p));
      return [...prev, filled];
    });
  }

  /** 약품 검색 결과를 처방 항목에 추가한다. 용량·횟수·일수는 비워 두고 의료진이 채운다. 제형은 약품 마스터의 제형 이름에서 맞춘다. */
  function handleAddSearchedDrug(med: MedicationItem) {
    handleAddCommonDrug({
      itemCode: med.itemCode,
      itemName: med.itemName,
      purpose: "",
      dosage: "",
      dosageFormCd: dosageFormFromName(med.formName),
      frequency: "",
      durationDays: "",
    });
  }

  /** 고른 검사를 처방 항목에 추가한다(맨 앞의 빈 검사 항목 칸이 있으면 그 자리에 채운다). */
  function handleAddLabItem(item: { itemCode: string; itemName: string }) {
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
    if (!confirmedBy) return;
    dispatch(confirmVerbalRequest(order.orderId, confirmedBy));
    setVerbalTarget("");
    setVerbalDoctor("");
  }

  function handleCancel(order: Order) {
    if (!cancelForm.cancelReason.trim() || !cancelledBy) return;
    dispatch(
      cancelOrderRequest(order.orderId, {
        cancelReason: cancelForm.cancelReason.trim(),
        userId: cancelledBy,
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
            const rejectedByLab = labRejectedItems(order).length > 0;
            const canSendPharmacy = PHARMACY_DISPATCH_ENABLED && mayHaveDrug(order) && pharmacySendState(order) !== "SENT";
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
                      {isVerbalConfirmed(order) ? (
                        <>
                          Verbal · Confirmed
                          {order.verbalConfirmedBy ? (
                            <>
                              {" "}
                              by <StaffName empId={order.verbalConfirmedBy} />
                            </>
                          ) : null}
                        </>
                      ) : (
                        "Verbal · Awaiting confirmation"
                      )}
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
                            {item.dosageFormCd ? ` ${optionLabel(dosageFormOptions, item.dosageFormCd)}` : ""}
                            {item.frequency ? ` ${item.frequency}` : ""}
                            {item.durationDays ? ` · ${item.durationDays}d` : ""}
                          </span>
                        ) : null}
                        {item.sendStatus ? (
                          <span className="text-xs text-slate-400">
                            {" "}
                            · Status: {labItemReceived(item) ? "SENT" : item.sendStatus}
                          </span>
                        ) : null}
                        {item.rejectReason && !labItemReceived(item) ? (
                          // LAB 이 거절한 이유(예: 유효하지 않은 환자ID) — 다시 보내기 전에 원인을 먼저 고쳐야 한다
                          <span className="block pl-6 text-xs text-rose-600">Rejected by Lab: {item.rejectReason}</span>
                        ) : null}
                        {labItemHasResult(item) ? (
                          // 검사 결과 — 처방코어가 LAB 결과를 받아 둔 값을 열 때마다 읽어 온다(응급 DB에 저장하지 않는다)
                          <div className="mt-1 ml-6 rounded-md border border-slate-200 bg-white p-2 text-xs">
                            <p className="mb-1 font-medium text-slate-600">
                              Lab Results
                              {item.resultReportedAt ? ` · Reported ${formatDateTime(item.resultReportedAt)}` : ""}
                            </p>
                            <table className="w-full text-left">
                              <thead className="text-slate-400">
                                <tr>
                                  <th className="pr-3 font-normal">Test</th>
                                  <th className="pr-3 font-normal">Value</th>
                                  <th className="pr-3 font-normal">Reference</th>
                                  <th className="font-normal">Flag</th>
                                </tr>
                              </thead>
                              <tbody className="text-slate-700">
                                {(item.resultDetails ?? []).map((detail, detailIndex) => {
                                  const flag = abnormalFlagLabel(detail.abnormalFlag);
                                  return (
                                    <tr key={`${detail.detailCode ?? ""}-${detailIndex}`}>
                                      <td className="pr-3">{detail.detailName ?? item.itemName}</td>
                                      <td className="pr-3">
                                        {detail.resultValue ?? "-"}
                                        {detail.resultUnit ? ` ${detail.resultUnit}` : ""}
                                      </td>
                                      <td className="pr-3">{detail.referenceRange ?? "-"}</td>
                                      <td>
                                        <span
                                          className={`rounded-full px-2 py-0.5 ${
                                            flag.tone === "low"
                                              ? "bg-sky-50 text-sky-700"
                                              : flag.tone === "high"
                                                ? "bg-rose-50 text-rose-700"
                                                : flag.tone === "normal"
                                                  ? "bg-emerald-50 text-emerald-700"
                                                  : "bg-amber-50 text-amber-700"
                                          }`}
                                        >
                                          {flag.text}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : labItemReceived(item) && item.prescriptionType === ORDER_ITEM_TYPE.LAB ? (
                          <span className="block pl-6 text-xs text-slate-400">
                            {labResultExpected(item)
                              ? "Waiting for the lab result... (use Refresh to check again)"
                              : "Results of this test are not shown in the ER (culture / pathology)."}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <p className="mt-1 text-xs text-slate-400">
                  <StaffName empId={order.prescribedBy} />
                  {order.prescribedAt ? ` · ${formatDateTime(order.prescribedAt)}` : ""}
                  {cancelled && order.cancelReason ? ` · Cancelled: ${order.cancelReason}` : ""}
                  {orderItems.length === 0 ? " · Items not loaded (use Refresh)" : ""}
                  {rejectedByLab ? " · Fix the reason above before sending again" : ""}
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
                      {/* 이 처방을 처방코어에서 다시 불러온다(항목·전송 상태) */}
                      Refresh
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
                  <div className="mt-2 grid grid-cols-1 items-end gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <ActorField
                      label="Confirmed By (Doctor)"
                      role="DOCTOR"
                      required
                      value={verbalDoctor}
                      onChange={setVerbalDoctor}
                    />
                    <Button disabled={busy || !confirmedBy} onClick={() => handleVerbalConfirm(order)}>
                      Confirm
                    </Button>
                  </div>
                ) : null}

                {cancelTarget === order.orderId && !cancelled ? (
                  <div className="mt-2 grid grid-cols-1 items-end gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                    <FormField label="Cancel Reason" required>
                      <Input
                        value={cancelForm.cancelReason}
                        onChange={(e) => setCancelForm((prev) => ({ ...prev, cancelReason: e.target.value }))}
                        maxLength={200}
                      />
                    </FormField>
                    <ActorField
                      label="Cancelled By"
                      role="STAFF"
                      required
                      value={cancelForm.userId}
                      onChange={(empId) => setCancelForm((prev) => ({ ...prev, userId: empId }))}
                    />
                    <Button
                      variant="danger"
                      disabled={busy || !cancelForm.cancelReason.trim() || !cancelledBy}
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

      <h4 className="mb-2 text-sm font-semibold text-slate-700">New Order</h4>
      <DischargedNotice receptionNo={receptionNo} />
      {submitError ? <Alert variant="error">{resolveEmergencyMessage(submitError)}</Alert> : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* 처방의(의사) — 구두처방은 간호사가 로그인해 의사 대신 입력하는 경우가 많아 의사를 직접 고른다 */}
        <ActorField
          label="Prescribed By"
          role="DOCTOR"
          required
          value={form.prescribedBy}
          onChange={(empId) => setForm((prev) => ({ ...prev, prescribedBy: empId }))}
          disabled={submitting}
        />
        {/* 우선순위 */}
        <DownSelect
          label="Priority"
          required
          value={form.priorityCode}
          onChange={(priorityCode) => setForm((prev) => ({ ...prev, priorityCode }))}
          options={priorityOptions}
          disabled={submitting}
        />
        {/* 시점 */}
        <DownSelect
          label="Timing"
          required
          value={form.timingCode}
          onChange={(timingCode) => setForm((prev) => ({ ...prev, timingCode }))}
          options={timingOptions}
          disabled={submitting}
        />
      </div>

      {/* 검사 — admin 공통코드 TEST_TYPE_CD 에서 고른다(코드·이름을 아래 항목 칸에 직접 입력해도 된다) */}
      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm font-semibold text-slate-700">Lab tests</p>
        <p className="text-xs text-slate-400">
          Choose the tests to order. Results of tests marked &quot;No result in ER&quot; are not shown here.
        </p>
        <Input
          className="mt-2"
          value={labQuery}
          onChange={(e) => setLabQuery(e.target.value)}
          placeholder="Filter by test name (e.g. CBC)"
          disabled={submitting}
        />
        {/* 한 번에 4줄만 보이고 나머지는 스크롤 (한 줄 48px × 4 + 줄 간격) */}
        <ul className="mt-2 max-h-[208px] space-y-1 overflow-y-auto">
          {shownLabTests.length === 0 ? (
            <li className="px-1 py-1 text-xs text-slate-400">No lab tests match.</li>
          ) : null}
          {shownLabTests.map((test) => {
            const added = items.some((p) => p.prescriptionType === ORDER_ITEM_TYPE.LAB && p.itemCode === test.value);
            return (
              <li key={test.value} className="flex items-center justify-between gap-2 rounded-md bg-white px-3 py-1.5 text-sm">
                <span className="min-w-0 truncate text-slate-800">
                  {test.label} <span className="text-xs text-slate-400">({test.value})</span>
                  {LAB_NO_RESULT_ITEM_CODES.includes(test.value) ? (
                    <span className="text-xs text-amber-600"> · No result in ER</span>
                  ) : null}
                </span>
                <Button
                  variant="secondary"
                  onClick={() => handleAddLabItem({ itemCode: test.value, itemName: test.label })}
                  disabled={submitting || added}
                >
                  {added ? "Added" : "Add"}
                </Button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 약품 — 이름으로 검색한다(처방코어 약품 마스터, 코드는 마스터의 ediCode). 검색칸이 비어 있거나 검색을 쓸 수 없으면 자주 쓰는 약 목록을 보여준다 */}
      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm font-semibold text-slate-700">Drugs</p>
        <p className="text-xs text-slate-400">
          Search by drug name ({DRUG_SEARCH_MIN_LENGTH}+ characters). Check the dosage, frequency and days before registering.
        </p>
        <Input
          className="mt-2"
          value={drugQuery}
          onChange={(e) => setDrugQuery(e.target.value)}
          placeholder="e.g. 타이레놀, 케토"
          disabled={submitting}
        />
        {showSearchResults ? (
          medicationsLoading ? (
            <p className="mt-2 text-xs text-slate-400">Searching...</p>
          ) : medications.length === 0 ? (
            <p className="mt-2 text-xs text-slate-400">No drugs match.</p>
          ) : (
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
              {medications.map((med) => {
                const added = items.some((p) => p.prescriptionType === ORDER_ITEM_TYPE.DRUG && p.itemCode === med.itemCode);
                return (
                  <li key={med.itemCode} className="flex items-center justify-between gap-2 rounded-md bg-white px-3 py-1.5 text-sm">
                    <span className="min-w-0 truncate text-slate-800">
                      {med.itemName} <span className="text-xs text-slate-400">({med.itemCode})</span>
                      <span className="text-xs text-slate-500">
                        {med.formName ? ` · ${med.formName}` : ""}
                        {med.manufacturer ? ` · ${med.manufacturer}` : ""}
                      </span>
                    </span>
                    <Button variant="secondary" onClick={() => handleAddSearchedDrug(med)} disabled={submitting || added}>
                      {added ? "Added" : "Add"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )
        ) : (
          <>
            {medicationsError ? (
              // 약품 검색을 쓸 수 없습니다. 아래 자주 쓰는 약을 쓰거나 코드를 직접 입력하세요.
              <p className="mt-2 text-xs text-rose-600">
                Drug search is unavailable right now. Choose from the common drugs below, or enter the code manually.
              </p>
            ) : null}
            <p className="mt-2 text-xs font-medium text-slate-500">Common ER drugs</p>
            <ul className="mt-1 space-y-1">
              {COMMON_ER_DRUGS.map((drug) => {
                const added = items.some((p) => p.prescriptionType === ORDER_ITEM_TYPE.DRUG && p.itemCode === drug.itemCode);
                return (
                  <li key={drug.itemCode} className="flex items-center justify-between gap-2 rounded-md bg-white px-3 py-1.5 text-sm">
                    <span className="text-slate-800">
                      {drug.itemName} <span className="text-xs text-slate-400">({drug.itemCode})</span>
                      <span className="text-xs text-slate-500">
                        {" · "}
                        {optionLabel(dosageFormOptions, drug.dosageFormCd)} · {drug.purpose}
                      </span>
                    </span>
                    <Button variant="secondary" onClick={() => handleAddCommonDrug(drug)} disabled={submitting || added}>
                      {added ? "Added" : "Add"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      <div className="mt-3 space-y-3">
        {items.map((item, index) => {
          const isDrug = item.prescriptionType === ORDER_ITEM_TYPE.DRUG;
          return (
            <div key={index} className="rounded-lg border border-slate-200 p-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_auto]">
                <DownSelect
                  label="Type"
                  required
                  value={item.prescriptionType}
                  onChange={(prescriptionType) => setItemField(index, "prescriptionType", prescriptionType)}
                  options={[...ORDER_ITEM_TYPE_OPTIONS]}
                  disabled={submitting}
                />
                <FormField label="Item Code" required>
                  <Input name="itemCode" value={item.itemCode} onChange={(e) => handleItemChange(index, e)} disabled={submitting} maxLength={50} />
                </FormField>
                <FormField label="Item Name" required>
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
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <FormField label="Dosage">
                    <Input name="dosage" value={item.dosage} onChange={(e) => handleItemChange(index, e)} disabled={submitting} inputMode="decimal" />
                  </FormField>
                  <DownSelect
                    label="Form"
                    value={item.dosageFormCd}
                    onChange={(dosageFormCd) => setItemField(index, "dosageFormCd", dosageFormCd)}
                    options={dosageFormOptions}
                    placeholder="Select"
                    disabled={submitting}
                  />
                  <FormField label="Frequency">
                    <Input name="frequency" value={item.frequency} onChange={(e) => handleItemChange(index, e)} disabled={submitting} placeholder="TID" maxLength={20} />
                  </FormField>
                  <FormField label="Days">
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
          {/* 등록 직후 검사(·약제)로 전송 — 약제 서비스가 빠져 있는 동안은 검사만 */}
          {PHARMACY_DISPATCH_ENABLED ? "Send to Lab / Pharmacy right away" : "Send to Lab right away"}
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

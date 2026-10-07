"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, FormField, Input } from "@/components/common";
import DownSelect from "@/components/emergency/common/DownSelect";
import ActorField from "@/components/emergency/common/ActorField";
import StaffName from "@/components/emergency/common/StaffName";
import { useActorId } from "@/features/emergency/common/staff";
import { resolveEmergencyMessage } from "@/features/emergency/messages";
import { CODE_GROUP, optionLabel, toCodeOptions } from "@/features/emergency/codes";
import {
  createMedicationRequest,
  fetchMedicationsRequest,
  selectMedicationError,
  selectMedicationItems,
  selectMedicationLoading,
  selectMedicationSubmitError,
  selectMedicationSubmitting,
} from "@/features/emergency/care/medication/slice";
import { ADMIN_ROUTE_FALLBACK_OPTIONS } from "@/features/emergency/care/medication/types";
import {
  fetchAllCommonCodesRequest,
  selectCommonCodeLoaded,
  selectCommonCodesByGroup,
} from "@/features/emergency/commonCode/slice";
import OrderSelect from "@/components/emergency/order/OrderSelect";
import {
  fetchOrderRequest,
  searchMedicationsRequest,
  selectMedications,
  selectMedicationsLoading,
  selectOrdersByReception,
} from "@/features/emergency/order/slice";
import { ORDER_ITEM_TYPE } from "@/features/emergency/order/types";
import { drugNameOf, hasLoadedItems, orderTitle } from "@/features/emergency/order/utils";
import { eventTimeBounds, eventTimeError, useEventTimeLimits } from "@/features/emergency/common/eventTime";
import { formatDateTime } from "@/features/emergency/utils";

const MANUAL_DRUG = "__manual__";

type MedicationPanelProps = { receptionNo: string; className?: string };

const initialForm = {
  orderId: "",
  orderItemId: "",
  drugCode: "",
  dose: "",
  routeCode: "",
  administeredAt: "",
  administeredById: "",
};

/**
 * 약물 투여 기록(MAR) 패널 (UC-CARE-04, Jira UD2-19)
 * - 처방 원장은 처방코어 — 응급은 투여 사실만 기록하고 처방 ID(orderId)를 필수로 참조한다.
 *   처방 ID 는 이 환자의 처방 목록(Order 탭)에서 고른다(직접 입력도 가능).
 * - 투여경로는 admin 기존 그룹 ADMIN_ROUTE_CD(없으면 폴백).
 */
export default function MedicationPanel({ receptionNo, className = "" }: MedicationPanelProps) {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector(selectMedicationItems);
  const loading = useSelector(selectMedicationLoading);
  const error = useSelector(selectMedicationError);
  const submitting = useSelector(selectMedicationSubmitting);
  const submitError = useSelector(selectMedicationSubmitError);
  const commonCodeLoaded = useSelector(selectCommonCodeLoaded);
  const routeCodes = useSelector(selectCommonCodesByGroup(CODE_GROUP.ADMIN_ROUTE));

  const orders = useSelector(selectOrdersByReception(receptionNo));
  // 약제 약품 마스터 목록 — 처방에 없는 약을 투여할 때 이름으로 고른다
  const medications = useSelector(selectMedications);
  const medicationsLoading = useSelector(selectMedicationsLoading);

  const [form, setForm] = useState(initialForm);
  const [lastCount, setLastCount] = useState(0);
  const [manualDrug, setManualDrug] = useState(false);
  // 투여자는 기본이 로그인한 사람이고, 실제로 투여한 사람이 다르면 고른다
  const administeredById = useActorId(form.administeredById, "STAFF");

  useEffect(() => {
    if (receptionNo) dispatch(fetchMedicationsRequest(receptionNo));
  }, [dispatch, receptionNo]);

  useEffect(() => {
    if (!commonCodeLoaded) dispatch(fetchAllCommonCodesRequest());
  }, [dispatch, commonCodeLoaded]);

  const selectedOrder = orders.find((o) => o.orderId === form.orderId);

  // 처방을 고르면 그 처방 상세(항목 포함)를 불러온다 — 목록 조회는 가벼워서 items 가 비어있다.
  useEffect(() => {
    if (form.orderId && selectedOrder && !hasLoadedItems(selectedOrder)) {
      dispatch(fetchOrderRequest(receptionNo, form.orderId));
    }
  }, [dispatch, receptionNo, form.orderId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (items.length > lastCount) {
    setLastCount(items.length);
    if (!submitting && !submitError) setForm(initialForm);
  } else if (items.length < lastCount) {
    setLastCount(items.length);
  }

  const drugItems = (selectedOrder?.items ?? []).filter((item) => item.prescriptionType === ORDER_ITEM_TYPE.DRUG);
  // 약은 이름으로만 고른다(직원은 약품 코드를 알 수 없다). 코드는 고른 약에서 자동으로 채워진다
  const drugOptions = [
    ...drugItems.map((item) => ({ value: item.itemCode, label: item.itemName })),
    { value: MANUAL_DRUG, label: "Another drug..." },
  ];
  // 처방에 약품 항목이 없거나 "Another drug..."를 고르면 약제 약품 목록에서 이름으로 고른다.
  // 처방을 고르기 전에는 비활성 드롭다운("Select an order first")을 보여준다.
  const drugManualMode = manualDrug || (!!form.orderId && drugItems.length === 0);
  const masterDrugOptions = medications.map((med) => ({ value: med.itemCode, label: med.itemName }));

  // 약제 약품 목록이 필요할 때(처방 밖의 약을 고를 때)만 불러온다
  useEffect(() => {
    if (drugManualMode && medications.length === 0 && !medicationsLoading) {
      dispatch(searchMedicationsRequest(""));
    }
  }, [dispatch, drugManualMode, medications.length, medicationsLoading]);

  function handleOrderChange(orderId: string) {
    setForm((prev) => ({ ...prev, orderId, drugCode: "", orderItemId: "" }));
    setManualDrug(false);
  }

  /** 약제 약품 목록에서 고른 약 — 처방 항목이 아니므로 항목 ID 는 비운다 */
  function handleMasterDrugSelect(value: string) {
    setForm((prev) => ({ ...prev, drugCode: value, orderItemId: "" }));
  }

  function handleDrugSelect(value: string) {
    if (value === MANUAL_DRUG) {
      setManualDrug(true);
      setForm((prev) => ({ ...prev, drugCode: "", orderItemId: "" }));
      return;
    }
    setManualDrug(false);
    const picked = drugItems.find((item) => item.itemCode === value);
    setForm((prev) => ({
      ...prev,
      drugCode: picked?.itemCode ?? "",
      orderItemId: picked?.itemId ?? "",
    }));
  }

  const routeOptions = toCodeOptions(routeCodes, ADMIN_ROUTE_FALLBACK_OPTIONS);
  // 투여 시각은 접수 이후·현재 이전이어야 하고, 귀가·사망·자의퇴원이면 퇴실 결정 이전이어야 한다
  const timeLimits = useEventTimeLimits(receptionNo);
  const timeBounds = eventTimeBounds(timeLimits);
  const timeError = eventTimeError(form.administeredAt, timeLimits);
  const canSubmit =
    !timeError &&
    !!receptionNo &&
    !submitting &&
    !!form.orderId.trim() &&
    !!form.drugCode.trim() &&
    !!form.dose.trim() &&
    !!form.routeCode &&
    !!form.administeredAt &&
    !!administeredById;

  // 버튼이 눌리지 않을 때 무엇이 빠졌는지 알려 준다
  const missing = [
    !receptionNo && "a patient",
    !form.orderId.trim() && "an order (register one in the Order tab first)",
    !form.drugCode.trim() && "a drug",
    !form.dose.trim() && "the dose",
    !form.routeCode && "the route",
    !form.administeredAt && "the administered time",
    timeError && "an administered time within the stay",
    !administeredById && "who administered it",
  ].filter(Boolean);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit() {
    if (!canSubmit) return;
    dispatch(
      createMedicationRequest({
        encounterId: receptionNo,
        orderId: form.orderId.trim(),
        orderItemId: form.orderItemId.trim() || undefined,
        drugCode: form.drugCode.trim(),
        dose: form.dose.trim(),
        routeCode: form.routeCode,
        administeredById,
        // datetime-local 값(초 없음)을 ISO 로컬 일시로 맞춘다.
        administeredAt: `${form.administeredAt}:00`,
      }),
    );
  }

  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
      {/* 약물 투여 기록 */}
      <h3 className="mb-3 text-sm font-semibold text-slate-800">Medication Administration</h3>

      {loading ? (
        // 투여 기록을 불러오는 중입니다...
        <p className="py-4 text-center text-sm text-slate-400">Loading medication records...</p>
      ) : error ? (
        <Alert variant="error">{resolveEmergencyMessage(error)}</Alert>
      ) : (
        <>
          {items.length > 0 ? (
            <ul className="mb-4 space-y-2">
              {items.map((item) => (
                <li key={item.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="text-xs font-medium text-sky-600">
                    {drugNameOf(orders, item.orderId, item.drugCode, medications)} · {item.dose} · {optionLabel(routeOptions, item.routeCode)}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatDateTime(item.administeredAt)} · <StaffName empId={item.administeredById} />
                    {orderTitle(orders, item.orderId) ? ` · ${orderTitle(orders, item.orderId)}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            // 기록된 투여가 없습니다.
            <p className="mb-4 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-400">No medication records yet.</p>
          )}

          {submitError ? <Alert variant="error">{resolveEmergencyMessage(submitError)}</Alert> : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* 처방 선택 — 이 환자의 처방(Order 탭)에서 고른다. 처방 ID 는 처방코어 prescriptionId (처방 항목 ID 는 약품을 고르면 자동으로 채워진다) */}
            <OrderSelect
              receptionNo={receptionNo}
              value={form.orderId}
              onChange={handleOrderChange}
              itemType={ORDER_ITEM_TYPE.DRUG}
              disabled={submitting}
              className="sm:col-span-3"
            />
            {/* 약 — 고른 처방에 약품 항목이 있으면 거기서 이름으로 고르고, 없으면(또는 Another drug) 약제 약품 목록에서 이름으로 고른다 */}
            {drugManualMode ? (
              <DownSelect
                label="Drug"
                required
                value={form.drugCode}
                onChange={handleMasterDrugSelect}
                options={masterDrugOptions}
                placeholder={medicationsLoading ? "Loading drugs..." : "Select"}
                disabled={submitting || medicationsLoading}
              />
            ) : (
              <DownSelect
                label="Drug"
                required
                value={form.drugCode}
                onChange={handleDrugSelect}
                options={drugOptions}
                placeholder={form.orderId ? "Select" : "Select an order first"}
                disabled={submitting || !form.orderId}
              />
            )}
            {/* 용량 */}
            <FormField label="Dose" required>
              <Input name="dose" value={form.dose} onChange={handleChange} disabled={submitting} maxLength={50} />
            </FormField>
            {/* 투여경로 */}
            <DownSelect
              label="Route"
              required
              value={form.routeCode}
              onChange={(routeCode) => setForm((prev) => ({ ...prev, routeCode }))}
              options={routeOptions}
              placeholder="Select"
              disabled={submitting}
            />
            {/* 투여 일시 */}
            <FormField label="Administered At" required hint={timeError || undefined}>
              <Input
                type="datetime-local"
                name="administeredAt"
                value={form.administeredAt}
                min={timeBounds.min}
                max={timeBounds.max}
                onChange={handleChange}
                disabled={submitting}
                className={timeError ? "border-rose-400 focus:border-rose-400 focus:ring-rose-100" : ""}
              />
            </FormField>
            {/* 투여자 */}
            <ActorField
              label="Administered By"
              role="STAFF"
              required
              value={form.administeredById}
              onChange={(empId) => setForm((prev) => ({ ...prev, administeredById: empId }))}
              disabled={submitting}
            />
          </div>
          <div className="mt-3 flex items-center justify-end gap-3">
            {/* 막힌 이유는 칸 아래 안내와 버튼에 마우스를 올렸을 때 보이는 말풍선으로 알려 준다(버튼 옆에 긴 문장을 두지 않는다) */}
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              title={!submitting && missing.length > 0 ? `Needed to register: ${missing.join(", ")}.` : undefined}
            >
              {/* 등록 중... / 투여 기록 등록 */}
              {submitting ? "Saving..." : "Register Administration"}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}

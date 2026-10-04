"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, FormField, Input, Select } from "@/components/common";
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
import { fetchOrderRequest, selectOrdersByReception } from "@/features/emergency/order/slice";
import { ORDER_ITEM_TYPE } from "@/features/emergency/order/types";
import { hasLoadedItems } from "@/features/emergency/order/utils";
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

  const [form, setForm] = useState(initialForm);
  const [lastCount, setLastCount] = useState(0);
  const [manualDrug, setManualDrug] = useState(false);
  const administeredById = useActorId(form.administeredById);

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
  const drugOptions = [
    ...drugItems.map((item) => ({ value: item.itemCode, label: `${item.itemName} (${item.itemCode})` })),
    { value: MANUAL_DRUG, label: "Enter drug code manually..." },
  ];
  // 처방에 약품 항목이 없거나 아직 못 불러왔으면 직접 입력으로 둔다.
  const drugManualMode = manualDrug || drugItems.length === 0;

  function handleOrderChange(orderId: string) {
    setForm((prev) => ({ ...prev, orderId, drugCode: "", orderItemId: "" }));
    setManualDrug(false);
  }

  function handleDrugSelect(e: ChangeEvent<HTMLSelectElement>) {
    if (e.target.value === MANUAL_DRUG) {
      setManualDrug(true);
      setForm((prev) => ({ ...prev, drugCode: "", orderItemId: "" }));
      return;
    }
    setManualDrug(false);
    const picked = drugItems.find((item) => item.itemCode === e.target.value);
    setForm((prev) => ({
      ...prev,
      drugCode: picked?.itemCode ?? "",
      orderItemId: picked?.itemId ?? "",
    }));
  }

  const routeOptions = toCodeOptions(routeCodes, ADMIN_ROUTE_FALLBACK_OPTIONS);
  const canSubmit =
    !!receptionNo &&
    !submitting &&
    !!form.orderId.trim() &&
    !!form.drugCode.trim() &&
    !!form.dose.trim() &&
    !!form.routeCode &&
    !!form.administeredAt &&
    !!administeredById;

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
                    {item.drugCode} · {item.dose} · {optionLabel(routeOptions, item.routeCode)}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatDateTime(item.administeredAt)} · <StaffName empId={item.administeredById} /> · Order {item.orderId}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            // 기록된 투여가 없습니다.
            <p className="mb-4 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-400">No medication records yet.</p>
          )}

          {submitError ? <Alert variant="error">{resolveEmergencyMessage(submitError)}</Alert> : null}

          <div className="flex flex-wrap gap-3">
            {/* 처방 선택 — 이 환자의 처방(Order 탭)에서 고른다. 처방 ID 는 처방코어 prescriptionId */}
            <OrderSelect
              receptionNo={receptionNo}
              value={form.orderId}
              onChange={handleOrderChange}
              itemType={ORDER_ITEM_TYPE.DRUG}
              disabled={submitting}
              className="w-[420px]"
            />
            {/* 처방 항목 ID — 약품 코드를 고르면 자동으로 채워진다(그 처방의 몇 번째 약품인지) */}
            <FormField label="Order Item ID" hint={drugManualMode ? undefined : "Filled in from the drug you pick below."} className="w-[300px]">
              <Input
                name="orderItemId"
                value={form.orderItemId}
                onChange={handleChange}
                disabled={submitting || !drugManualMode}
                maxLength={36}
              />
            </FormField>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            {/* 약품 코드 — 고른 처방에 약품 항목이 있으면 거기서 고르고, 없으면(또는 Enter manually) 직접 입력 */}
            <FormField label="Drug Code" required className="w-[220px]">
              {drugManualMode ? (
                <Input name="drugCode" value={form.drugCode} onChange={handleChange} disabled={submitting} maxLength={30} />
              ) : (
                <Select
                  value={form.drugCode}
                  onChange={handleDrugSelect}
                  options={drugOptions}
                  placeholder="Select"
                  disabled={submitting || !form.orderId}
                />
              )}
            </FormField>
            {/* 용량 */}
            <FormField label="Dose" required className="w-[140px]">
              <Input name="dose" value={form.dose} onChange={handleChange} disabled={submitting} maxLength={50} />
            </FormField>
            {/* 투여경로 */}
            <FormField label="Route" required className="w-[140px]">
              <Select
                name="routeCode"
                value={form.routeCode}
                onChange={handleChange}
                options={routeOptions}
                placeholder="Select"
                disabled={submitting}
              />
            </FormField>
            {/* 투여 일시 */}
            <FormField label="Administered At" required className="w-[220px]">
              <Input
                type="datetime-local"
                name="administeredAt"
                value={form.administeredAt}
                onChange={handleChange}
                disabled={submitting}
              />
            </FormField>
            {/* 투여자 */}
            <ActorField
              label="Administered By"
              required
              value={form.administeredById}
              onChange={(empId) => setForm((prev) => ({ ...prev, administeredById: empId }))}
              disabled={submitting}
              className="w-[220px]"
            />
          </div>
          <div className="mt-3 flex justify-end">
            <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
              {/* 등록 중... / 투여 기록 등록 */}
              {submitting ? "Saving..." : "Register Administration"}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}

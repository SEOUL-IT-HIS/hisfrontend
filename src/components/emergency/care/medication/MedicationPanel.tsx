"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, FormField, Input, Select } from "@/components/common";
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
import { ORDER_ITEM_TYPE } from "@/features/emergency/order/types";
import { formatDateTime } from "@/features/emergency/utils";

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

  const [form, setForm] = useState(initialForm);
  const [lastCount, setLastCount] = useState(0);

  useEffect(() => {
    if (receptionNo) dispatch(fetchMedicationsRequest(receptionNo));
  }, [dispatch, receptionNo]);

  useEffect(() => {
    if (!commonCodeLoaded) dispatch(fetchAllCommonCodesRequest());
  }, [dispatch, commonCodeLoaded]);

  if (items.length > lastCount) {
    setLastCount(items.length);
    if (!submitting && !submitError) setForm(initialForm);
  } else if (items.length < lastCount) {
    setLastCount(items.length);
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
    !!form.administeredById.trim();

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
        administeredById: form.administeredById.trim(),
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
                    {formatDateTime(item.administeredAt)} · {item.administeredById} · Order {item.orderId}
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
              onChange={(orderId) => setForm((prev) => ({ ...prev, orderId }))}
              itemType={ORDER_ITEM_TYPE.DRUG}
              disabled={submitting}
              className="w-[420px]"
            />
            {/* 처방 항목 ID */}
            <FormField label="Order Item ID" className="w-[300px]">
              <Input
                name="orderItemId"
                value={form.orderItemId}
                onChange={handleChange}
                disabled={submitting}
                maxLength={36}
              />
            </FormField>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            {/* 약품 코드 */}
            <FormField label="Drug Code" required className="w-[180px]">
              <Input name="drugCode" value={form.drugCode} onChange={handleChange} disabled={submitting} maxLength={30} />
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
            {/* 투여자ID */}
            <FormField label="Administered By ID" required className="w-[180px]">
              <Input
                name="administeredById"
                value={form.administeredById}
                onChange={handleChange}
                disabled={submitting}
                maxLength={36}
              />
            </FormField>
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

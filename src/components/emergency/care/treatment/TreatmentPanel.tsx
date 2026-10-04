"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, FormField, Select } from "@/components/common";
import ActorField from "@/components/emergency/common/ActorField";
import StaffName from "@/components/emergency/common/StaffName";
import { useActorId } from "@/features/emergency/common/staff";
import { resolveEmergencyMessage } from "@/features/emergency/messages";
import { CODE_GROUP, optionLabel, toCodeOptions } from "@/features/emergency/codes";
import {
  createTreatmentRequest,
  fetchTreatmentsRequest,
  selectTreatmentError,
  selectTreatmentItems,
  selectTreatmentLoading,
  selectTreatmentSubmitError,
  selectTreatmentSubmitting,
} from "@/features/emergency/care/treatment/slice";
import { TREATMENT_TYPE_FALLBACK_OPTIONS } from "@/features/emergency/care/treatment/types";
import {
  fetchAllCommonCodesRequest,
  selectCommonCodeLoaded,
  selectCommonCodesByGroup,
} from "@/features/emergency/commonCode/slice";
import OrderSelect from "@/components/emergency/order/OrderSelect";
import { formatDateTime } from "@/features/emergency/utils";

type TreatmentPanelProps = { receptionNo: string; className?: string };

const initialForm = { orderId: "", treatmentCode: "", description: "", performedById: "" };

/**
 * 응급 처치 기록 패널 (UC-CARE-03, Jira UD2-18)
 * - 처치는 처방(orderId)을 참조해서 기록한다(처방 원장은 처방코어 소유, 응급은 참조만).
 *   처방 ID 는 이 환자의 처방 목록(Order 탭)에서 고른다(직접 입력도 가능).
 * - 처치 종류는 admin 공통코드 ER_TREATMENT_TYPE_CD(없으면 폴백).
 */
export default function TreatmentPanel({ receptionNo, className = "" }: TreatmentPanelProps) {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector(selectTreatmentItems);
  const loading = useSelector(selectTreatmentLoading);
  const error = useSelector(selectTreatmentError);
  const submitting = useSelector(selectTreatmentSubmitting);
  const submitError = useSelector(selectTreatmentSubmitError);
  const commonCodeLoaded = useSelector(selectCommonCodeLoaded);
  const typeCodes = useSelector(selectCommonCodesByGroup(CODE_GROUP.TREATMENT_TYPE));

  const [form, setForm] = useState(initialForm);
  const [lastCount, setLastCount] = useState(0);
  const performedById = useActorId(form.performedById);

  useEffect(() => {
    if (receptionNo) dispatch(fetchTreatmentsRequest(receptionNo));
  }, [dispatch, receptionNo]);

  useEffect(() => {
    if (!commonCodeLoaded) dispatch(fetchAllCommonCodesRequest());
  }, [dispatch, commonCodeLoaded]);

  // 등록 성공으로 목록이 늘면 입력폼을 비운다(환자를 바꿔 목록이 줄면 기준만 갱신).
  if (items.length > lastCount) {
    setLastCount(items.length);
    if (!submitting && !submitError) setForm(initialForm);
  } else if (items.length < lastCount) {
    setLastCount(items.length);
  }

  const typeOptions = toCodeOptions(typeCodes, TREATMENT_TYPE_FALLBACK_OPTIONS);
  const canSubmit =
    !!receptionNo &&
    !submitting &&
    !!form.orderId.trim() &&
    !!form.treatmentCode &&
    !!performedById;

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit() {
    if (!canSubmit) return;
    dispatch(
      createTreatmentRequest({
        encounterId: receptionNo,
        orderId: form.orderId.trim(),
        treatmentCode: form.treatmentCode,
        description: form.description.trim() || undefined,
        performedById,
      }),
    );
  }

  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
      {/* 응급 처치 기록 */}
      <h3 className="mb-3 text-sm font-semibold text-slate-800">Treatment Records</h3>

      {loading ? (
        // 처치 기록을 불러오는 중입니다...
        <p className="py-4 text-center text-sm text-slate-400">Loading treatment records...</p>
      ) : error ? (
        <Alert variant="error">{resolveEmergencyMessage(error)}</Alert>
      ) : (
        <>
          {items.length > 0 ? (
            <ul className="mb-4 space-y-2">
              {items.map((item) => (
                <li key={item.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="text-xs font-medium text-sky-600">{optionLabel(typeOptions, item.treatmentTypeCode)}</p>
                  {item.description ? <p className="whitespace-pre-wrap text-slate-800">{item.description}</p> : null}
                  <p className="mt-1 text-xs text-slate-400">
                    {formatDateTime(item.performedAt)} · <StaffName empId={item.performedById} /> · Order {item.orderId}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            // 기록된 처치가 없습니다.
            <p className="mb-4 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-400">No treatment records yet.</p>
          )}

          {submitError ? <Alert variant="error">{resolveEmergencyMessage(submitError)}</Alert> : null}

          <div className="flex flex-wrap gap-3">
            {/* 처방 선택 — 이 환자의 처방(Order 탭)에서 고른다. 처방 ID 는 처방코어 prescriptionId */}
            <OrderSelect
              receptionNo={receptionNo}
              value={form.orderId}
              onChange={(orderId) => setForm((prev) => ({ ...prev, orderId }))}
              disabled={submitting}
              className="w-[420px]"
            />
            {/* 처치 종류 */}
            <FormField label="Treatment Type" required className="w-[200px]">
              <Select
                name="treatmentCode"
                value={form.treatmentCode}
                onChange={handleChange}
                options={typeOptions}
                placeholder="Select"
                disabled={submitting}
              />
            </FormField>
            {/* 시행자 */}
            <ActorField
              label="Performed By"
              required
              value={form.performedById}
              onChange={(empId) => setForm((prev) => ({ ...prev, performedById: empId }))}
              disabled={submitting}
              className="w-[220px]"
            />
          </div>
          {/* 처치 내용 */}
          <FormField label="Description" className="mt-3">
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              disabled={submitting}
              maxLength={4000}
              className="w-full min-h-[64px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </FormField>
          <div className="mt-3 flex justify-end">
            <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
              {/* 등록 중... / 처치 기록 등록 */}
              {submitting ? "Saving..." : "Register Treatment"}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}

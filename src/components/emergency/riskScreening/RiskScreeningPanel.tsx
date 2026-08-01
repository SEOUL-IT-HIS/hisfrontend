"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, FormField, Input, Select } from "@/components/common";
import { resolveEmergencyMessage } from "@/features/emergency/messages";
import {
  createRiskScreeningRequest,
  fetchRiskScreeningsRequest,
  selectRiskScreeningError,
  selectRiskScreeningItems,
  selectRiskScreeningLoading,
  selectRiskScreeningSubmitError,
  selectRiskScreeningSubmitting,
} from "@/features/emergency/riskScreening/slice";
import { SCREEN_RESULT_OPTIONS, SCREEN_TYPE_OPTIONS } from "@/features/emergency/riskScreening/types";
import { formatDateTime } from "@/features/emergency/utils";

type RiskScreeningPanelProps = {
  receptionNo: string;
  className?: string;
};

const initialForm = { screenType: "" as "" | "SEPSIS" | "STROKE", score: "", resultCode: "", screenedById: "" };

const resultBadgeClass: Record<string, string> = {
  POSITIVE: "bg-rose-50 text-rose-600",
  NEGATIVE: "bg-emerald-50 text-emerald-700",
  INCONCLUSIVE: "bg-amber-50 text-amber-700",
};

/**
 * 패혈증-뇌졸중 위험도 스크리닝 패널 (UC-TRI-06 / Jira UD2-12)
 */
export default function RiskScreeningPanel({ receptionNo, className = "" }: RiskScreeningPanelProps) {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector(selectRiskScreeningItems);
  const loading = useSelector(selectRiskScreeningLoading);
  const error = useSelector(selectRiskScreeningError);
  const submitting = useSelector(selectRiskScreeningSubmitting);
  const submitError = useSelector(selectRiskScreeningSubmitError);

  const [form, setForm] = useState(initialForm);
  const [lastCount, setLastCount] = useState(0);

  useEffect(() => {
    if (receptionNo) {
      dispatch(fetchRiskScreeningsRequest(receptionNo));
    }
  }, [dispatch, receptionNo]);

  if (items.length > lastCount) {
    setLastCount(items.length);
    if (!submitting && !submitError) {
      setForm(initialForm);
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit() {
    if (!form.screenType) return;
    dispatch(
      createRiskScreeningRequest({
        encounterId: receptionNo,
        screenType: form.screenType,
        score: form.score.trim() ? Number(form.score) : undefined,
        resultCode: form.resultCode ? (form.resultCode as "NEGATIVE" | "POSITIVE" | "INCONCLUSIVE") : undefined,
        screenedById: form.screenedById || undefined,
      }),
    );
  }

  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
      <h3 className="mb-3 text-sm font-semibold text-slate-800">패혈증-뇌졸중 위험도 스크리닝</h3>

      {loading ? (
        <p className="py-4 text-center text-sm text-slate-400">스크리닝 이력을 불러오는 중입니다...</p>
      ) : error ? (
        <Alert variant="error">{resolveEmergencyMessage(error)}</Alert>
      ) : (
        <>
          {items.length > 0 ? (
            <ul className="mb-4 space-y-2">
              {items
                .slice()
                .reverse()
                .map((item) => (
                  <li key={item.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <span className="font-medium text-slate-700">
                      {SCREEN_TYPE_OPTIONS.find((o) => o.value === item.screeningTypeCode)?.label ??
                        item.screeningTypeCode}
                    </span>
                    {item.resultCode ? (
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${resultBadgeClass[item.resultCode] ?? "bg-slate-100 text-slate-600"}`}
                      >
                        {SCREEN_RESULT_OPTIONS.find((o) => o.value === item.resultCode)?.label ?? item.resultCode}
                      </span>
                    ) : null}
                    {item.score !== null ? <span className="text-xs text-slate-500">점수 {item.score}</span> : null}
                    <span className="ml-auto text-xs text-slate-400">{formatDateTime(item.screenedAt)}</span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="mb-4 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-400">
              아직 스크리닝 결과가 없습니다.
            </p>
          )}

          {submitError ? <Alert variant="error">{resolveEmergencyMessage(submitError)}</Alert> : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <FormField label="스크리닝 유형" required>
              <Select
                name="screenType"
                value={form.screenType}
                onChange={handleChange}
                options={[...SCREEN_TYPE_OPTIONS]}
                placeholder="선택"
                disabled={submitting}
              />
            </FormField>
            <FormField label="점수">
              <Input type="number" name="score" value={form.score} onChange={handleChange} disabled={submitting} />
            </FormField>
            <FormField label="판정 결과">
              <Select
                name="resultCode"
                value={form.resultCode}
                onChange={handleChange}
                options={[...SCREEN_RESULT_OPTIONS]}
                placeholder="선택"
                disabled={submitting}
              />
            </FormField>
            <FormField label="시행자ID">
              <Input name="screenedById" value={form.screenedById} onChange={handleChange} disabled={submitting} maxLength={36} />
            </FormField>
          </div>
          <div className="mt-3 flex justify-end">
            <Button type="button" onClick={handleSubmit} disabled={submitting || !form.screenType}>
              {submitting ? "저장 중..." : "스크리닝 결과 등록"}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}

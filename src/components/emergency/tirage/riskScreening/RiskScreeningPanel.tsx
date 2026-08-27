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
} from "@/features/emergency/triage/riskScreening/slice";
import { SCREEN_RESULT_OPTIONS, SCREEN_TYPE_OPTIONS } from "@/features/emergency/triage/riskScreening/types";
import { formatDateTime, latestByTime } from "@/features/emergency/utils";
import { selectVitalsItems } from "@/features/emergency/triage/vitals/slice";

type RiskScreeningPanelProps = {
  receptionNo: string;
  className?: string;
};

const initialForm = { screenType: "" as "" | "SEPSIS" | "STROKE", score: "", resultCode: "", screenedById: "" };

const FAST_CHECK_ITEMS = [
  { key: "face", label: "안면마비" },
  { key: "arm", label: "팔처짐" },
  { key: "speech", label: "발음이상" },
] as const;
type FastCheckKey = (typeof FAST_CHECK_ITEMS)[number]["key"];
const initialFastChecks: Record<FastCheckKey, boolean> = { face: false, arm: false, speech: false };

const resultBadgeClass: Record<string, string> = {
  POSITIVE: "bg-rose-50 text-rose-600",
  NEGATIVE: "bg-emerald-50 text-emerald-700",
  INCONCLUSIVE: "bg-amber-50 text-amber-700",
};

const SCREEN_TOOL_GUIDE: Record<string, string> = {
  SEPSIS: "qSOFA — 호흡수≥22 · 의식저하(GCS<15) · 수축기혈압≤100 중 2개 이상이면 고위험(POSITIVE)",
  STROKE: "FAST — 안면마비 · 팔처짐 · 발음이상 중 하나라도 있으면 양성(POSITIVE)",
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
  const vitalsItems = useSelector(selectVitalsItems);

  const [form, setForm] = useState(initialForm);
  const [lastCount, setLastCount] = useState(0);
  const [localError, setLocalError] = useState("");
  const [fastChecks, setFastChecks] = useState(initialFastChecks);

  useEffect(() => {
    if (receptionNo) {
      dispatch(fetchRiskScreeningsRequest(receptionNo));
    }
  }, [dispatch, receptionNo]);

  if (items.length > lastCount) {
    setLastCount(items.length);
    if (!submitting && !submitError) {
      setForm(initialForm);
      setFastChecks(initialFastChecks);
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  // qSOFA(패혈증)는 이미 입력된 활력징후 값으로 자동 계산 가능하다.
  // FAST(뇌졸중)는 안면마비/팔처짐/발음이상 등 신체진찰 소견이라 우리 데이터엔 없어 자동계산 대상이 아니다.
  const latestVitals = latestByTime(vitalsItems, (i) => i.measuredAt);
  const qsofaSuggestion =
    form.screenType === "SEPSIS" && latestVitals
      ? (() => {
          const criteria = [
            {
              met:
                latestVitals.respRate !== null && latestVitals.respRate !== undefined && latestVitals.respRate >= 22,
              label: `빈호흡 (호흡수 ${latestVitals.respRate ?? "-"}회/분)`,
            },
            {
              met: latestVitals.gcs !== null && latestVitals.gcs !== undefined && latestVitals.gcs < 15,
              label: `의식저하 (GCS ${latestVitals.gcs ?? "-"})`,
            },
            {
              met:
                latestVitals.systolicBp !== null &&
                latestVitals.systolicBp !== undefined &&
                latestVitals.systolicBp <= 100,
              label: `저혈압 (수축기 ${latestVitals.systolicBp ?? "-"}mmHg)`,
            },
          ];
          const metCriteria = criteria.filter((c) => c.met);
          return {
            score: metCriteria.length,
            resultCode: metCriteria.length >= 2 ? "POSITIVE" : "NEGATIVE",
            reasons: metCriteria.map((c) => c.label),
          } as const;
        })()
      : null;

  function applyQsofaSuggestion() {
    if (!qsofaSuggestion) return;
    setForm((prev) => ({
      ...prev,
      score: String(qsofaSuggestion.score),
      resultCode: qsofaSuggestion.resultCode,
    }));
  }

  // FAST(뇌졸중)는 안면마비/팔처짐/발음이상 체크 1개당 1점, 1점 이상이면 양성.
  const fastSuggestion =
    form.screenType === "STROKE"
      ? (() => {
          const checked = FAST_CHECK_ITEMS.filter((item) => fastChecks[item.key]);
          return {
            score: checked.length,
            resultCode: checked.length >= 1 ? "POSITIVE" : "NEGATIVE",
            reasons: checked.map((item) => item.label),
          } as const;
        })()
      : null;

  function toggleFastCheck(key: FastCheckKey) {
    setFastChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function applyFastSuggestion() {
    if (!fastSuggestion) return;
    setForm((prev) => ({
      ...prev,
      score: String(fastSuggestion.score),
      resultCode: fastSuggestion.resultCode,
    }));
  }

  function handleSubmit() {
    if (!form.screenType) return;
    setLocalError("");
    if (form.score.trim()) {
      const scoreNum = Number(form.score);
      if (Number.isNaN(scoreNum) || scoreNum < 0 || scoreNum > 3) {
        setLocalError("점수는 0~3 사이여야 합니다.");
        return;
      }
    }
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
          {localError ? <Alert variant="error">{localError}</Alert> : null}

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
            <FormField label={form.screenType ? "점수 (0~3)" : "점수"}>
              <Input type="number" name="score" min={0} max={3} value={form.score} onChange={handleChange} disabled={submitting} className="max-w-[120px]" />
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
              <Input name="screenedById" value={form.screenedById} onChange={handleChange} disabled={submitting} maxLength={36} className="max-w-[200px]" />
            </FormField>
          </div>

          {form.screenType ? (
            <p className="mt-3 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-700">
              {SCREEN_TOOL_GUIDE[form.screenType]}
            </p>
          ) : null}

          {form.screenType === "STROKE" ? (
            <div className="mt-3 flex flex-wrap gap-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {FAST_CHECK_ITEMS.map((item) => (
                <label key={item.key} className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={fastChecks[item.key]}
                    onChange={() => toggleFastCheck(item.key)}
                    disabled={submitting}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          ) : null}

          {!qsofaSuggestion && form.screenType === "SEPSIS" ? (
            <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400">
              활력징후가 아직 없어 자동계산할 수 없습니다.
            </p>
          ) : null}

          {qsofaSuggestion || fastSuggestion ? (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              <span>
                자동계산: {(qsofaSuggestion ?? fastSuggestion)!.score}점 (
                {(qsofaSuggestion ?? fastSuggestion)!.resultCode === "POSITIVE" ? "양성 권장" : "음성 권장"})
                {(qsofaSuggestion ?? fastSuggestion)!.reasons.length > 0
                  ? ` — 해당: ${(qsofaSuggestion ?? fastSuggestion)!.reasons.join(", ")}`
                  : ""}
              </span>
              <button
                type="button"
                onClick={qsofaSuggestion ? applyQsofaSuggestion : applyFastSuggestion}
                className="shrink-0 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white"
              >
                적용
              </button>
            </div>
          ) : null}

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

"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, FormField, Input } from "@/components/common";
import { resolveEmergencyMessage } from "@/features/emergency/messages";
import {
  createVitalsRequest,
  fetchVitalsRequest,
  selectVitalsError,
  selectVitalsItems,
  selectVitalsLoading,
  selectVitalsSubmitError,
  selectVitalsSubmitting,
} from "@/features/emergency/vitals/slice";
import { formatDateTime } from "@/features/emergency/utils";

type VitalsPanelProps = {
  receptionNo: string;
  className?: string;
};

const initialForm = {
  systolicBp: "",
  heartRate: "",
  respRate: "",
  temperature: "",
  spo2: "",
  gcs: "",
  measuredById: "",
};

/**
 * 초기 환자상태 평가(활력징후/EWS) 패널 (UC-TRI-04 / Jira UD2-10)
 * - 활력징후를 시계열로 기록한다. 최신 값을 상단에, 이력을 목록으로 보여준다.
 * - EWS 점수 자동 산출 정책은 미확정(백엔드 참고) — 여기서는 입력값 저장만 다룬다.
 */
export default function VitalsPanel({ receptionNo, className = "" }: VitalsPanelProps) {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector(selectVitalsItems);
  const loading = useSelector(selectVitalsLoading);
  const error = useSelector(selectVitalsError);
  const submitting = useSelector(selectVitalsSubmitting);
  const submitError = useSelector(selectVitalsSubmitError);

  const [form, setForm] = useState(initialForm);
  const [lastCount, setLastCount] = useState(0);

  useEffect(() => {
    if (receptionNo) {
      dispatch(fetchVitalsRequest(receptionNo));
    }
  }, [dispatch, receptionNo]);

  if (items.length > lastCount) {
    setLastCount(items.length);
    if (!submitting && !submitError) {
      setForm(initialForm);
    }
  }

  const latest = items.length > 0 ? items[items.length - 1] : null;

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function toNumber(value: string): number | undefined {
    if (!value.trim()) return undefined;
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
  }

  function handleSubmit() {
    dispatch(
      createVitalsRequest({
        encounterId: receptionNo,
        measuredById: form.measuredById || undefined,
        vitals: [
          {
            systolicBp: toNumber(form.systolicBp),
            heartRate: toNumber(form.heartRate),
            respRate: toNumber(form.respRate),
            temperature: toNumber(form.temperature),
            spo2: toNumber(form.spo2),
            gcs: toNumber(form.gcs),
          },
        ],
      }),
    );
  }

  const hasAnyValue = Object.entries(form).some(
    ([key, value]) => key !== "measuredById" && value.trim() !== "",
  );

  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
      <h3 className="mb-3 text-sm font-semibold text-slate-800">초기 환자상태 평가 (활력징후)</h3>

      {loading ? (
        <p className="py-4 text-center text-sm text-slate-400">활력징후를 불러오는 중입니다...</p>
      ) : error ? (
        <Alert variant="error">{resolveEmergencyMessage(error)}</Alert>
      ) : (
        <>
          {latest ? (
            <dl className="mb-4 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-6">
              <div><dt className="text-xs text-slate-500">수축기혈압</dt><dd>{latest.systolicBp ?? "-"}</dd></div>
              <div><dt className="text-xs text-slate-500">맥박</dt><dd>{latest.heartRate ?? "-"}</dd></div>
              <div><dt className="text-xs text-slate-500">호흡수</dt><dd>{latest.respRate ?? "-"}</dd></div>
              <div><dt className="text-xs text-slate-500">체온</dt><dd>{latest.temperature ?? "-"}</dd></div>
              <div><dt className="text-xs text-slate-500">SpO2</dt><dd>{latest.spo2 ?? "-"}</dd></div>
              <div><dt className="text-xs text-slate-500">GCS</dt><dd>{latest.gcs ?? "-"}</dd></div>
            </dl>
          ) : (
            <p className="mb-4 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-400">
              아직 측정된 활력징후가 없습니다.
            </p>
          )}

          {items.length > 1 ? (
            <ul className="mb-4 space-y-1 text-xs text-slate-500">
              {items.slice(0, -1).reverse().map((item) => (
                <li key={item.id}>
                  {formatDateTime(item.measuredAt)} · BP {item.systolicBp ?? "-"} · HR {item.heartRate ?? "-"} · RR{" "}
                  {item.respRate ?? "-"} · SpO2 {item.spo2 ?? "-"} · GCS {item.gcs ?? "-"}
                </li>
              ))}
            </ul>
          ) : null}

          {submitError ? <Alert variant="error">{resolveEmergencyMessage(submitError)}</Alert> : null}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <FormField label="수축기혈압">
              <Input type="number" name="systolicBp" value={form.systolicBp} onChange={handleChange} disabled={submitting} />
            </FormField>
            <FormField label="맥박">
              <Input type="number" name="heartRate" value={form.heartRate} onChange={handleChange} disabled={submitting} />
            </FormField>
            <FormField label="호흡수">
              <Input type="number" name="respRate" value={form.respRate} onChange={handleChange} disabled={submitting} />
            </FormField>
            <FormField label="체온">
              <Input type="number" step="0.1" name="temperature" value={form.temperature} onChange={handleChange} disabled={submitting} />
            </FormField>
            <FormField label="SpO2">
              <Input type="number" name="spo2" value={form.spo2} onChange={handleChange} disabled={submitting} />
            </FormField>
            <FormField label="GCS">
              <Input type="number" name="gcs" value={form.gcs} onChange={handleChange} disabled={submitting} />
            </FormField>
            <FormField label="측정자ID" className="sm:col-span-3">
              <Input name="measuredById" value={form.measuredById} onChange={handleChange} disabled={submitting} maxLength={36} />
            </FormField>
          </div>
          <div className="mt-3 flex justify-end">
            <Button type="button" onClick={handleSubmit} disabled={submitting || !hasAnyValue}>
              {submitting ? "저장 중..." : "활력징후 등록"}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}

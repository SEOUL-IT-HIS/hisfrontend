"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, FormField, Input, Select } from "@/components/common";
import { resolveEmergencyMessage } from "@/features/emergency/messages";
import {
  createIsolationRequest,
  fetchIsolationsRequest,
  releaseIsolationRequest,
  selectIsolationError,
  selectIsolationItems,
  selectIsolationLoading,
  selectIsolationSubmitError,
  selectIsolationSubmitting,
} from "@/features/emergency/triage/isolation/slice";
import { ISOLATION_TYPE_OPTIONS } from "@/features/emergency/triage/isolation/types";
import { formatDateTime } from "@/features/emergency/utils";

type IsolationPanelProps = {
  receptionNo: string;
  className?: string;
};

const initialForm = { isolationTypeCode: "", requiredYn: "Y" as "Y" | "N", decidedById: "" };

/**
 * 감염병 격리 관리 패널 (UC-TRI-05 / Jira UD2-11)
 * - 격리 등록/해제(released_at 기록, 물리삭제 아님)를 다룬다.
 * - DUR 이력은 GR2/PHM 조회 대상이나 실연동 전이라 자리표시자만 둔다 (UD2-72).
 */
export default function IsolationPanel({ receptionNo, className = "" }: IsolationPanelProps) {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector(selectIsolationItems);
  const loading = useSelector(selectIsolationLoading);
  const error = useSelector(selectIsolationError);
  const submitting = useSelector(selectIsolationSubmitting);
  const submitError = useSelector(selectIsolationSubmitError);

  const [form, setForm] = useState(initialForm);
  const [lastCount, setLastCount] = useState(0);

  useEffect(() => {
    if (receptionNo) {
      dispatch(fetchIsolationsRequest(receptionNo));
    }
  }, [dispatch, receptionNo]);

  if (items.length > lastCount) {
    setLastCount(items.length);
  }

  const activeIsolations = items.filter((item) => !item.releasedAt);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleRegister() {
    if (!form.isolationTypeCode) return;
    dispatch(
      createIsolationRequest({
        encounterId: receptionNo,
        isolationTypeCode: form.isolationTypeCode,
        requiredYn: form.requiredYn,
        decidedById: form.decidedById || undefined,
      }),
    );
    setForm(initialForm);
  }

  function handleRelease(id: string) {
    dispatch(releaseIsolationRequest(id));
  }

  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
      {/* 감염병 격리 관리 */}
      <h3 className="mb-3 text-sm font-semibold text-slate-800">Infection Isolation Management</h3>

      {loading ? (
        // 격리 이력을 불러오는 중입니다...
        <p className="py-4 text-center text-sm text-slate-400">Loading isolation history...</p>
      ) : error ? (
        <Alert variant="error">{resolveEmergencyMessage(error)}</Alert>
      ) : (
        <>
          {activeIsolations.length > 0 ? (
            <ul className="mb-3 space-y-2">
              {activeIsolations.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-sm"
                >
                  <span>
                    <span className="font-medium text-amber-700">
                      {ISOLATION_TYPE_OPTIONS.find((o) => o.value === item.isolationTypeCode)?.label ??
                        item.isolationTypeCode}
                    </span>{" "}
                    <span className="text-xs text-slate-500">
                      {/* (격리필요: ... · ... 결정) */}
                      (Required: {item.requiredYn} · Decided {formatDateTime(item.decidedAt)})
                    </span>
                  </span>
                  {/* 해제 */}
                  <Button type="button" variant="secondary" onClick={() => handleRelease(item.id)} disabled={submitting}>
                    Release
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-3 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-400">
              {/* 현재 활성 격리가 없습니다. */}
              No active isolation at this time.
            </p>
          )}

          {items.some((item) => item.releasedAt) ? (
            <ul className="mb-4 space-y-1 text-xs text-slate-400">
              {items
                .filter((item) => item.releasedAt)
                .map((item) => (
                  <li key={item.id}>
                    {ISOLATION_TYPE_OPTIONS.find((o) => o.value === item.isolationTypeCode)?.label ??
                      item.isolationTypeCode}{" "}
                    {/* 해제됨 (...) */}
                    · Released ({formatDateTime(item.releasedAt)})
                  </li>
                ))}
            </ul>
          ) : null}

          <p className="mb-3 rounded-lg border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-400">
            {/* DUR(약물 상호작용) 이력은 GR2/PHM 조회 대상입니다. 실연동 전이라 이 화면에서는 표시하지 않습니다. */}
            DUR (drug interaction) history is retrieved from GR2/PHM. Not shown here until integration is complete.
          </p>

          {submitError ? <Alert variant="error">{resolveEmergencyMessage(submitError)}</Alert> : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* 격리 유형 */}
            <FormField label="Isolation Type" required>
              <Select
                name="isolationTypeCode"
                value={form.isolationTypeCode}
                onChange={handleChange}
                options={[...ISOLATION_TYPE_OPTIONS]}
                // 선택
                placeholder="Select"
                disabled={submitting}
              />
            </FormField>
            {/* 격리 필요 여부 */}
            <FormField label="Isolation Required">
              <Select
                name="requiredYn"
                value={form.requiredYn}
                onChange={handleChange}
                // 필요 / 불필요
                options={[{ value: "Y", label: "Required" }, { value: "N", label: "Not Required" }]}
                disabled={submitting}
              />
            </FormField>
            {/* 결정자ID */}
            <FormField label="Decided By ID">
              <Input name="decidedById" value={form.decidedById} onChange={handleChange} disabled={submitting} maxLength={36} />
            </FormField>
          </div>
          <div className="mt-3 flex justify-end">
            <Button type="button" onClick={handleRegister} disabled={submitting || !form.isolationTypeCode}>
              {/* 저장 중... / 격리 등록 */}
              {submitting ? "Saving..." : "Register Isolation"}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}

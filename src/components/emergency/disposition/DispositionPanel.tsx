"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, FormField, Input, Select } from "@/components/common";
import { resolveEmergencyMessage } from "@/features/emergency/messages";
import {
  createDispositionRequest,
  fetchDispositionsRequest,
  selectDispositionByReceptionId,
  selectDispositionError,
  selectDispositionLoading,
  selectDispositionSubmitError,
  selectDispositionSubmitting,
} from "@/features/emergency/disposition/slice";
import {
  DISPOSITION_TYPE_FALLBACK_OPTIONS,
  DISPOSITION_TYPE_GROUP_CODE,
} from "@/features/emergency/disposition/types";
import {
  fetchAllCommonCodesRequest,
  selectCommonCodeLoaded,
  selectCommonCodesByGroup,
} from "@/features/emergency/commonCode/slice";
import { formatDateTime } from "@/features/emergency/utils";

type DispositionPanelProps = {
  receptionNo: string;
  className?: string;
};

const initialForm = { dispositionType: "", decidedById: "" };

/**
 * 응급 퇴실 결정 패널 (UC-DISP-01, Jira UD2-39)
 * - 환자를 고르면 GET /dispositions?receptionId= 로 최신 결정을 불러와 보여준다.
 * - 결정이 없을 때만 등록 폼을 보여준다.
 */
export default function DispositionPanel({ receptionNo, className = "" }: DispositionPanelProps) {
  const dispatch = useDispatch<AppDispatch>();
  const disposition = useSelector(selectDispositionByReceptionId(receptionNo));
  const loading = useSelector(selectDispositionLoading);
  const error = useSelector(selectDispositionError);
  const submitting = useSelector(selectDispositionSubmitting);
  const submitError = useSelector(selectDispositionSubmitError);
  const commonCodeLoaded = useSelector(selectCommonCodeLoaded);
  const dispositionTypeCodes = useSelector(selectCommonCodesByGroup(DISPOSITION_TYPE_GROUP_CODE));

  const [form, setForm] = useState(initialForm);
  const [lastReceptionNo, setLastReceptionNo] = useState(receptionNo);

  useEffect(() => {
    if (receptionNo) {
      dispatch(fetchDispositionsRequest(receptionNo));
    }
  }, [dispatch, receptionNo]);

  useEffect(() => {
    if (!commonCodeLoaded) {
      dispatch(fetchAllCommonCodesRequest());
    }
  }, [dispatch, commonCodeLoaded]);

  // 환자가 바뀌면 입력폼을 초기화한다 (다른 패널들과 동일한 패턴).
  if (receptionNo !== lastReceptionNo) {
    setLastReceptionNo(receptionNo);
    setForm(initialForm);
  }

  const typeOptions =
    dispositionTypeCodes.length > 0
      ? dispositionTypeCodes
          .filter((code) => code.useYn !== "N")
          .map((code) => ({ value: code.codeValue, label: code.codeName }))
      : [...DISPOSITION_TYPE_FALLBACK_OPTIONS];

  function typeLabel(code: string): string {
    return typeOptions.find((o) => o.value === code)?.label ?? code;
  }

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit() {
    if (!form.dispositionType || !receptionNo) return;
    dispatch(
      createDispositionRequest({
        encounterId: receptionNo,
        dispositionType: form.dispositionType,
        decidedById: form.decidedById || undefined,
      }),
    );
  }

  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
      {/* 퇴실 결정 */}
      <h3 className="mb-3 text-sm font-semibold text-slate-800">Disposition Decision</h3>

      {loading ? (
        // 퇴실 결정을 불러오는 중입니다...
        <p className="py-4 text-center text-sm text-slate-400">Loading disposition...</p>
      ) : error ? (
        <Alert variant="error">{resolveEmergencyMessage(error)}</Alert>
      ) : disposition ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <span>
            {/* 퇴실 구분: {구분} · {결정일시} */}
            Disposition: {typeLabel(disposition.dispositionTypeCode)} · {formatDateTime(disposition.decidedAt)}
          </span>
        </div>
      ) : (
        <>
          {submitError ? <Alert variant="error">{resolveEmergencyMessage(submitError)}</Alert> : null}

          <div className="flex flex-wrap gap-3">
            {/* 퇴실 구분 */}
            <FormField label="Disposition Type" required className="w-[220px]">
              <Select
                name="dispositionType"
                value={form.dispositionType}
                onChange={handleChange}
                options={typeOptions}
                // 선택
                placeholder="Select"
                disabled={submitting}
              />
            </FormField>
            {/* 결정자ID */}
            <FormField label="Decided By ID" className="w-[180px]">
              <Input
                name="decidedById"
                value={form.decidedById}
                onChange={handleChange}
                disabled={submitting}
                maxLength={36}
              />
            </FormField>
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !form.dispositionType || !receptionNo}
            >
              {/* 등록 중... / 퇴실 결정 등록 */}
              {submitting ? "Saving..." : "Register Disposition"}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}

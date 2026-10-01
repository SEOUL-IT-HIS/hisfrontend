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
  selectAdmissionsByDisposition,
  selectTransfersByDisposition,
} from "@/features/emergency/disposition/followup/slice";
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
 * - 결정이 없으면 등록 폼을 보여준다.
 * - 결정이 있어도 후속 조치 전(입원요청 없음·거부됨, 전원 소견서 없음)이면 'Change Disposition'으로 바꿀 수 있다.
 *   바꿀 수 있는지는 백엔드가 내려주는 changeable 로 판단한다(병동 회신 대기 중·퇴실 완료면 false).
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
  // 결정 변경 폼을 열었는지
  const [changing, setChanging] = useState(false);
  const [lastDispositionId, setLastDispositionId] = useState(disposition?.id ?? "");

  // 입원 회신·전원 소견서가 바뀌면 결정 변경 가능 여부(changeable)도 바뀌므로 결정을 다시 불러온다.
  const admissions = useSelector(selectAdmissionsByDisposition(disposition?.id ?? ""));
  const transfers = useSelector(selectTransfersByDisposition(disposition?.id ?? ""));
  const followUpKey = `${admissions[0]?.requestStatusCode ?? ""}|${transfers.length}`;

  useEffect(() => {
    if (receptionNo) {
      dispatch(fetchDispositionsRequest(receptionNo));
    }
  }, [dispatch, receptionNo, followUpKey]);

  useEffect(() => {
    if (!commonCodeLoaded) {
      dispatch(fetchAllCommonCodesRequest());
    }
  }, [dispatch, commonCodeLoaded]);

  // 환자가 바뀌면 입력폼을 초기화한다 (다른 패널들과 동일한 패턴).
  if (receptionNo !== lastReceptionNo) {
    setLastReceptionNo(receptionNo);
    setForm(initialForm);
    setChanging(false);
  }
  // 새 결정이 저장되면(최신 결정 id 가 바뀌면) 변경 폼을 닫는다.
  const currentDispositionId = disposition?.id ?? "";
  if (currentDispositionId !== lastDispositionId) {
    setLastDispositionId(currentDispositionId);
    setForm(initialForm);
    setChanging(false);
  }

  const typeOptions =
    dispositionTypeCodes.length > 0
      ? dispositionTypeCodes
          .filter((code) => code.useYn !== "N")
          .map((code) => ({ value: code.codeValue, label: code.codeName }))
      : [...DISPOSITION_TYPE_FALLBACK_OPTIONS];
  // 결정을 바꿀 때는 지금과 같은 유형은 고를 수 없다(입원이면 재요청을 쓴다)
  const formOptions =
    changing && disposition ? typeOptions.filter((o) => o.value !== disposition.dispositionTypeCode) : typeOptions;

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

      {loading && !disposition ? (
        // 퇴실 결정을 불러오는 중입니다...
        <p className="py-4 text-center text-sm text-slate-400">Loading disposition...</p>
      ) : error ? (
        <Alert variant="error">{resolveEmergencyMessage(error)}</Alert>
      ) : disposition && !changing ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <span>
            {/* 퇴실 구분: {구분} · {결정일시} */}
            Disposition: {typeLabel(disposition.dispositionTypeCode)} · {formatDateTime(disposition.decidedAt)}
          </span>
          {disposition.changeable ? (
            // 결정 변경 (예: 병동이 입원을 거부해 전원·귀가로 바꿀 때)
            <Button type="button" variant="secondary" onClick={() => setChanging(true)}>
              Change Disposition
            </Button>
          ) : null}
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
                options={formOptions}
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
          <div className="mt-3 flex justify-end gap-2">
            {changing ? (
              // 변경 취소
              <Button type="button" variant="ghost" onClick={() => setChanging(false)} disabled={submitting}>
                Cancel
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !form.dispositionType || !receptionNo}
            >
              {/* 등록 중... / 퇴실 결정 변경 / 퇴실 결정 등록 */}
              {submitting ? "Saving..." : changing ? "Change Disposition" : "Register Disposition"}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}

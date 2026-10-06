"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, ConfirmDialog, FormField, Select } from "@/components/common";
import CodeSearchInput, { isKnownCode } from "@/components/labimaging/common/CodeSearchInput";
import LoginActorInput from "@/components/labimaging/common/LoginActorInput";
import { useLoginActor } from "@/features/labimaging/common/hooks/useLoginActor";
import { formatStaffName, useStaffDirectory } from "@/features/labimaging/common/hooks/useStaffDirectory";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import type { LabWorklistItem } from "@/features/labimaging/laborder/types";
import type { LabResultItem } from "@/features/labimaging/labresult/types";
import { fetchPathologyAttachment, joinFindings, splitFindings } from "@/features/labimaging/pathologyresult/api";
import { resolvePathologyResultMessage } from "@/features/labimaging/pathologyresult/messages";
import { validatePathologyAttachment } from "@/features/labimaging/common/validation";
import {
  confirmPathologyResultRequest,
  createPathologyResultRequest,
  fetchPathologyResultsRequest,
  resetPathologyResultState,
  selectPathologyLoadError,
  selectPathologyLoading,
  selectPathologyResults,
  selectPathologySubmitError,
  selectPathologySubmitting,
  updatePathologyResultRequest,
} from "@/features/labimaging/pathologyresult/slice";
import {
  FINDINGS_SECTIONS,
  type FindingsSections,
  type PathologyResultSummary,
} from "@/features/labimaging/pathologyresult/types";

/**
 * 병리 결과 입력 패널 — UC-RST-03 병리검사결과등록 (Jira ZP2-15/98, 5차 Phase 4)
 *
 * 흐름: 병리 항목 선택 → 병리유형(조직/세포) → 육안/현미경/진단 소견 → 진단명코드(선택) → 첨부(선택) → 저장 → 확정
 *
 * ⚠ 소견은 세 구획으로 받아 제목을 붙여 한 문자열로 저장한다(D6, 컬럼이 findings 하나). 다시 열면 구획으로 나눠 채운다.
 * ⚠ 첨부는 jpg/png/pdf(D7). 저장 실패 시 서버가 첨부 업로드도 취소한다(LAB055/LAB056) — 같은 화면에서 다시 올리면 된다.
 *   수정에서 파일을 다시 고르면 첨부가 교체된다(재등록).
 * ⚠ 병리 항목은 한 접수에 여러 개일 수 있다(항목마다 결과 1건). 미생물처럼 "접수당 1개" 제약이 없다.
 */
type Props = {
  reception: LabWorklistItem;
  pathologyItems: LabResultItem[];
};

type FormState = {
  pathologyTypeCode: string;
  diagnosisCode: string;
  sections: FindingsSections;
};

const emptySections: FindingsSections = { gross: "", microscopic: "", diagnosis: "" };
const emptyForm: FormState = { pathologyTypeCode: "", diagnosisCode: "", sections: emptySections };

const ACCEPT = "image/jpeg,image/png,application/pdf";

function toForm(result: PathologyResultSummary): FormState {
  return {
    pathologyTypeCode: result.pathologyTypeCode,
    diagnosisCode: result.diagnosisCode ?? "",
    sections: splitFindings(result.findings),
  };
}

function formatDateTime(value?: string) {
  return value ? value.replace("T", " ").slice(0, 16) : "-";
}

export default function PathologyResultWorkPanel({ reception, pathologyItems }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { actorId, actorName, signedIn } = useLoginActor();
  // 입력자·확정자 empId → 이름 표시용. (직원ID 화면 노출 정리, 2026-10-05)
  const { nameById: staffNameById, loading: staffLoading } = useStaffDirectory();

  const results = useSelector(selectPathologyResults);
  const loading = useSelector(selectPathologyLoading);
  const loadError = useSelector(selectPathologyLoadError);
  const submitting = useSelector(selectPathologySubmitting);
  const submitError = useSelector(selectPathologySubmitError);

  const pathologyTypes = useCommonCodeOptions("PATHOLOGY_TYPE_CD");
  const diagnoses = useCommonCodeOptions("PATHOLOGY_DIAGNOSIS_CD");
  const testTypes = useCommonCodeOptions("TEST_TYPE_CD");

  const [itemId, setItemId] = useState(pathologyItems[0]?.labOrderItemId ?? "");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [preview, setPreview] = useState<{ key: string; url: string } | null>(null);

  useEffect(() => {
    dispatch(resetPathologyResultState());
    dispatch(fetchPathologyResultsRequest(reception.receptionNo));
  }, [dispatch, reception.receptionNo]);

  const result = results.find((r) => r.labOrderItemId === itemId) ?? null;
  const confirmed = result?.resultStatusCode === "02";
  const locked = confirmed || submitting;

  /*
   * 고른 항목·저장된 결과가 바뀌면 폼을 다시 채운다. 입력 도중 목록만 다시 그려질 때는 건드리지 않는다.
   * (effect 안에서 setState 하지 않고 렌더 중에 비교해 맞추는 방식 — MicrobiologyResultWorkPanel 과 같다)
   */
  const formKey = `${itemId}|${result ? `${result.pathologyResultId}:${result.updatedAt ?? ""}:${result.resultStatusCode}` : ""}`;
  const [appliedKey, setAppliedKey] = useState("");
  if (formKey !== appliedKey) {
    setAppliedKey(formKey);
    setForm(result ? toForm(result) : emptyForm);
    setFile(null);
    setFileInputKey((k) => k + 1);
    setError("");
  }

  /*
   * 첨부 미리보기 (ZP2-98). 서버에서 Blob 으로 받아 object URL 로 보여준다.
   * ⚠ 결과·갱신시각이 바뀔 때만 다시 받는다. 만든 URL 은 정리 함수에서 해제한다(메모리 누수 방지).
   */
  const attachmentKey = result?.attachmentYn === "Y" ? `${result.pathologyResultId}:${result.updatedAt ?? ""}` : "";
  useEffect(() => {
    if (!attachmentKey || !result) return;
    let url = "";
    let cancelled = false;
    fetchPathologyAttachment(result.pathologyResultId)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setPreview({ key: attachmentKey, url });
      })
      .catch(() => {
        // 미리보기는 표시용이다. 실패해도 결과 입력은 계속할 수 있어야 한다.
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
    // result 객체 대신 attachmentKey 로만 다시 받는다(같은 결과를 매 렌더마다 받지 않게).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachmentKey]);
  const previewUrl = preview && preview.key === attachmentKey ? preview.url : null;

  function setSection(key: keyof FindingsSections, value: string) {
    setForm((prev) => ({ ...prev, sections: { ...prev.sections, [key]: value } }));
    setError("");
  }

  function validate(): string {
    if (!signedIn) return "Sign in to record this result.";
    if (!itemId) return "Select a pathology test item.";
    if (!form.pathologyTypeCode) return "Select a pathology type.";
    if (!joinFindings(form.sections)) return "Enter at least one findings section.";
    // 목록에 없는 진단명코드는 제출을 막는다. (04번 지시서 Phase 4-1)
    if (!isKnownCode(form.diagnosisCode, diagnoses.options)) return "Unknown diagnosis code. Please choose one from the list.";
    if (file) {
      // 선택 즉시가 아니라 제출 시점에 확인한다 — 이 폼은 결과 등록/수정과 같은 submit 한 번으로
      // 끝나는 흐름이라 별도의 file change 핸들러가 없다. (04번 지시서 Phase 3-D)
      const fileError = validatePathologyAttachment(file);
      if (fileError) return fileError;
    }
    return "";
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    const body = {
      pathologyTypeCode: form.pathologyTypeCode,
      diagnosisCode: form.diagnosisCode || undefined,
      findings: joinFindings(form.sections),
    };
    if (result) {
      dispatch(updatePathologyResultRequest(result.pathologyResultId, body, file, reception.receptionNo));
    } else {
      dispatch(
        createPathologyResultRequest({ ...body, labOrderItemId: itemId, recordedById: actorId }, file, reception.receptionNo),
      );
    }
  }

  function handleConfirm() {
    if (!result) return;
    dispatch(confirmPathologyResultRequest(result.pathologyResultId, { confirmedById: actorId }, reception.receptionNo));
    setConfirmOpen(false);
  }

  const itemLabel = (code: string) => testTypes.options.find((o) => o.value === code)?.label ?? code;

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <header>
        <h3 className="text-sm font-semibold text-slate-800">Pathology Result</h3>
        <p className="text-xs text-slate-500">
          {result
            ? `${confirmed ? "Confirmed" : "Recorded"} · last updated ${formatDateTime(result.updatedAt)}`
            : "Not registered"}
        </p>
      </header>

      {loading ? <p className="text-sm text-slate-400">Loading…</p> : null}
      {loadError ? <Alert>{resolvePathologyResultMessage(loadError)}</Alert> : null}
      {submitError ? <Alert>{resolvePathologyResultMessage(submitError)}</Alert> : null}
      {error ? <Alert>{error}</Alert> : null}

      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        <FormField label="Test Item" required>
          <Select
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            options={pathologyItems.map((i) => ({ value: i.labOrderItemId, label: itemLabel(i.labItemCode) }))}
            disabled={submitting}
          />
        </FormField>

        <FormField label="Pathology Type" required>
          <Select
            value={form.pathologyTypeCode}
            onChange={(e) => setForm((prev) => ({ ...prev, pathologyTypeCode: e.target.value }))}
            options={pathologyTypes.options}
            placeholder={pathologyTypes.loading ? "Loading..." : "Histology / Cytology"}
            disabled={locked}
          />
        </FormField>

        {FINDINGS_SECTIONS.map(({ key, title }) => (
          <FormField key={key} label={title.replace(/[[\]]/g, "")} className="sm:col-span-2">
            <textarea
              value={form.sections[key]}
              onChange={(e) => setSection(key, e.target.value)}
              disabled={locked}
              rows={key === "diagnosis" ? 2 : 3}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </FormField>
        ))}

        <FormField label="Diagnosis Code">
          <CodeSearchInput
            value={form.diagnosisCode}
            onChange={(code) => setForm((prev) => ({ ...prev, diagnosisCode: code }))}
            options={diagnoses.options}
            disabled={locked}
            placeholder="Optional — search diagnosis"
          />
        </FormField>

        <FormField label={result?.attachmentYn === "Y" ? "Replace Attachment" : "Attachment"}>
          <input
            key={fileInputKey}
            type="file"
            accept={ACCEPT}
            disabled={locked}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm text-slate-600"
          />
          <span className="text-xs text-slate-400">JPG, PNG, or PDF · one file</span>
        </FormField>

        {result?.attachmentYn === "Y" ? (
          <div className="sm:col-span-2 space-y-1">
            <p className="text-xs text-slate-500">Current attachment: {result.attachmentFileName}</p>
            {previewUrl ? (
              result.attachmentContentType === "application/pdf" ? (
                <a href={previewUrl} target="_blank" rel="noreferrer" className="text-sm text-sky-600 underline">
                  Open PDF
                </a>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- 인증이 필요한 Blob URL 이라 next/image 최적화 대상이 아니다
                <img src={previewUrl} alt="Pathology attachment" className="max-h-48 rounded-lg border border-slate-200" />
              )
            ) : (
              <p className="text-xs text-slate-400">Loading preview…</p>
            )}
          </div>
        ) : null}

        <FormField label="Recorded By">
          {result ? (
            <p
              className="text-sm text-slate-700"
              title={formatStaffName(result.recordedById, staffNameById, staffLoading).title}
            >
              {formatStaffName(result.recordedById, staffNameById, staffLoading).text}
            </p>
          ) : (
            <LoginActorInput name="recordedById" actorName={actorName} signedIn={signedIn} />
          )}
        </FormField>

        <div className="flex items-end justify-end gap-2">
          {confirmed ? (
            <span
              className="text-sm text-slate-500"
              title={formatStaffName(result?.confirmedById, staffNameById, staffLoading).title}
            >
              Confirmed by {formatStaffName(result?.confirmedById, staffNameById, staffLoading).text} at{" "}
              {formatDateTime(result?.confirmedAt)}
            </span>
          ) : (
            <>
              <Button type="submit" disabled={locked}>
                {result ? "Update" : "Register"}
              </Button>
              {result ? (
                <Button type="button" variant="secondary" disabled={locked || !signedIn} onClick={() => setConfirmOpen(true)}>
                  Confirm
                </Button>
              ) : null}
            </>
          )}
        </div>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Pathology Result"
        message={`Confirm this pathology result (signed in as ${actorName})? A confirmed result can no longer be edited.`}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </section>
  );
}

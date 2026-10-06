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
import { resolveMicrobiologyResultMessage } from "@/features/labimaging/microbiologyresult/messages";
import {
  confirmMicrobiologyResultRequest,
  createMicrobiologyResultRequest,
  fetchMicrobiologyResultsRequest,
  resetMicrobiologyResultState,
  selectMicrobiologyLoadError,
  selectMicrobiologyLoading,
  selectMicrobiologyResults,
  selectMicrobiologySpecimens,
  selectMicrobiologySubmitError,
  selectMicrobiologySubmitting,
  updateMicrobiologyResultRequest,
} from "@/features/labimaging/microbiologyresult/slice";
import {
  CULTURE_STATUS,
  type MicrobiologyResultSummary,
  type MicrobiologySusceptibility,
} from "@/features/labimaging/microbiologyresult/types";

/**
 * 미생물 결과 입력 패널 — UC-RST-02 미생물검사결과등록 (Jira ZP2-14/92, 5차 Phase 3)
 *
 * 흐름: 적합 검체 선택 → 배양상태 → (양성) 균종·원인균 → 항생제 감수성 표 → 관찰 소견 → 저장(중간보고) → 확정(최종보고)
 *
 * ⚠ 입력 가능 여부를 배양상태로 잠근다(서버 ZP2-91 규칙과 같다). 양성이 아니면 균종·감수성 칸을 비활성화하고
 *   보낼 때도 비운다. 화면에서 막아도 서버가 다시 검증한다(LAB077/LAB078).
 * ⚠ 접수당 미생물 결과는 1건이다(5차 제약). 결과가 있으면 새로 등록하지 않고 그 결과를 수정·확정한다.
 * ⚠ 중간보고 이력 테이블은 없다(D4). 01=중간보고, 02=최종보고, 마지막 갱신 시각만 보여준다.
 */
type Props = {
  reception: LabWorklistItem;
  /** 접수의 미생물 항목 (LabResultWorkPanel 이 resultType 으로 골라 넘긴다) */
  microItem: LabResultItem;
};

type FormState = {
  specimenId: string;
  cultureStatusCode: string;
  organismCode: string;
  causativeYn: "" | "Y" | "N";
  observationNote: string;
  susceptibilities: MicrobiologySusceptibility[];
};

const emptyForm: FormState = {
  specimenId: "",
  cultureStatusCode: "",
  organismCode: "",
  causativeYn: "",
  observationNote: "",
  susceptibilities: [],
};

function toForm(result: MicrobiologyResultSummary): FormState {
  return {
    specimenId: result.specimenId,
    cultureStatusCode: result.cultureStatusCode,
    organismCode: result.organismCode ?? "",
    causativeYn: result.causativeYn ?? "",
    observationNote: result.observationNote ?? "",
    susceptibilities: result.susceptibilities,
  };
}

function formatDateTime(value?: string) {
  return value ? value.replace("T", " ").slice(0, 16) : "-";
}

export default function MicrobiologyResultWorkPanel({ reception, microItem }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { actorId, actorName, signedIn } = useLoginActor();
  // 입력자·확정자 empId → 이름 표시용. (직원ID 화면 노출 정리, 2026-10-05)
  const { nameById: staffNameById, loading: staffLoading } = useStaffDirectory();

  const results = useSelector(selectMicrobiologyResults);
  const specimens = useSelector(selectMicrobiologySpecimens);
  const loading = useSelector(selectMicrobiologyLoading);
  const loadError = useSelector(selectMicrobiologyLoadError);
  const submitting = useSelector(selectMicrobiologySubmitting);
  const submitError = useSelector(selectMicrobiologySubmitError);

  const cultureStatuses = useCommonCodeOptions("CULTURE_STATUS_CD");
  const organisms = useCommonCodeOptions("ORGANISM_CD");
  const antibiotics = useCommonCodeOptions("ANTIBIOTIC_CD");
  const susceptibilityResults = useCommonCodeOptions("SUSCEPTIBILITY_RESULT_CD");

  const result = results[0] ?? null;
  const confirmed = result?.resultStatusCode === "02";
  const locked = confirmed || submitting;

  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    dispatch(resetMicrobiologyResultState());
    dispatch(fetchMicrobiologyResultsRequest(reception.receptionNo));
  }, [dispatch, reception.receptionNo]);

  /*
   * 저장된 결과가 바뀌면(첫 조회·저장 후 재조회) 폼을 그 값으로 다시 채운다.
   * ⚠ 결과ID·갱신시각이 바뀔 때만 채운다. 입력하는 도중 목록이 다시 그려져도 입력값이 날아가지 않게 한다.
   */
  const resultKey = result ? `${result.microbiologyResultId}:${result.updatedAt ?? ""}:${result.resultStatusCode}` : "";
  const [appliedKey, setAppliedKey] = useState("");
  if (resultKey !== appliedKey) {
    setAppliedKey(resultKey);
    setForm(result ? toForm(result) : emptyForm);
  }

  const positive = form.cultureStatusCode === CULTURE_STATUS.POSITIVE;
  const canEnterSusceptibility = positive && form.organismCode !== "";
  const fitSpecimens = specimens.filter((s) => s.fitnessStatus === "FIT");

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // 양성이 아니면 균종·원인균·감수성을 비운다(서버 LAB077 규칙).
      if (next.cultureStatusCode !== CULTURE_STATUS.POSITIVE) {
        next.organismCode = "";
        next.causativeYn = "";
        next.susceptibilities = [];
      }
      if (next.organismCode === "") {
        next.causativeYn = "";
        next.susceptibilities = [];
      }
      return next;
    });
    setError("");
  }

  function setRow(index: number, patch: Partial<MicrobiologySusceptibility>) {
    set(
      "susceptibilities",
      form.susceptibilities.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  function validate(): string {
    if (!signedIn) return "Sign in to record this result.";
    if (!result && !form.specimenId) return "Select a fit specimen.";
    if (!form.cultureStatusCode) return "Select a culture status.";
    // 목록에 없는 균종코드는 제출을 막는다. (04번 지시서 Phase 4-1)
    if (!isKnownCode(form.organismCode, organisms.options)) return "Unknown organism code. Please choose one from the list.";
    const codes = form.susceptibilities.map((s) => s.antibioticCode);
    if (codes.some((c) => !c)) return "Enter an antibiotic for every susceptibility row.";
    if (new Set(codes).size !== codes.length) return "The same antibiotic was entered more than once.";
    if (codes.some((c) => !isKnownCode(c, antibiotics.options))) {
      return "Unknown antibiotic code. Please choose one from the list.";
    }
    if (form.susceptibilities.some((s) => !s.susceptibilityResultCode)) return "Select S / I / R for every row.";
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
      cultureStatusCode: form.cultureStatusCode,
      organismCode: form.organismCode || undefined,
      causativeYn: form.causativeYn || undefined,
      observationNote: form.observationNote.trim() || undefined,
      susceptibilities: form.susceptibilities,
    };

    if (result) {
      dispatch(updateMicrobiologyResultRequest(result.microbiologyResultId, body, reception.receptionNo));
    } else {
      dispatch(
        createMicrobiologyResultRequest(
          { ...body, specimenId: form.specimenId, recordedById: actorId },
          reception.receptionNo,
        ),
      );
    }
  }

  function handleConfirm() {
    if (!result) return;
    // 확정자는 로그인 사용자다(UC-RST-05). 서버는 세션 기준으로 기록한다.
    dispatch(confirmMicrobiologyResultRequest(result.microbiologyResultId, { confirmedById: actorId }, reception.receptionNo));
    setConfirmOpen(false);
  }

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Microbiology Result</h3>
          <p className="text-xs text-slate-500">
            Test item {microItem.labItemCode}
            {result
              ? ` · ${confirmed ? "Final report" : "Preliminary report"} · last updated ${formatDateTime(result.updatedAt)}`
              : " · not registered"}
          </p>
        </div>
      </header>

      {loading ? <p className="text-sm text-slate-400">Loading…</p> : null}
      {loadError ? <Alert>{resolveMicrobiologyResultMessage(loadError)}</Alert> : null}
      {submitError ? <Alert>{resolveMicrobiologyResultMessage(submitError)}</Alert> : null}
      {error ? <Alert>{error}</Alert> : null}

      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        <FormField label="Specimen" required>
          {result ? (
            <p className="text-sm text-slate-700">{result.specimenBarcode}</p>
          ) : (
            <Select
              value={form.specimenId}
              onChange={(e) => set("specimenId", e.target.value)}
              options={fitSpecimens.map((s) => ({ value: s.specimenId, label: s.specimenBarcode }))}
              placeholder={fitSpecimens.length ? "Select a fit specimen" : "No fit specimen"}
              disabled={locked}
            />
          )}
        </FormField>

        <FormField label="Culture Status" required>
          <Select
            value={form.cultureStatusCode}
            onChange={(e) => set("cultureStatusCode", e.target.value)}
            options={cultureStatuses.options}
            placeholder={cultureStatuses.loading ? "Loading..." : "Select"}
            disabled={locked}
          />
        </FormField>

        <FormField label="Organism">
          <CodeSearchInput
            value={form.organismCode}
            onChange={(code) => set("organismCode", code)}
            options={organisms.options}
            disabled={locked || !positive}
            placeholder={positive ? "Search organism (blank until identified)" : "Positive culture only"}
          />
        </FormField>

        <FormField label="Causative Organism">
          <Select
            value={form.causativeYn}
            onChange={(e) => set("causativeYn", e.target.value as FormState["causativeYn"])}
            options={[
              { value: "Y", label: "Yes" },
              { value: "N", label: "No" },
            ]}
            placeholder="-"
            disabled={locked || !form.organismCode}
          />
        </FormField>

        <div className="sm:col-span-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Antibiotic Susceptibility</span>
            <Button
              type="button"
              variant="secondary"
              disabled={locked || !canEnterSusceptibility}
              onClick={() =>
                set("susceptibilities", [...form.susceptibilities, { antibioticCode: "", susceptibilityResultCode: "" }])
              }
            >
              Add row
            </Button>
          </div>
          {!canEnterSusceptibility ? (
            <p className="text-xs text-slate-400">Available after a positive culture with an identified organism.</p>
          ) : null}
          {form.susceptibilities.map((row, index) => (
            <div key={index} className="flex flex-wrap items-start gap-2">
              <div className="min-w-48 flex-1">
                <CodeSearchInput
                  value={row.antibioticCode}
                  onChange={(code) => setRow(index, { antibioticCode: code })}
                  options={antibiotics.options}
                  disabled={locked}
                  placeholder="Search antibiotic"
                />
              </div>
              <div className="w-40">
                <Select
                  value={row.susceptibilityResultCode}
                  onChange={(e) => setRow(index, { susceptibilityResultCode: e.target.value })}
                  options={susceptibilityResults.options}
                  placeholder="S / I / R"
                  disabled={locked}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                disabled={locked}
                onClick={() => set("susceptibilities", form.susceptibilities.filter((_, i) => i !== index))}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>

        <FormField label="Observation Note" className="sm:col-span-2">
          <textarea
            value={form.observationNote}
            onChange={(e) => set("observationNote", e.target.value)}
            disabled={locked}
            rows={3}
            maxLength={4000}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 disabled:text-slate-500"
          />
        </FormField>

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
                {result ? "Update (Preliminary)" : "Register (Preliminary)"}
              </Button>
              {result ? (
                <Button type="button" variant="secondary" disabled={locked || !signedIn} onClick={() => setConfirmOpen(true)}>
                  Confirm (Final)
                </Button>
              ) : null}
            </>
          )}
        </div>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Microbiology Result"
        message={`Confirm this result as the final report (signed in as ${actorName})? A confirmed result can no longer be edited.`}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </section>
  );
}

"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, FormField, Input, Select } from "@/components/common";
import ActorField from "@/components/emergency/common/ActorField";
import StaffName from "@/components/emergency/common/StaffName";
import { useActorId } from "@/features/emergency/common/staff";
import { resolveEmergencyMessage } from "@/features/emergency/messages";
import { CODE_GROUP, optionLabel, toCodeOptions } from "@/features/emergency/codes";
import {
  createCprRequest,
  fetchCprRequest,
  selectCprError,
  selectCprItems,
  selectCprLoading,
  selectCprSubmitError,
  selectCprSubmitting,
} from "@/features/emergency/care/cpr/slice";
import {
  CPR_EVENT_TYPE_FALLBACK_OPTIONS,
  CPR_OUTCOME_FALLBACK_OPTIONS,
  type CprEventItemRequest,
} from "@/features/emergency/care/cpr/types";
import {
  fetchAllCommonCodesRequest,
  selectCommonCodeLoaded,
  selectCommonCodesByGroup,
} from "@/features/emergency/commonCode/slice";
import { formatDateTime } from "@/features/emergency/utils";

type CprPanelProps = { receptionNo: string; className?: string };

const initialEvent = { eventTypeCode: "", detail: "", eventAt: "", recordedById: "" };

/**
 * CPR 타임라인 기록 패널 (UC-CARE-05, Jira UD2-23)
 * - CPR 한 건(세션)에 이벤트(압박·제세동 등)를 시간순으로 여러 개 담아 한 번에 등록한다.
 * - 이벤트를 하나씩 "Add Event"로 목록에 담고, 결과(선택)를 정해 "Register CPR Record"로 저장한다.
 * - 이벤트 종류/결과는 admin 공통코드 CPR_EVENT_TYPE_CD / CPR_OUTCOME_CD(없으면 폴백).
 */
export default function CprPanel({ receptionNo, className = "" }: CprPanelProps) {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector(selectCprItems);
  const loading = useSelector(selectCprLoading);
  const error = useSelector(selectCprError);
  const submitting = useSelector(selectCprSubmitting);
  const submitError = useSelector(selectCprSubmitError);
  const commonCodeLoaded = useSelector(selectCommonCodeLoaded);
  const eventTypeCodes = useSelector(selectCommonCodesByGroup(CODE_GROUP.CPR_EVENT_TYPE));
  const outcomeCodes = useSelector(selectCommonCodesByGroup(CODE_GROUP.CPR_OUTCOME));

  const [draft, setDraft] = useState(initialEvent);
  const [events, setEvents] = useState<CprEventItemRequest[]>([]);
  const [outcomeCode, setOutcomeCode] = useState("");
  const [lastCount, setLastCount] = useState(0);
  const [lastReceptionNo, setLastReceptionNo] = useState(receptionNo);
  const recordedById = useActorId(draft.recordedById);

  useEffect(() => {
    if (receptionNo) dispatch(fetchCprRequest(receptionNo));
  }, [dispatch, receptionNo]);

  useEffect(() => {
    if (!commonCodeLoaded) dispatch(fetchAllCommonCodesRequest());
  }, [dispatch, commonCodeLoaded]);

  // 환자가 바뀌면 작성 중이던 이벤트 목록을 버린다.
  if (receptionNo !== lastReceptionNo) {
    setLastReceptionNo(receptionNo);
    setDraft(initialEvent);
    setEvents([]);
    setOutcomeCode("");
  }
  // 등록 성공으로 목록이 늘면 작성 중인 내용을 비운다.
  if (items.length > lastCount) {
    setLastCount(items.length);
    if (!submitting && !submitError) {
      setEvents([]);
      setOutcomeCode("");
      setDraft(initialEvent);
    }
  } else if (items.length < lastCount) {
    setLastCount(items.length);
  }

  const eventTypeOptions = toCodeOptions(eventTypeCodes, CPR_EVENT_TYPE_FALLBACK_OPTIONS);
  const outcomeOptions = toCodeOptions(outcomeCodes, CPR_OUTCOME_FALLBACK_OPTIONS);
  const canAdd = !!draft.eventTypeCode && !!recordedById;
  const canSubmit = !!receptionNo && !submitting && events.length > 0;

  function handleDraftChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setDraft((prev) => ({ ...prev, [name]: value }));
  }

  function handleAdd() {
    if (!canAdd) return;
    setEvents((prev) => [
      ...prev,
      {
        eventTypeCode: draft.eventTypeCode,
        detail: draft.detail.trim() || undefined,
        // datetime-local 값(초 없음)을 ISO 로컬 일시로 맞춘다. 비우면 서버가 현재 시각으로 기록한다.
        eventAt: draft.eventAt ? `${draft.eventAt}:00` : undefined,
        recordedById,
      },
    ]);
    // 기록자는 이어서 입력하기 편하게 남겨둔다.
    setDraft((prev) => ({ ...initialEvent, recordedById: prev.recordedById }));
  }

  function handleSubmit() {
    if (!canSubmit) return;
    dispatch(createCprRequest({ encounterId: receptionNo, outcomeCode: outcomeCode || undefined, events }));
  }

  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
      {/* CPR 타임라인 기록 */}
      <h3 className="mb-3 text-sm font-semibold text-slate-800">CPR Timeline</h3>

      {loading ? (
        // CPR 기록을 불러오는 중입니다...
        <p className="py-4 text-center text-sm text-slate-400">Loading CPR records...</p>
      ) : error ? (
        <Alert variant="error">{resolveEmergencyMessage(error)}</Alert>
      ) : (
        <>
          {items.length > 0 ? (
            <ul className="mb-4 space-y-3">
              {items.map((cpr) => (
                <li key={cpr.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="text-xs font-medium text-sky-600">
                    {/* 시작 / 결과 */}
                    Started {formatDateTime(cpr.startedAt)}
                    {cpr.outcomeCode ? ` · Outcome: ${optionLabel(outcomeOptions, cpr.outcomeCode)}` : ""}
                  </p>
                  <ol className="mt-2 space-y-1">
                    {cpr.timelines.map((t) => (
                      <li key={t.id} className="flex flex-wrap gap-x-2 text-slate-700">
                        <span className="w-28 shrink-0 text-xs text-slate-400">{formatDateTime(t.eventAt)}</span>
                        <span className="font-medium">{optionLabel(eventTypeOptions, t.eventTypeCode)}</span>
                        {t.detail ? <span className="text-slate-500">{t.detail}</span> : null}
                        <span className="text-xs text-slate-400">
                          (<StaffName empId={t.recordedById} />)
                        </span>
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
            </ul>
          ) : (
            // 기록된 CPR이 없습니다.
            <p className="mb-4 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-400">No CPR records yet.</p>
          )}

          {submitError ? <Alert variant="error">{resolveEmergencyMessage(submitError)}</Alert> : null}

          {/* 작성 중인 이벤트 목록 */}
          {events.length > 0 ? (
            <ol className="mb-3 space-y-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              {events.map((ev, idx) => (
                <li key={`${ev.eventTypeCode}-${idx}`} className="flex items-center gap-2">
                  <span>
                    {idx + 1}. {optionLabel(eventTypeOptions, ev.eventTypeCode)}
                    {ev.detail ? ` — ${ev.detail}` : ""} (<StaffName empId={ev.recordedById} />)
                  </span>
                  <button
                    type="button"
                    className="text-rose-600 underline"
                    onClick={() => setEvents((prev) => prev.filter((_, i) => i !== idx))}
                    disabled={submitting}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ol>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {/* 이벤트 종류 */}
            <FormField label="Event Type" required className="w-[180px]">
              <Select
                name="eventTypeCode"
                value={draft.eventTypeCode}
                onChange={handleDraftChange}
                options={eventTypeOptions}
                placeholder="Select"
                disabled={submitting}
              />
            </FormField>
            {/* 상세 */}
            <FormField label="Detail" className="w-[220px]">
              <Input name="detail" value={draft.detail} onChange={handleDraftChange} disabled={submitting} maxLength={500} />
            </FormField>
            {/* 이벤트 시각 (비우면 지금) */}
            <FormField label="Event At" hint="Leave empty to use the current time." className="w-[220px]">
              <Input
                type="datetime-local"
                name="eventAt"
                value={draft.eventAt}
                onChange={handleDraftChange}
                disabled={submitting}
              />
            </FormField>
            {/* 기록자 */}
            <ActorField
              label="Recorded By"
              required
              value={draft.recordedById}
              onChange={(empId) => setDraft((prev) => ({ ...prev, recordedById: empId }))}
              disabled={submitting}
              className="w-[220px]"
            />
          </div>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <Button type="button" onClick={handleAdd} disabled={!canAdd || submitting}>
              {/* 이벤트 추가 */}
              Add Event
            </Button>
            <div className="flex items-end gap-3">
              {/* 결과 (선택) */}
              <FormField label="Outcome" className="w-[160px]">
                <Select
                  value={outcomeCode}
                  onChange={(e) => setOutcomeCode(e.target.value)}
                  options={outcomeOptions}
                  placeholder="(optional)"
                  disabled={submitting}
                />
              </FormField>
              <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
                {/* 등록 중... / CPR 기록 등록 */}
                {submitting ? "Saving..." : "Register CPR Record"}
              </Button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

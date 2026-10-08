"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, FormField, Input } from "@/components/common";
import DownSelect from "@/components/emergency/common/DownSelect";
import ActorField from "@/components/emergency/common/ActorField";
import StaffName from "@/components/emergency/common/StaffName";
import { useActorId } from "@/features/emergency/common/staff";
import { resolveEmergencyMessage } from "@/features/emergency/messages";
import {
  createConsentRequest,
  fetchConsentsRequest,
  selectConsentError,
  selectConsentItems,
  selectConsentLoading,
  selectConsentSubmitError,
  selectConsentSubmitting,
} from "@/features/emergency/care/consent/slice";
import {
  CONSENT_BY_FALLBACK_OPTIONS,
  CONSENT_BY_GROUP_CODE,
  CONSENT_BY_GUARDIAN,
  CONSENT_STATUS_DEFERRED,
  CONSENT_STATUS_FALLBACK_OPTIONS,
  CONSENT_STATUS_GROUP_CODE,
  CONSENT_TYPE_ALLOWED,
  CONSENT_TYPE_FALLBACK_OPTIONS,
  CONSENT_TYPE_GROUP_CODE,
} from "@/features/emergency/care/consent/types";
import {
  fetchAllCommonCodesRequest,
  selectCommonCodeLoaded,
  selectCommonCodesByGroup,
} from "@/features/emergency/commonCode/slice";
import { eventTimeBounds, eventTimeError, useEventTimeLimits } from "@/features/emergency/common/eventTime";
import { formatDateTime } from "@/features/emergency/utils";

type ConsentPanelProps = {
  receptionNo: string;
  className?: string;
};

const initialForm = {
  consentTypeCode: "",
  consentStatusCode: "",
  consentedByCode: "",
  consenterName: "",
  reason: "",
  receivedAt: "",
  recordedById: "",
};

/**
 * 동의 기록 패널 (Jira UD2-25)
 * - 종이로 받은 동의서의 "수령 사실"만 기록한다(서명·파일 없음). 이력이라 수정/삭제는 없고,
 *   유예 후 사후 동의를 받으면 "Agreed"로 새로 기록한다.
 * - 유예(Deferred)는 사유 필수, 보호자(Guardian)는 동의자 이름 필수 — 백엔드 검증과 동일.
 */
export default function ConsentPanel({ receptionNo, className = "" }: ConsentPanelProps) {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector(selectConsentItems);
  const loading = useSelector(selectConsentLoading);
  const error = useSelector(selectConsentError);
  const submitting = useSelector(selectConsentSubmitting);
  const submitError = useSelector(selectConsentSubmitError);
  const commonCodeLoaded = useSelector(selectCommonCodeLoaded);
  const typeCodes = useSelector(selectCommonCodesByGroup(CONSENT_TYPE_GROUP_CODE));
  const statusCodes = useSelector(selectCommonCodesByGroup(CONSENT_STATUS_GROUP_CODE));
  const byCodes = useSelector(selectCommonCodesByGroup(CONSENT_BY_GROUP_CODE));

  const [form, setForm] = useState(initialForm);
  const recordedById = useActorId(form.recordedById, "STAFF");
  const [lastReceptionNo, setLastReceptionNo] = useState(receptionNo);
  const [lastCount, setLastCount] = useState(0);

  useEffect(() => {
    if (receptionNo) {
      dispatch(fetchConsentsRequest(receptionNo));
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
  // 등록 성공으로 목록이 늘면 입력폼을 비운다.
  if (items.length > lastCount) {
    setLastCount(items.length);
    if (!submitting && !submitError) {
      setForm(initialForm);
    }
  } else if (items.length < lastCount) {
    setLastCount(items.length);
  }

  const toOptions = (
    codes: typeof typeCodes,
    fallback: ReadonlyArray<{ value: string; label: string }>,
  ): Array<{ value: string; label: string }> =>
    codes.length > 0
      ? codes.filter((code) => code.useYn !== "N").map((code) => ({ value: code.codeValue, label: code.codeName }))
      : [...fallback];

  const typeOptions = toOptions(typeCodes, CONSENT_TYPE_FALLBACK_OPTIONS).filter((o) =>
    CONSENT_TYPE_ALLOWED.includes(o.value),
  );
  const statusOptions = toOptions(statusCodes, CONSENT_STATUS_FALLBACK_OPTIONS);
  const byOptions = toOptions(byCodes, CONSENT_BY_FALLBACK_OPTIONS);

  const labelOf = (options: Array<{ value: string; label: string }>, code: string) =>
    options.find((o) => o.value === code)?.label ?? code;

  const guardianSelected = form.consentedByCode === CONSENT_BY_GUARDIAN;
  const deferredSelected = form.consentStatusCode === CONSENT_STATUS_DEFERRED;
  // 수령 일시는 접수 이후·현재 이전이어야 하고, 귀가·사망·자의퇴원이면 퇴실 결정 이전이어야 한다(비우면 지금)
  const timeLimits = useEventTimeLimits(receptionNo);
  const timeBounds = eventTimeBounds(timeLimits);
  const timeError = eventTimeError(form.receivedAt, timeLimits);
  const canSubmit =
    !timeError &&
    !!receptionNo &&
    !submitting &&
    !!form.consentTypeCode &&
    !!form.consentStatusCode &&
    !!form.consentedByCode &&
    !!recordedById &&
    (!guardianSelected || !!form.consenterName.trim()) &&
    (!deferredSelected || !!form.reason.trim());

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit() {
    if (!canSubmit) return;
    dispatch(
      createConsentRequest({
        encounterId: receptionNo,
        consentTypeCode: form.consentTypeCode,
        consentStatusCode: form.consentStatusCode,
        consentedByCode: form.consentedByCode,
        consenterName: form.consenterName.trim() || undefined,
        reason: form.reason.trim() || undefined,
        // datetime-local 값(초 없음)을 ISO 로컬 일시로 맞춘다. 비우면 서버가 현재 시각으로 기록한다.
        receivedAt: form.receivedAt ? `${form.receivedAt}:00` : undefined,
        recordedById,
      }),
    );
  }

  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
      {/* 동의 기록 */}
      <h3 className="mb-1 text-sm font-semibold text-slate-800">Consent Records</h3>
      {/* 종이 동의서를 받은 사실만 기록합니다(서명·파일은 저장하지 않음). */}
      <p className="mb-3 text-xs text-slate-400">
        Records only that a paper consent form was received. Signatures and files are not stored.
      </p>

      {loading ? (
        // 동의 기록을 불러오는 중입니다...
        <p className="py-4 text-center text-sm text-slate-400">Loading consent records...</p>
      ) : error ? (
        <Alert variant="error">{resolveEmergencyMessage(error)}</Alert>
      ) : (
        <>
          {items.length > 0 ? (
            <ul className="mb-4 space-y-2">
              {items.map((item) => (
                <li key={item.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="text-xs font-medium text-sky-600">
                    {labelOf(typeOptions, item.consentTypeCode)} · {labelOf(statusOptions, item.consentStatusCode)}
                  </p>
                  <p className="text-slate-800">
                    {labelOf(byOptions, item.consentedByCode)}
                    {item.consenterName ? ` (${item.consenterName})` : ""}
                  </p>
                  {item.reason ? <p className="whitespace-pre-wrap text-slate-600">{item.reason}</p> : null}
                  <p className="mt-1 text-xs text-slate-400">
                    {/* 수령 / 기록자 */}
                    Received {formatDateTime(item.receivedAt)} · Recorded by <StaffName empId={item.recordedById} />
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            // 기록된 동의가 없습니다.
            <p className="mb-4 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-400">
              No consent records yet.
            </p>
          )}

          {submitError ? <Alert variant="error">{resolveEmergencyMessage(submitError)}</Alert> : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* 동의서 종류 */}
            <DownSelect
              label="Consent Type"
              required
              value={form.consentTypeCode}
              onChange={(consentTypeCode) => setForm((prev) => ({ ...prev, consentTypeCode }))}
              options={typeOptions}
              placeholder="Select"
              disabled={submitting}
            />
            {/* 동의 여부 */}
            <DownSelect
              label="Consent Status"
              required
              value={form.consentStatusCode}
              onChange={(consentStatusCode) => setForm((prev) => ({ ...prev, consentStatusCode }))}
              options={statusOptions}
              placeholder="Select"
              disabled={submitting}
            />
            {/* 동의자 */}
            <DownSelect
              label="Consented By"
              required
              value={form.consentedByCode}
              onChange={(consentedByCode) => setForm((prev) => ({ ...prev, consentedByCode }))}
              options={byOptions}
              placeholder="Select"
              disabled={submitting}
            />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* 동의자 이름 (보호자일 때 필수) */}
            <FormField label="Consenter Name" required={guardianSelected}>
              <Input
                name="consenterName"
                value={form.consenterName}
                onChange={handleChange}
                disabled={submitting}
                maxLength={100}
              />
            </FormField>
            {/* 수령 일시 (비우면 지금) */}
            <FormField label="Received At" hint={timeError || "Leave empty to use the current time."}>
              <Input
                type="datetime-local"
                name="receivedAt"
                value={form.receivedAt}
                min={timeBounds.min}
                max={timeBounds.max}
                onChange={handleChange}
                disabled={submitting}
                className={timeError ? "border-rose-400 focus:border-rose-400 focus:ring-rose-100" : ""}
              />
            </FormField>
            {/* 기록자 */}
            <ActorField
              label="Recorded By"
              role="STAFF"
              required
              value={form.recordedById}
              onChange={(empId) => setForm((prev) => ({ ...prev, recordedById: empId }))}
              disabled={submitting}
            />
          </div>

          {/* 사유 (유예일 때 필수) */}
          <FormField label="Reason" required={deferredSelected} className="mt-3">
            <textarea
              name="reason"
              value={form.reason}
              onChange={handleChange}
              disabled={submitting}
              maxLength={500}
              className="w-full min-h-[64px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </FormField>

          <div className="mt-3 flex justify-end">
            <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
              {/* 등록 중... / 동의 기록 등록 */}
              {submitting ? "Saving..." : "Register Consent"}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}

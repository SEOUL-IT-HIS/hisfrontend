"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { resolveLabScheduleMessage } from "@/features/labimaging/labschedule/messages";
import {
  createLabScheduleRequest,
  rescheduleLabScheduleRequest,
  resetLabScheduleResult,
  selectLabScheduleCreating,
  selectLabScheduleCreateError,
  selectLastCreatedLabSchedule,
} from "@/features/labimaging/labschedule/slice";
import {
  SCHEDULE_TYPE_OPTIONS,
  RESERVATION_YN_OPTIONS,
} from "@/features/labimaging/labschedule/types";
import { selectSelectedLabReception } from "@/features/labimaging/laborder/slice";

/**
 * 검사 일정 등록/재등록 폼.
 * - labReceptionId 는 경로변수(useParams)로 받는다. (등록/재등록의 대상 접수)
 * - 대상 접수 상세는 목록/상세에서 넘어온 store 컨텍스트(selectedReception)로 표시한다(없으면 ID만).
 * - 구분(신규/재등록)에 따라 dispatch 하는 액션이 달라진다.
 *   · 신규: createLabScheduleRequest({ labReceptionId, scheduleTypeCode, ... })
 *   · 재등록: rescheduleLabScheduleRequest(labReceptionId, { ... })  (scheduleTypeCode 없음)
 *   ※ 재등록은 이미 latest 일정이 있는 접수 대상이다. 미일정 접수에 재등록하면 백엔드가 LAB014 로 실패.
 */

const inputClass =
  "h-10 rounded-lg border border-slate-200 px-3 outline-none focus:border-sky-400 disabled:bg-slate-50";

const initialForm = {
  scheduleTypeCode: "GENERAL",
  scheduledAt: "",
  reservationYn: "N" as "Y" | "N",
  guidanceNote: "",
  confirmedById: "",
};

type FormState = typeof initialForm;
type FieldErrors = Partial<Record<keyof FormState, string>>;
type Mode = "create" | "reschedule";

export default function LabScheduleRegisterForm() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const params = useParams<{ labReceptionId: string }>();
  const labReceptionId = params?.labReceptionId ?? "";

  const selected = useSelector(selectSelectedLabReception);
  // URL 의 대상과 store 컨텍스트가 일치할 때만 상세를 표시 (다른 접수 stale 방지)
  const reception =
    selected && selected.labReceptionId === labReceptionId ? selected : null;

  const creating = useSelector(selectLabScheduleCreating);
  const createError = useSelector(selectLabScheduleCreateError);
  const lastCreated = useSelector(selectLastCreatedLabSchedule);

  const [mode, setMode] = useState<Mode>("create");
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [lastResetId, setLastResetId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(resetLabScheduleResult());
  }, [dispatch]);

  // 등록 성공 시 폼 초기화 (외부 store 변화에 따른 로컬 state 조정은 렌더 중 1회)
  const createdId = lastCreated?.labScheduleId ?? null;
  if (createdId && createdId !== lastResetId) {
    setLastResetId(createdId);
    setForm(initialForm);
    setErrors({});
  }

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (mode === "create" && !form.scheduleTypeCode)
      next.scheduleTypeCode = "일정구분을 선택해주세요.";
    if (!form.scheduledAt) next.scheduledAt = "확정일시는 필수입니다.";
    if (!form.confirmedById.trim())
      next.confirmedById = "확정담당자ID는 필수입니다.";
    return next;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!labReceptionId) return;
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (mode === "create") {
      dispatch(
        createLabScheduleRequest({
          labReceptionId,
          scheduleTypeCode: form.scheduleTypeCode,
          scheduledAt: form.scheduledAt,
          reservationYn: form.reservationYn,
          guidanceNote: form.guidanceNote.trim() || undefined,
          confirmedById: form.confirmedById.trim(),
        }),
      );
    } else {
      dispatch(
        rescheduleLabScheduleRequest(labReceptionId, {
          scheduledAt: form.scheduledAt,
          reservationYn: form.reservationYn,
          guidanceNote: form.guidanceNote.trim() || undefined,
          confirmedById: form.confirmedById.trim(),
        }),
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 대상 접수 컨텍스트 */}
      <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
        <p className="text-slate-500">대상 접수</p>
        <p className="mt-1 font-medium text-slate-700">
          {reception
            ? `${reception.receptionNo} · 환자 ${reception.patientNo}`
            : `접수ID ${labReceptionId || "(없음)"}`}
        </p>
      </div>

      {lastCreated ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {mode === "create"
            ? "검사 일정이 등록되었습니다."
            : "검사 일정이 재등록되었습니다."}{" "}
          (일정ID: {lastCreated.labScheduleId})
        </p>
      ) : null}
      {createError ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {resolveLabScheduleMessage(createError)}
        </p>
      ) : null}

      {/* 구분: 신규 / 재등록 */}
      <div className="flex gap-2">
        {(["create", "reschedule"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            disabled={creating}
            className={`rounded-lg px-4 py-1.5 text-sm transition-colors ${
              mode === m
                ? "bg-sky-500 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {m === "create" ? "신규 등록" : "재등록"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {mode === "create" ? (
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">
              일정구분 <span className="text-rose-500">*</span>
            </span>
            <select
              name="scheduleTypeCode"
              value={form.scheduleTypeCode}
              onChange={handleChange}
              disabled={creating}
              className={inputClass}
            >
              {SCHEDULE_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {errors.scheduleTypeCode ? (
              <span className="text-xs text-rose-500">{errors.scheduleTypeCode}</span>
            ) : null}
          </label>
        ) : null}

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">
            확정일시 <span className="text-rose-500">*</span>
          </span>
          <input
            type="datetime-local"
            name="scheduledAt"
            value={form.scheduledAt}
            onChange={handleChange}
            disabled={creating}
            className={inputClass}
          />
          {errors.scheduledAt ? (
            <span className="text-xs text-rose-500">{errors.scheduledAt}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">예약여부</span>
          <select
            name="reservationYn"
            value={form.reservationYn}
            onChange={handleChange}
            disabled={creating}
            className={inputClass}
          >
            {RESERVATION_YN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">
            확정담당자ID <span className="text-rose-500">*</span>
          </span>
          <input
            name="confirmedById"
            value={form.confirmedById}
            onChange={handleChange}
            maxLength={20}
            disabled={creating}
            placeholder="예: STF00021"
            className={inputClass}
          />
          {errors.confirmedById ? (
            <span className="text-xs text-rose-500">{errors.confirmedById}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium text-slate-700">안내메모</span>
          <textarea
            name="guidanceNote"
            value={form.guidanceNote}
            onChange={handleChange}
            maxLength={500}
            disabled={creating}
            rows={3}
            placeholder="선택 입력"
            className="rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-sky-400 disabled:bg-slate-50"
          />
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => router.push("/labimaging/laborder/receptions")}
          disabled={creating}
          className="h-10 rounded-lg border border-slate-200 bg-white px-5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          목록으로
        </button>
        <button
          type="submit"
          disabled={creating || !labReceptionId}
          className="h-10 rounded-lg bg-sky-500 px-5 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50"
        >
          {creating ? "처리 중..." : mode === "create" ? "일정 등록" : "일정 재등록"}
        </button>
      </div>
    </form>
  );
}

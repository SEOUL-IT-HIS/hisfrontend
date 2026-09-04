"use client";

import { useEffect, useState, type ChangeEvent, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import {
  Alert,
  FormActions,
  FormField,
  Input,
  Panel,
  Select,
} from "@/components/common";
import { resolveLabScheduleMessage } from "@/features/labimaging/labschedule/messages";
import {
  createLabScheduleRequest,
  rescheduleLabScheduleRequest,
  resetLabScheduleResult,
  selectLabScheduleCreating,
  selectLabScheduleCreateError,
  selectLastCreatedLabSchedule,
} from "@/features/labimaging/labschedule/slice";
import { RESERVATION_YN_OPTIONS } from "@/features/labimaging/labschedule/types";
import { selectSelectedLabReception } from "@/features/labimaging/laborder/slice";

/**
 * 검사 일정 등록/재등록 폼. 워크리스트 오른쪽 패널의 "Schedule" 탭에서만 쓴다.
 *
 * ⚠ 단독 페이지(/labimaging/labschedule/register/{id})는 없앴다. (2026-09-03)
 *   워크리스트 탭이 같은 일을 하고 있어 두 벌을 유지할 이유가 없었다.
 *
 * ⚠ 신규/재등록을 담당자가 버튼으로 고르지 않는다. 대상 접수에 일정이 있으면 재등록이다.
 *   예전에는 New/Reschedule 버튼이 있었는데, defaultMode 가 useState 초기값이라
 *   등록에 성공해도 모드가 "New" 에 머물렀다. 그 상태로 다시 저장하면
 *   latest_yn='Y' 조건부 UNIQUE(UX_LSCH_LATEST)에 걸린다.
 *   (검사는 LAB027 로 걸러졌지만 영상은 같은 자리에서 500 이 났다 — 영상 쪽과 함께 정리)
 *
 * ⚠ hasSchedule 은 useState 로 받지 않는다. 워크리스트가 저장 후 목록을 다시 불러오므로
 *   프롭이 갱신되고, 모드가 저절로 재등록으로 넘어간다. 상태로 들고 있으면 그게 안 된다.
 *
 * - 입력 UI 는 전역 공통 컴포넌트(@/components/common)를 사용한다. 자체 스타일을 만들지 않는다.
 *
 * ⚠ 안내메모(textarea)만 공통 컴포넌트가 없어 직접 마크업한다.
 *   공통 Textarea 가 생기면 교체할 것. 스타일은 공통 Input 과 맞춰 뒀다.
 */
const textareaClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 disabled:text-slate-500";

const initialForm = {
  scheduledAt: "",
  reservationYn: "N" as "Y" | "N",
  guidanceNote: "",
  confirmedById: "",
};

type FormState = typeof initialForm;
type FieldErrors = Partial<Record<keyof FormState, string>>;

type Props = {
  /** 대상 접수ID. */
  labReceptionId?: string;
  /** 대상 접수에 이미 일정이 있는지. 있으면 재등록으로 동작한다. */
  hasSchedule?: boolean;
  /** 대상 접수 요약 박스 표시 여부. 패널에서는 위쪽 머리말과 겹쳐서 끈다. */
  showReceptionSummary?: boolean;
  /** 취소 동작. 없으면 워크리스트로 이동한다. */
  onCancel?: () => void;
};

export default function LabScheduleRegisterForm({
  labReceptionId: labReceptionIdProp,
  hasSchedule = false,
  showReceptionSummary = true,
  onCancel,
}: Props = {}) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const labReceptionId = labReceptionIdProp ?? "";

  const selected = useSelector(selectSelectedLabReception);
  // URL 의 대상과 store 컨텍스트가 일치할 때만 상세를 표시 (다른 접수 stale 방지)
  const reception =
    selected && selected.labReceptionId === labReceptionId ? selected : null;

  const creating = useSelector(selectLabScheduleCreating);
  const createError = useSelector(selectLabScheduleCreateError);
  const lastCreated = useSelector(selectLastCreatedLabSchedule);

  /** 일정이 이미 있으면 재등록이다. 담당자가 고르는 값이 아니다. */
  const isReschedule = hasSchedule;
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
    if (!form.scheduledAt) next.scheduledAt = "Scheduled test date and time is required.";
    if (!form.confirmedById.trim())
      next.confirmedById = "Confirming staff ID is required.";
    return next;
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!labReceptionId) return;
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!isReschedule) {
      dispatch(
        createLabScheduleRequest({
          labReceptionId,
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
      {/* 대상 접수 컨텍스트 — 패널에서는 위쪽 머리말이 같은 내용을 보여줘서 끈다. */}
      {showReceptionSummary ? (
        <Panel className="px-4 py-3 text-sm">
          <p className="text-slate-500">Target Reception</p>
          <p className="mt-1 font-semibold text-slate-700">
            {reception
              ? reception.receptionNo
              : `Reception ID ${labReceptionId || "(none)"}`}
          </p>
        </Panel>
      ) : null}

      {lastCreated ? (
        <Alert variant="success">
          {isReschedule
            ? "Lab schedule has been rescheduled."
            : "Lab schedule has been registered."}{" "}
          (Schedule ID: {lastCreated.labScheduleId})
        </Alert>
      ) : null}
      {createError ? <Alert>{resolveLabScheduleMessage(createError)}</Alert> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Scheduled Test"
          required
          hint="Date and time the test will be performed. The confirmation time is recorded automatically."
        >
          <Input
            /*
              ⚠ 날짜 위젯의 안내 문구("연도-월-일 --:--")는 우리 문자열이 아니라 브라우저가 그린다.
                Chrome 은 그 언어를 element 가 물려받은 lang 으로 정하는데, 루트가 <html lang="ko"> 라
                한글로 나온다. 루트 레이아웃은 공용(가이드 5.3)이라 손대지 않고 이 입력칸에만 en 을 건다.
            */
            lang="en"
            type="datetime-local"
            name="scheduledAt"
            value={form.scheduledAt}
            onChange={handleChange}
            disabled={creating}
          />
          {errors.scheduledAt ? (
            <span className="text-xs text-rose-500">{errors.scheduledAt}</span>
          ) : null}
        </FormField>

        <FormField label="Appointment">
          <Select
            name="reservationYn"
            value={form.reservationYn}
            onChange={handleChange}
            options={[...RESERVATION_YN_OPTIONS]}
            disabled={creating}
          />
        </FormField>

        <FormField label="Confirming Staff ID" required>
          <Input
            name="confirmedById"
            value={form.confirmedById}
            onChange={handleChange}
            maxLength={20}
            disabled={creating}
            placeholder="e.g. STF00021"
          />
          {errors.confirmedById ? (
            <span className="text-xs text-rose-500">{errors.confirmedById}</span>
          ) : null}
        </FormField>

        <FormField label="Notes" className="sm:col-span-2">
          <textarea
            name="guidanceNote"
            value={form.guidanceNote}
            onChange={handleChange}
            maxLength={500}
            disabled={creating}
            rows={3}
            placeholder="Optional"
            className={textareaClass}
          />
        </FormField>
      </div>

      <FormActions
        // 패널에서는 화면을 옮기면 안 되므로 호출하는 쪽이 동작을 넘긴다.
        onCancel={onCancel ?? (() => router.push("/labimaging/laborder/worklist"))}
        cancelLabel={onCancel ? "Clear Selection" : "To Worklist"}
        submitLabel={isReschedule ? "Reschedule" : "Schedule"}
        loadingLabel="Processing…"
        loading={creating}
        submitDisabled={!labReceptionId}
      />
    </form>
  );
}

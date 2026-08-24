"use client";

import { useEffect, useState, type ChangeEvent, type SubmitEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import {
  Alert,
  Button,
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
 * 검사 일정 등록/재등록 폼.
 *
 * 두 곳에서 쓴다.
 *   1) 단독 페이지  /labimaging/labschedule/register/{labReceptionId}
 *   2) 워크리스트 오른쪽 패널의 "일정" 탭
 *
 * ⚠ 그래서 대상 접수를 프롭으로도, URL 경로변수로도 받을 수 있게 열어 뒀다.
 *   패널 안에서는 URL 이 /worklist 라 경로변수가 없다. 프롭이 없으면 예전처럼 useParams 로 떨어진다.
 *   (기존 페이지 라우트는 프롭 없이 호출되므로 동작이 그대로다)
 *
 * - 구분(신규/재등록)에 따라 dispatch 하는 액션이 달라진다.
 *   · 신규: createLabScheduleRequest({ labReceptionId, ... })
 *   · 재등록: rescheduleLabScheduleRequest(labReceptionId, { ... })
 *   ※ 재등록은 이미 latest 일정이 있는 접수 대상이다. 미일정 접수에 재등록하면 백엔드가 LAB014 로 실패.
 *   ※ 반대로 이미 일정이 있는 접수에 "신규 등록"을 하면 latest_yn='Y' 조건부 UNIQUE 에 걸린다.
 *     그래서 호출하는 쪽이 defaultMode 로 맞는 모드를 골라준다.
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
type Mode = "create" | "reschedule";

type Props = {
  /** 대상 접수ID. 없으면 URL 경로변수에서 읽는다. (단독 페이지로 열렸을 때) */
  labReceptionId?: string;
  /** 신규/재등록 초기 선택. 대상 접수에 일정이 있으면 "reschedule" 을 넘긴다. */
  defaultMode?: Mode;
  /** 대상 접수 요약 박스 표시 여부. 패널에서는 위쪽 머리말과 겹쳐서 끈다. */
  showReceptionSummary?: boolean;
  /** 취소 동작. 없으면 워크리스트로 이동한다. */
  onCancel?: () => void;
};

export default function LabScheduleRegisterForm({
  labReceptionId: labReceptionIdProp,
  defaultMode = "create",
  showReceptionSummary = true,
  onCancel,
}: Props = {}) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  /*
   * 훅은 조건부로 부를 수 없어 useParams 는 항상 호출한다.
   * 패널에서 쓸 때는 URL 이 /worklist 라 값이 없고, 그때는 프롭이 대상을 정한다.
   */
  const params = useParams<{ labReceptionId: string }>();
  const labReceptionId = labReceptionIdProp ?? params?.labReceptionId ?? "";

  const selected = useSelector(selectSelectedLabReception);
  // URL 의 대상과 store 컨텍스트가 일치할 때만 상세를 표시 (다른 접수 stale 방지)
  const reception =
    selected && selected.labReceptionId === labReceptionId ? selected : null;

  const creating = useSelector(selectLabScheduleCreating);
  const createError = useSelector(selectLabScheduleCreateError);
  const lastCreated = useSelector(selectLastCreatedLabSchedule);

  const [mode, setMode] = useState<Mode>(defaultMode);
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
    if (!form.scheduledAt) next.scheduledAt = "검사 예정일시는 필수입니다.";
    if (!form.confirmedById.trim())
      next.confirmedById = "확정담당자ID는 필수입니다.";
    return next;
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!labReceptionId) return;
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (mode === "create") {
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
          <p className="text-slate-500">대상 접수</p>
          <p className="mt-1 font-semibold text-slate-700">
            {reception
              ? `${reception.receptionNo} · 환자 ${reception.patientNo}`
              : `접수ID ${labReceptionId || "(없음)"}`}
          </p>
        </Panel>
      ) : null}

      {lastCreated ? (
        <Alert variant="success">
          {mode === "create"
            ? "검사 일정이 등록되었습니다."
            : "검사 일정이 재등록되었습니다."}{" "}
          (일정ID: {lastCreated.labScheduleId})
        </Alert>
      ) : null}
      {createError ? <Alert>{resolveLabScheduleMessage(createError)}</Alert> : null}

      {/* 구분: 신규 / 재등록 */}
      <div className="flex gap-2">
        {(["create", "reschedule"] as Mode[]).map((m) => (
          <Button
            key={m}
            variant={mode === m ? "primary" : "secondary"}
            onClick={() => setMode(m)}
            disabled={creating}
          >
            {m === "create" ? "신규 등록" : "재등록"}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="검사 예정일시"
          required
          hint="검사를 시행할 날짜와 시각입니다. 확정한 시각은 자동 기록됩니다."
        >
          <Input
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

        <FormField label="예약여부">
          <Select
            name="reservationYn"
            value={form.reservationYn}
            onChange={handleChange}
            options={[...RESERVATION_YN_OPTIONS]}
            disabled={creating}
          />
        </FormField>

        <FormField label="확정담당자ID" required>
          <Input
            name="confirmedById"
            value={form.confirmedById}
            onChange={handleChange}
            maxLength={20}
            disabled={creating}
            placeholder="예: STF00021"
          />
          {errors.confirmedById ? (
            <span className="text-xs text-rose-500">{errors.confirmedById}</span>
          ) : null}
        </FormField>

        <FormField label="안내메모" className="sm:col-span-2">
          <textarea
            name="guidanceNote"
            value={form.guidanceNote}
            onChange={handleChange}
            maxLength={500}
            disabled={creating}
            rows={3}
            placeholder="선택 입력"
            className={textareaClass}
          />
        </FormField>
      </div>

      <FormActions
        // 패널에서는 화면을 옮기면 안 되므로 호출하는 쪽이 동작을 넘긴다.
        onCancel={onCancel ?? (() => router.push("/labimaging/laborder/worklist"))}
        cancelLabel={onCancel ? "선택 해제" : "워크리스트로"}
        submitLabel={mode === "create" ? "일정 등록" : "일정 재등록"}
        loading={creating}
        submitDisabled={!labReceptionId}
      />
    </form>
  );
}

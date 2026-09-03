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
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import { resolveImageScheduleMessage } from "@/features/labimaging/imagingschedule/messages";
import {
  createImageScheduleRequest,
  rescheduleImageScheduleRequest,
  resetImageScheduleResult,
  selectImageScheduleCreating,
  selectImageScheduleCreateError,
  selectLastCreatedImageSchedule,
} from "@/features/labimaging/imagingschedule/slice";
import { RESERVATION_YN_OPTIONS } from "@/features/labimaging/imagingschedule/types";
import { selectSelectedImageReception } from "@/features/labimaging/imagingorder/slice";

/**
 * 영상 일정 등록/재등록 폼. (labschedule 폼과 동일 구조, 영상 필드)
 * - imageReceptionId 는 경로변수(useParams).
 * - 신규/재등록 필드 세트는 동일하다(영상 재등록 DTO 도 room/equipment/금기 포함).
 *   차이는 dispatch 액션뿐: create(body 에 imageReceptionId) vs reschedule(경로변수).
 *   ※ 재등록은 이미 latest 일정이 있는 접수 대상. 미일정 접수에 재등록 시 백엔드 LAB016 실패.
 * - 입력 UI 는 전역 공통 컴포넌트(@/components/common)를 사용한다. 자체 스타일을 만들지 않는다.
 *
 * ⚠ 금기사항 메모(textarea)만 공통 컴포넌트가 없어 직접 마크업한다.
 *   공통 Textarea 가 생기면 교체할 것. 스타일은 공통 Input 과 맞춰 뒀다.
 */

const textareaClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 disabled:text-slate-500";

const initialForm = {
  roomCode: "",
  equipmentCode: "",
  scheduledAt: "",
  reservationYn: "N" as "Y" | "N",
  contraindicationCheckCode: "",
  contraindicationNote: "",
  confirmedById: "",
};

type FormState = typeof initialForm;
type FieldErrors = Partial<Record<keyof FormState, string>>;
type Mode = "create" | "reschedule";

type Props = {
  /** 대상 접수ID. 없으면 URL 경로변수에서 읽는다. (단독 페이지로 열렸을 때) */
  imageReceptionId?: string;
  /** 신규/재등록 초기 선택. 대상 접수에 일정이 있으면 "reschedule" 을 넘긴다. */
  defaultMode?: Mode;
  /** 대상 접수 요약 박스 표시 여부. 워크리스트 패널에서는 위쪽 머리말과 겹쳐서 끈다. */
  showReceptionSummary?: boolean;
  /** 취소 동작. 없으면 접수 목록으로 이동한다. */
  onCancel?: () => void;
};

export default function ImageScheduleRegisterForm({
  imageReceptionId: imageReceptionIdProp,
  defaultMode = "create",
  showReceptionSummary = true,
  onCancel,
}: Props = {}) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  /*
   * 훅은 조건부로 부를 수 없어 useParams 는 항상 호출한다.
   * 워크리스트 패널에서 쓸 때는 URL 이 /worklist 라 값이 없고, 그때는 프롭이 대상을 정한다.
   * (검사 쪽 LabScheduleRegisterForm 과 같은 구조)
   */
  const params = useParams<{ imageReceptionId: string }>();
  const imageReceptionId = imageReceptionIdProp ?? params?.imageReceptionId ?? "";

  const selected = useSelector(selectSelectedImageReception);
  const reception =
    selected && selected.imageReceptionId === imageReceptionId ? selected : null;

  const creating = useSelector(selectImageScheduleCreating);
  const createError = useSelector(selectImageScheduleCreateError);
  const lastCreated = useSelector(selectLastCreatedImageSchedule);

  const examRooms = useCommonCodeOptions("EXAM_ROOM_CD");
  const equipments = useCommonCodeOptions("EQUIPMENT_CD");
  const contraindications = useCommonCodeOptions("CONTRAINDICATION_CD");

  const [mode, setMode] = useState<Mode>(defaultMode);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [lastResetId, setLastResetId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(resetImageScheduleResult());
  }, [dispatch]);

  const createdId = lastCreated?.imageScheduleId ?? null;
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
    if (!form.roomCode.trim()) next.roomCode = "Exam room code is required.";
    if (!form.equipmentCode.trim()) next.equipmentCode = "Equipment code is required.";
    if (!form.scheduledAt) next.scheduledAt = "Scheduled imaging date and time is required.";
    if (!form.contraindicationCheckCode.trim())
      next.contraindicationCheckCode = "Contraindication check result is required.";
    if (!form.confirmedById.trim())
      next.confirmedById = "Confirming staff ID is required.";
    return next;
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!imageReceptionId) return;
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const body = {
      roomCode: form.roomCode.trim(),
      equipmentCode: form.equipmentCode.trim(),
      scheduledAt: form.scheduledAt,
      reservationYn: form.reservationYn,
      contraindicationCheckCode: form.contraindicationCheckCode.trim(),
      contraindicationNote: form.contraindicationNote.trim() || undefined,
      confirmedById: form.confirmedById.trim(),
    };

    if (mode === "create") {
      dispatch(createImageScheduleRequest({ imageReceptionId, ...body }));
    } else {
      dispatch(rescheduleImageScheduleRequest(imageReceptionId, body));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 워크리스트 패널에서는 위쪽 머리말이 같은 내용을 보여줘서 끈다. */}
      {showReceptionSummary ? (
        <Panel className="px-4 py-3 text-sm">
          <p className="text-slate-500">Target Reception</p>
          <p className="mt-1 font-semibold text-slate-700">
            {reception
              ? reception.receptionNo
              : `Reception ID ${imageReceptionId || "(none)"}`}
          </p>
        </Panel>
      ) : null}

      {lastCreated ? (
        <Alert variant="success">
          {mode === "create"
            ? "Imaging schedule has been registered."
            : "Imaging schedule has been rescheduled."}{" "}
          (Schedule ID: {lastCreated.imageScheduleId})
        </Alert>
      ) : null}
      {createError ? (
        <Alert>{resolveImageScheduleMessage(createError)}</Alert>
      ) : null}

      <div className="flex gap-2">
        {(["create", "reschedule"] as Mode[]).map((m) => (
          <Button
            key={m}
            variant={mode === m ? "primary" : "secondary"}
            onClick={() => setMode(m)}
            disabled={creating}
          >
            {m === "create" ? "New" : "Reschedule"}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Exam Room Code" required>
          <Select
            name="roomCode"
            value={form.roomCode}
            onChange={handleChange}
            options={examRooms.options}
            placeholder={examRooms.loading ? "Loading..." : "Select"}
            disabled={creating || examRooms.loading}
          />
          {errors.roomCode ? (
            <span className="text-xs text-rose-500">{errors.roomCode}</span>
          ) : null}
          {examRooms.error ? (
            <span className="text-xs text-rose-500">{examRooms.error}</span>
          ) : null}
        </FormField>

        <FormField label="Equipment Code" required>
          <Select
            name="equipmentCode"
            value={form.equipmentCode}
            onChange={handleChange}
            options={equipments.options}
            placeholder={equipments.loading ? "Loading..." : "Select"}
            disabled={creating || equipments.loading}
          />
          {errors.equipmentCode ? (
            <span className="text-xs text-rose-500">{errors.equipmentCode}</span>
          ) : null}
          {equipments.error ? (
            <span className="text-xs text-rose-500">{equipments.error}</span>
          ) : null}
        </FormField>

        <FormField
          label="Scheduled Imaging"
          required
          hint="Date and time the imaging will be performed. The confirmation time is recorded automatically."
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

        <FormField label="Contraindication Result" required>
          <Select
            name="contraindicationCheckCode"
            value={form.contraindicationCheckCode}
            onChange={handleChange}
            options={contraindications.options}
            placeholder={contraindications.loading ? "Loading..." : "Select"}
            disabled={creating || contraindications.loading}
          />
          {errors.contraindicationCheckCode ? (
            <span className="text-xs text-rose-500">
              {errors.contraindicationCheckCode}
            </span>
          ) : null}
          {contraindications.error ? (
            <span className="text-xs text-rose-500">{contraindications.error}</span>
          ) : null}
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

        <FormField label="Contraindication Notes" className="sm:col-span-2">
          <textarea
            name="contraindicationNote"
            value={form.contraindicationNote}
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
        onCancel={onCancel ?? (() => router.push("/labimaging/imagingorder/receptions"))}
        cancelLabel={onCancel ? "Clear Selection" : "To List"}
        submitLabel={mode === "create" ? "Schedule" : "Reschedule"}
        loadingLabel="Processing…"
        loading={creating}
        submitDisabled={!imageReceptionId}
      />
    </form>
  );
}

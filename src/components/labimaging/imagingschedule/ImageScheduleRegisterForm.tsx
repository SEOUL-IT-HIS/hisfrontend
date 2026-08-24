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

export default function ImageScheduleRegisterForm() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const params = useParams<{ imageReceptionId: string }>();
  const imageReceptionId = params?.imageReceptionId ?? "";

  const selected = useSelector(selectSelectedImageReception);
  const reception =
    selected && selected.imageReceptionId === imageReceptionId ? selected : null;

  const creating = useSelector(selectImageScheduleCreating);
  const createError = useSelector(selectImageScheduleCreateError);
  const lastCreated = useSelector(selectLastCreatedImageSchedule);

  const examRooms = useCommonCodeOptions("EXAM_ROOM_CD");
  const equipments = useCommonCodeOptions("EQUIPMENT_CD");
  const contraindications = useCommonCodeOptions("CONTRAINDICATION_CD");

  const [mode, setMode] = useState<Mode>("create");
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
    if (!form.roomCode.trim()) next.roomCode = "촬영실코드는 필수입니다.";
    if (!form.equipmentCode.trim()) next.equipmentCode = "촬영장비코드는 필수입니다.";
    if (!form.scheduledAt) next.scheduledAt = "촬영 예정일시는 필수입니다.";
    if (!form.contraindicationCheckCode.trim())
      next.contraindicationCheckCode = "금기확인결과코드는 필수입니다.";
    if (!form.confirmedById.trim())
      next.confirmedById = "확정담당자ID는 필수입니다.";
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
      <Panel className="px-4 py-3 text-sm">
        <p className="text-slate-500">대상 접수</p>
        <p className="mt-1 font-semibold text-slate-700">
          {reception
            ? `${reception.receptionNo} · 환자 ${reception.patientNo}`
            : `접수ID ${imageReceptionId || "(없음)"}`}
        </p>
      </Panel>

      {lastCreated ? (
        <Alert variant="success">
          {mode === "create"
            ? "영상 일정이 등록되었습니다."
            : "영상 일정이 재등록되었습니다."}{" "}
          (일정ID: {lastCreated.imageScheduleId})
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
            {m === "create" ? "신규 등록" : "재등록"}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="촬영실코드" required>
          <Select
            name="roomCode"
            value={form.roomCode}
            onChange={handleChange}
            options={examRooms.options}
            placeholder={examRooms.loading ? "불러오는 중..." : "선택"}
            disabled={creating || examRooms.loading}
          />
          {errors.roomCode ? (
            <span className="text-xs text-rose-500">{errors.roomCode}</span>
          ) : null}
          {examRooms.error ? (
            <span className="text-xs text-rose-500">{examRooms.error}</span>
          ) : null}
        </FormField>

        <FormField label="촬영장비코드" required>
          <Select
            name="equipmentCode"
            value={form.equipmentCode}
            onChange={handleChange}
            options={equipments.options}
            placeholder={equipments.loading ? "불러오는 중..." : "선택"}
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
          label="촬영 예정일시"
          required
          hint="촬영을 시행할 날짜와 시각입니다. 확정한 시각은 자동 기록됩니다."
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

        <FormField label="금기확인결과코드" required>
          <Select
            name="contraindicationCheckCode"
            value={form.contraindicationCheckCode}
            onChange={handleChange}
            options={contraindications.options}
            placeholder={contraindications.loading ? "불러오는 중..." : "선택"}
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

        <FormField label="금기사항 확인 메모" className="sm:col-span-2">
          <textarea
            name="contraindicationNote"
            value={form.contraindicationNote}
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
        onCancel={() => router.push("/labimaging/imagingorder/receptions")}
        cancelLabel="목록으로"
        submitLabel={mode === "create" ? "일정 등록" : "일정 재등록"}
        loading={creating}
        submitDisabled={!imageReceptionId}
      />
    </form>
  );
}

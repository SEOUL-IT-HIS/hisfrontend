"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
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
import CommonCodeSelect from "@/components/commonCode/CommonCodeSelect";

/**
 * 영상 일정 등록/재등록 폼. (labschedule 폼과 동일 구조, 영상 필드)
 * - imageReceptionId 는 경로변수(useParams).
 * - 신규/재등록 필드 세트는 동일하다(영상 재등록 DTO 도 room/equipment/금기 포함).
 *   차이는 dispatch 액션뿐: create(body 에 imageReceptionId) vs reschedule(경로변수).
 *   ※ 재등록은 이미 latest 일정이 있는 접수 대상. 미일정 접수에 재등록 시 백엔드 LAB016 실패.
 */

const inputClass =
  "h-10 rounded-lg border border-slate-200 px-3 outline-none focus:border-sky-400 disabled:bg-slate-50";

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

  function handleSubmit(e: FormEvent) {
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
      <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
        <p className="text-slate-500">대상 접수</p>
        <p className="mt-1 font-medium text-slate-700">
          {reception
            ? `${reception.receptionNo} · 환자 ${reception.patientNo}`
            : `접수ID ${imageReceptionId || "(없음)"}`}
        </p>
      </div>

      {lastCreated ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {mode === "create"
            ? "영상 일정이 등록되었습니다."
            : "영상 일정이 재등록되었습니다."}{" "}
          (일정ID: {lastCreated.imageScheduleId})
        </p>
      ) : null}
      {createError ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {resolveImageScheduleMessage(createError)}
        </p>
      ) : null}

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
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">
            촬영실코드 <span className="text-rose-500">*</span>
          </span>
          <CommonCodeSelect
            groupCode="EXAM_ROOM_CD"
            name="roomCode"
            value={form.roomCode}
            onChange={handleChange}
            disabled={creating}
            className={inputClass}
          />
          {errors.roomCode ? (
            <span className="text-xs text-rose-500">{errors.roomCode}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">
            촬영장비코드 <span className="text-rose-500">*</span>
          </span>
          <CommonCodeSelect
            groupCode="EQUIPMENT_CD"
            name="equipmentCode"
            value={form.equipmentCode}
            onChange={handleChange}
            disabled={creating}
            className={inputClass}
          />
          {errors.equipmentCode ? (
            <span className="text-xs text-rose-500">{errors.equipmentCode}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">
            촬영 예정일시 <span className="text-rose-500">*</span>
          </span>
          <input
            type="datetime-local"
            name="scheduledAt"
            value={form.scheduledAt}
            onChange={handleChange}
            disabled={creating}
            className={inputClass}
          />
          <span className="text-xs text-slate-500">
            촬영을 시행할 날짜와 시각입니다. 확정한 시각은 자동 기록됩니다.
          </span>
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
            금기확인결과코드 <span className="text-rose-500">*</span>
          </span>
          <CommonCodeSelect
            groupCode="CONTRAINDICATION_CD"
            name="contraindicationCheckCode"
            value={form.contraindicationCheckCode}
            onChange={handleChange}
            disabled={creating}
            className={inputClass}
          />
          {errors.contraindicationCheckCode ? (
            <span className="text-xs text-rose-500">
              {errors.contraindicationCheckCode}
            </span>
          ) : null}
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
          <span className="font-medium text-slate-700">금기사항 확인 메모</span>
          <textarea
            name="contraindicationNote"
            value={form.contraindicationNote}
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
          onClick={() => router.push("/labimaging/imagingorder/receptions")}
          disabled={creating}
          className="h-10 rounded-lg border border-slate-200 bg-white px-5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          목록으로
        </button>
        <button
          type="submit"
          disabled={creating || !imageReceptionId}
          className="h-10 rounded-lg bg-sky-500 px-5 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50"
        >
          {creating ? "처리 중..." : mode === "create" ? "일정 등록" : "일정 재등록"}
        </button>
      </div>
    </form>
  );
}

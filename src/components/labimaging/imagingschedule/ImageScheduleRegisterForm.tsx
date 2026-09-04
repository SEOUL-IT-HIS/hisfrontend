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
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import type { CommonCodeOption } from "@/features/commonCode/hooks/useCommonCodeOptions";
import { resolveImageScheduleMessage } from "@/features/labimaging/imagingschedule/messages";
import {
  createImageScheduleRequest,
  fetchImageScheduleItemsRequest,
  rescheduleImageScheduleRequest,
  resetImageScheduleState,
  selectImageScheduleCreating,
  selectImageScheduleCreateError,
  selectImageScheduleItems,
  selectImageScheduleItemsError,
  selectImageScheduleItemsLoading,
  selectLastCreatedImageSchedule,
} from "@/features/labimaging/imagingschedule/slice";
import {
  RESERVATION_YN_OPTIONS,
  type ImageScheduleItem,
} from "@/features/labimaging/imagingschedule/types";
import { selectSelectedImageReception } from "@/features/labimaging/imagingorder/slice";

/**
 * 영상 일정 등록/재등록 — 촬영항목 목록 + 항목별 일정 폼 (2단 구조).
 *
 * ⚠ 일정은 접수가 아니라 촬영항목마다 1건이다. (2026-09-03 변경)
 *   CT·MRI·초음파는 서로 다른 방과 장비를 쓰고 같은 시각에 할 수 없다.
 *   예전에는 접수 단위라 항목이 셋이어도 촬영실·장비·시각을 하나만 정할 수 있었고,
 *   그 하나가 나머지 둘에도 적용된 것처럼 기록됐다.
 *
 * ⚠ 그래서 화면이 폼 하나에서 2단으로 바뀌었다. 검체 판정 패널과 같은 구조다 —
 *   위에서 대상을 고르고 아래 폼에서 그 대상만 처리한다.
 *
 * ⚠ 신규/재등록을 버튼으로 고르지 않는다. 고른 항목에 일정이 있으면 재등록, 없으면 신규다.
 *   담당자가 고를 이유가 없는 값이고, 잘못 고르면 UNIQUE 제약(UX_ISCH_LATEST)에 걸린다.
 *   (예전에 이 버튼 때문에 "처리 중 오류가 발생했습니다" 500 이 났다)
 *
 * ⚠ 단독 페이지(/labimaging/imagingschedule/register/{id})는 없앴다. (2026-09-03)
 *   워크리스트 Schedule 탭이 같은 일을 하고 있어 두 벌을 유지할 이유가 없었다.
 *   그래서 대상 접수는 프롭으로만 받는다.
 *
 * ⚠ 입력 UI 는 전역 공통 컴포넌트(@/components/common)를 사용한다. 자체 스타일을 만들지 않는다.
 *   금기사항 메모(textarea)만 공통 컴포넌트가 없어 직접 마크업한다.
 */

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

const textareaClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 disabled:text-slate-500";

/** 공통코드값 → 코드명. 아직 못 불러왔거나 사전에 없는 값이면 코드값을 그대로 보여준다. */
function toCodeLabel(options: CommonCodeOption[], code?: string) {
  if (!code) return "-";
  return options.find((opt) => opt.value === code)?.label ?? code;
}

/** ISO 문자열 → "YYYY-MM-DD HH:mm" */
function formatDateTime(value?: string) {
  if (!value) return "-";
  return value.replace("T", " ").slice(0, 16);
}

type Props = {
  /** 대상 접수ID. */
  imageReceptionId?: string;
  /** 항목 목록 조회에 쓰는 접수번호. 없으면 store 컨텍스트에서 읽는다. */
  receptionNo?: string;
  /** 대상 접수 요약 박스 표시 여부. 워크리스트 패널에서는 위쪽 머리말과 겹쳐서 끈다. */
  showReceptionSummary?: boolean;
  /** 취소 동작. 없으면 접수 목록으로 이동한다. */
  onCancel?: () => void;
};

export default function ImageScheduleRegisterForm({
  imageReceptionId: imageReceptionIdProp,
  receptionNo: receptionNoProp,
  showReceptionSummary = true,
  onCancel,
}: Props = {}) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const imageReceptionId = imageReceptionIdProp ?? "";

  const selected = useSelector(selectSelectedImageReception);
  const reception =
    selected && selected.imageReceptionId === imageReceptionId ? selected : null;

  /** 항목 목록은 접수번호로 조회한다. 워크리스트가 프롭으로 넘겨준다. */
  const receptionNo = receptionNoProp ?? reception?.receptionNo ?? "";

  const items = useSelector(selectImageScheduleItems);
  const itemsLoading = useSelector(selectImageScheduleItemsLoading);
  const itemsError = useSelector(selectImageScheduleItemsError);
  const creating = useSelector(selectImageScheduleCreating);
  const createError = useSelector(selectImageScheduleCreateError);
  const lastCreated = useSelector(selectLastCreatedImageSchedule);

  const examRooms = useCommonCodeOptions("EXAM_ROOM_CD");
  const equipments = useCommonCodeOptions("EQUIPMENT_CD");
  const contraindications = useCommonCodeOptions("CONTRAINDICATION_CD");
  const imageItems = useCommonCodeOptions("IMG_ITEM_CD");

  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});

  /*
   * 접수가 바뀌면 이전 접수의 항목·결과·오류를 지우고 새로 불러온다.
   * 접수번호가 아직 없으면(단독 진입 등) 조회하지 않는다 — 빈 값으로 부르면 400 이 난다.
   */
  useEffect(() => {
    dispatch(resetImageScheduleState());
    if (receptionNo) {
      dispatch(fetchImageScheduleItemsRequest(receptionNo));
    }
  }, [dispatch, receptionNo]);

  /*
   * 등록·재조정이 끝나면 항목 목록을 다시 불러온다.
   *
   * ⚠ 이게 없으면 방금 일정을 잡은 항목이 계속 "Not scheduled" 로 남는다.
   *   서버가 응답으로 주는 건 저장된 일정 1건이라, 목록의 나머지 줄과 진행도(1/3)는 다시 받아야 맞다.
   *
   * ⚠ 위 효과와 합치지 않는다. 합치면 접수를 고를 때와 저장했을 때가 같은 의존성에 묶여
   *   접수를 바꾸는 순간 resetImageScheduleState 까지 다시 돌아 방금 받은 목록을 지운다.
   */
  const lastScheduleId = lastCreated?.imageScheduleId ?? null;
  useEffect(() => {
    if (lastScheduleId && receptionNo) {
      dispatch(fetchImageScheduleItemsRequest(receptionNo));
    }
  }, [dispatch, receptionNo, lastScheduleId]);

  const selectedItem =
    items.find((i) => i.imageOrderItemId === selectedItemId) ?? null;
  const unscheduled = items.filter((i) => !i.schedule);

  /** 고른 항목에 일정이 이미 있으면 재등록이다. 담당자가 고르는 값이 아니다. */
  const isReschedule = Boolean(selectedItem?.schedule);

  /**
   * 항목을 고른다. 일정이 이미 있으면 그 값을 폼에 채워 재조정할 수 있게 한다.
   * ⚠ 확정담당자ID는 채우지 않는다. 재조정을 실제로 하는 사람은 원래 확정자와 다를 수 있다.
   */
  function handleSelectItem(item: ImageScheduleItem) {
    setSelectedItemId(item.imageOrderItemId);
    setErrors({});

    if (item.schedule) {
      setForm({
        roomCode: item.schedule.roomCode,
        equipmentCode: item.schedule.equipmentCode,
        // datetime-local 은 "YYYY-MM-DDTHH:mm" 만 받는다. 서버가 주는 초 단위는 잘라낸다.
        scheduledAt: item.schedule.scheduledAt.slice(0, 16),
        reservationYn: item.schedule.reservationYn,
        contraindicationCheckCode: item.schedule.contraindicationCheckCode,
        contraindicationNote: item.schedule.contraindicationNote ?? "",
        confirmedById: "",
      });
    } else {
      setForm(initialForm);
    }
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
    if (!imageReceptionId || !selectedItem) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const body = {
      imageOrderItemId: selectedItem.imageOrderItemId,
      roomCode: form.roomCode.trim(),
      equipmentCode: form.equipmentCode.trim(),
      scheduledAt: form.scheduledAt,
      reservationYn: form.reservationYn,
      contraindicationCheckCode: form.contraindicationCheckCode.trim(),
      contraindicationNote: form.contraindicationNote.trim() || undefined,
      confirmedById: form.confirmedById.trim(),
    };

    if (isReschedule) {
      dispatch(rescheduleImageScheduleRequest(imageReceptionId, body));
    } else {
      dispatch(createImageScheduleRequest({ imageReceptionId, ...body }));
    }

    setSelectedItemId("");
    setForm(initialForm);
    setErrors({});
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
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

      {itemsError ? <Alert>{resolveImageScheduleMessage(itemsError)}</Alert> : null}
      {createError ? <Alert>{resolveImageScheduleMessage(createError)}</Alert> : null}
      {lastCreated ? (
        <Alert variant="success">
          {toCodeLabel(imageItems.options, lastCreated.imageItemCode)} —{" "}
          {formatDateTime(lastCreated.scheduledAt)} (
          {toCodeLabel(examRooms.options, lastCreated.roomCode)})
        </Alert>
      ) : null}

      {/* ---------- 촬영항목 목록 ---------- */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-slate-700">
          Imaging Items{" "}
          {itemsLoading ? "" : `(${unscheduled.length} of ${items.length} pending)`}
        </p>

        {itemsLoading ? (
          <p className="text-sm text-slate-400">Loading imaging items...</p>
        ) : items.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
            This reception has no imaging items.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {/* 값이 여러 칸 나란히 있어 머리글이 없으면 무엇이 무엇인지 알 수 없다. */}
            <li className="flex items-center gap-3 bg-slate-50/70 px-4 py-2 text-xs font-medium text-slate-400">
              <span className="h-2.5 w-2.5 shrink-0" />
              <span className="w-28 shrink-0">Item</span>
              <span className="w-36 shrink-0">Scheduled</span>
              <span className="w-28 shrink-0">Room</span>
              <span className="flex-1">Equipment</span>
            </li>

            {items.map((item) => {
              const isSelected = item.imageOrderItemId === selectedItemId;
              return (
                <li key={item.imageOrderItemId}>
                  {/*
                    ⚠ 일정이 있는 항목도 고를 수 있다. 그게 재조정이다.
                      검체 판정과 달리 일정은 되돌릴 수 있는 작업이라 잠그지 않는다.
                  */}
                  <button
                    type="button"
                    disabled={creating}
                    onClick={() => handleSelectItem(item)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                      isSelected
                        ? "bg-sky-50 text-slate-800"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        isSelected ? "bg-sky-500" : "bg-slate-200"
                      }`}
                    />
                    <span className="w-28 shrink-0 font-semibold">
                      {toCodeLabel(imageItems.options, item.imageItemCode)}
                    </span>
                    <span className="w-36 shrink-0">
                      {item.schedule ? (
                        formatDateTime(item.schedule.scheduledAt)
                      ) : (
                        <span className="text-slate-300">Not scheduled</span>
                      )}
                    </span>
                    <span className="w-28 shrink-0 text-slate-500">
                      {item.schedule
                        ? toCodeLabel(examRooms.options, item.schedule.roomCode)
                        : "-"}
                    </span>
                    <span className="flex-1 text-slate-500">
                      {item.schedule
                        ? toCodeLabel(equipments.options, item.schedule.equipmentCode)
                        : "-"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ---------- 항목별 일정 입력 ---------- */}
      {selectedItem === null ? (
        items.length > 0 ? (
          <p className="text-sm text-slate-400">
            {unscheduled.length === 0
              ? "All imaging items are scheduled. Select one to reschedule."
              : "Select an imaging item above to schedule it."}
          </p>
        ) : null
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <p className="text-sm text-slate-500">
            {isReschedule ? "Rescheduling" : "Scheduling"}{" "}
            <span className="font-semibold text-slate-800">
              {toCodeLabel(imageItems.options, selectedItem.imageItemCode)}
            </span>
          </p>

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
            </FormField>

            <FormField
              label="Scheduled Imaging"
              required
              hint="Date and time the imaging will be performed. The confirmation time is recorded automatically."
            >
              <Input
                /*
                  ⚠ 날짜 위젯의 안내 문구("연도-월-일 --:--")는 우리 문자열이 아니라 브라우저가 그린다.
                    루트가 <html lang="ko"> 라 한글로 나오는데, 루트 레이아웃은 공용(가이드 5.3)이라
                    손대지 않고 이 입력칸에만 en 을 건다.
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
            onCancel={onCancel ?? (() => router.push("/labimaging/imagingorder/worklist"))}
            cancelLabel={onCancel ? "Clear Selection" : "To Worklist"}
            submitLabel={isReschedule ? "Reschedule" : "Schedule"}
            loadingLabel="Processing…"
            loading={creating}
            submitDisabled={!imageReceptionId}
          />
        </form>
      )}
    </div>
  );
}

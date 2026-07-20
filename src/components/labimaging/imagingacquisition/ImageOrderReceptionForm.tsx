"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { resolveImagingAcquisitionMessage } from "@/features/labimaging/imagingacquisition/messages";
import {
  createImageOrderRequest,
  resetImageOrderResult,
  selectImageOrderCreateError,
  selectImageOrderCreating,
  selectLastCreatedImageOrder,
} from "@/features/labimaging/imagingacquisition/slice";
import type {
  ImageOrderCreateRequest,
  ImageOrderItemRequest,
} from "@/features/labimaging/imagingacquisition/types";
import {
  TREAT_TYPE_OPTIONS,
  URGENCY_YN_OPTIONS,
} from "@/features/labimaging/imagingacquisition/types";

/** 스칼라 입력 필드 초기값 (촬영항목 목록은 별도 state) */
const initialForm = {
  imageOrderNo: "",
  systemCode: "",
  patientNo: "",
  physicianNo: "",
  treatTypeCode: "",
  urgencyYn: "N" as "Y" | "N",
  receivedById: "",
};

type FormState = typeof initialForm;
type FieldErrors = Partial<Record<keyof FormState | "orderItems", string>>;

const inputClass =
  "h-10 rounded-lg border border-slate-200 px-3 outline-none focus:border-sky-400 disabled:bg-slate-50";

/**
 * 영상 오더 접수 폼 (UC-IMG-01 / Jira ZP2-19)
 * - labspecimen 과 동일 패턴. 제출 시 createImageOrderRequest 액션만 dispatch (가이드 10.3)
 * TODO: 서버 통신 결과 표시는 공통 Toast 로 이관 예정 (가이드 15.3, 리더 관리 공통 컴포넌트).
 */
export default function ImageOrderReceptionForm() {
  const dispatch = useDispatch<AppDispatch>();
  const creating = useSelector(selectImageOrderCreating);
  const createError = useSelector(selectImageOrderCreateError);
  const lastCreated = useSelector(selectLastCreatedImageOrder);

  const [form, setForm] = useState<FormState>(initialForm);
  const [items, setItems] = useState<ImageOrderItemRequest[]>([
    { imageItemCode: "" },
  ]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [lastResetId, setLastResetId] = useState<string | null>(null);

  // 진입 시 이전 결과 상태 초기화
  useEffect(() => {
    dispatch(resetImageOrderResult());
  }, [dispatch]);

  // 접수 성공 시 입력값 초기화. 외부(store) 값 변화에 따른 로컬 state 조정은 렌더 중 수행한다.
  // (React 권장 패턴 — 새 오더ID 일 때 1회만 초기화하여 무한 렌더 방지)
  const createdId = lastCreated?.imageOrderId ?? null;
  if (createdId && createdId !== lastResetId) {
    setLastResetId(createdId);
    setForm(initialForm);
    setItems([{ imageItemCode: "" }]);
    setErrors({});
  }

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleItemChange(index: number, value: string) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { imageItemCode: value } : item)),
    );
  }

  function addItemRow() {
    setItems((prev) => [...prev, { imageItemCode: "" }]);
  }

  function removeItemRow(index: number) {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!form.imageOrderNo.trim()) next.imageOrderNo = "오더번호는 필수입니다.";
    if (!form.systemCode.trim()) next.systemCode = "시스템코드는 필수입니다.";
    if (!form.patientNo.trim()) next.patientNo = "환자번호는 필수입니다.";
    if (!form.treatTypeCode) next.treatTypeCode = "진료유형을 선택해주세요.";
    if (!form.receivedById.trim()) next.receivedById = "접수자ID는 필수입니다.";
    if (items.every((item) => !item.imageItemCode.trim())) {
      next.orderItems = "촬영항목을 최소 1건 입력해주세요.";
    }
    return next;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const request: ImageOrderCreateRequest = {
      imageOrderNo: form.imageOrderNo.trim(),
      systemCode: form.systemCode.trim(),
      patientNo: form.patientNo.trim(),
      physicianNo: form.physicianNo.trim() || undefined,
      treatTypeCode: form.treatTypeCode,
      urgencyYn: form.urgencyYn,
      receivedById: form.receivedById.trim(),
      orderItems: items
        .filter((item) => item.imageItemCode.trim())
        .map((item) => ({ imageItemCode: item.imageItemCode.trim() })),
    };

    dispatch(createImageOrderRequest(request));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {lastCreated ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          영상 접수가 생성되었습니다. (접수번호: {lastCreated.receptionNo})
        </p>
      ) : null}
      {createError ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {resolveImagingAcquisitionMessage(createError)}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">
            오더번호 <span className="text-rose-500">*</span>
          </span>
          <input
            name="imageOrderNo"
            value={form.imageOrderNo}
            onChange={handleChange}
            maxLength={20}
            disabled={creating}
            placeholder="예: EXT-IO-20260715-001"
            className={inputClass}
          />
          {errors.imageOrderNo ? (
            <span className="text-xs text-rose-500">{errors.imageOrderNo}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">
            시스템코드 <span className="text-rose-500">*</span>
          </span>
          <input
            name="systemCode"
            value={form.systemCode}
            onChange={handleChange}
            maxLength={10}
            disabled={creating}
            placeholder="예: GR2"
            className={inputClass}
          />
          {errors.systemCode ? (
            <span className="text-xs text-rose-500">{errors.systemCode}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">
            환자번호 <span className="text-rose-500">*</span>
          </span>
          <input
            name="patientNo"
            value={form.patientNo}
            onChange={handleChange}
            maxLength={20}
            disabled={creating}
            placeholder="예: P00012345"
            className={inputClass}
          />
          {errors.patientNo ? (
            <span className="text-xs text-rose-500">{errors.patientNo}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">처방의번호</span>
          <input
            name="physicianNo"
            value={form.physicianNo}
            onChange={handleChange}
            maxLength={20}
            disabled={creating}
            placeholder="선택 입력"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">
            진료유형 <span className="text-rose-500">*</span>
          </span>
          <select
            name="treatTypeCode"
            value={form.treatTypeCode}
            onChange={handleChange}
            disabled={creating}
            className={inputClass}
          >
            <option value="">선택</option>
            {TREAT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.treatTypeCode ? (
            <span className="text-xs text-rose-500">{errors.treatTypeCode}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">긴급여부</span>
          <select
            name="urgencyYn"
            value={form.urgencyYn}
            onChange={handleChange}
            disabled={creating}
            className={inputClass}
          >
            {URGENCY_YN_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium text-slate-700">
            접수자ID <span className="text-rose-500">*</span>
          </span>
          <input
            name="receivedById"
            value={form.receivedById}
            onChange={handleChange}
            maxLength={20}
            disabled={creating}
            placeholder="예: staff-uuid-001"
            className={inputClass}
          />
          {errors.receivedById ? (
            <span className="text-xs text-rose-500">{errors.receivedById}</span>
          ) : null}
        </label>
      </div>

      {/* 촬영항목 목록 (동적 행 추가/삭제) */}
      <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700">
            촬영항목 <span className="text-rose-500">*</span>
          </p>
          <button
            type="button"
            onClick={addItemRow}
            disabled={creating}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            + 항목 추가
          </button>
        </div>

        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              value={item.imageItemCode}
              onChange={(e) => handleItemChange(index, e.target.value)}
              maxLength={20}
              disabled={creating}
              placeholder="촬영항목코드 (예: CT_BRAIN)"
              className={`${inputClass} flex-1`}
            />
            <button
              type="button"
              onClick={() => removeItemRow(index)}
              disabled={creating || items.length <= 1}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-500 hover:bg-slate-50 disabled:opacity-40"
              aria-label="항목 삭제"
            >
              삭제
            </button>
          </div>
        ))}
        {errors.orderItems ? (
          <span className="text-xs text-rose-500">{errors.orderItems}</span>
        ) : null}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={creating}
          className="h-10 rounded-lg bg-sky-500 px-5 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50"
        >
          {creating ? "접수 중..." : "접수"}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { resolveLabSpecimenMessage } from "@/features/labimaging/labspecimen/messages";
import {
  createLabOrderRequest,
  resetLabOrderResult,
  selectLabOrderCreateError,
  selectLabOrderCreating,
  selectLastCreatedLabOrder,
} from "@/features/labimaging/labspecimen/slice";
import type {
  LabOrderCreateRequest,
  LabOrderItemRequest,
} from "@/features/labimaging/labspecimen/types";
import {
  TREAT_TYPE_OPTIONS,
  URGENCY_YN_OPTIONS,
} from "@/features/labimaging/labspecimen/types";

/** 스칼라 입력 필드 초기값 (항목 목록은 별도 state) */
const initialForm = {
  labOrderNo: "",
  systemCode: "",
  patientNo: "",
  physicianNo: "",
  treatTypeCode: "",
  urgencyYn: "N" as "Y" | "N",
  receivedById: "",
};

type FormState = typeof initialForm;
/** 필드별 인라인 검증 메시지 (가이드 15.3: 검증은 필드 하단 인라인) */
type FieldErrors = Partial<Record<keyof FormState | "orderItems", string>>;

const inputClass =
  "h-10 rounded-lg border border-slate-200 px-3 outline-none focus:border-sky-400 disabled:bg-slate-50";

/**
 * 검사 오더 접수 폼 (UC-SPC-01 / Jira ZP2-12)
 *
 * - presentational 입력 + 검증만 담당하고, 제출 시 slice 의 createLabOrderRequest 액션만 dispatch 한다.
 *   (컴포넌트에서 axios 직접 호출 금지 — 가이드 10.3)
 * - 서버 통신 결과는 slice 상태(creating/createError/lastCreated)를 selector 로 읽어 표시한다.
 * TODO: 서버 통신 결과 표시는 공통 Toast 로 이관 예정 (가이드 15.3). 공통 Toast 는 리더 관리
 *       공통 컴포넌트라 신규 생성하지 않고, 도입 전까지 인라인 결과 영역으로 대체한다.
 */
export default function LabOrderReceptionForm() {
  const dispatch = useDispatch<AppDispatch>();
  const creating = useSelector(selectLabOrderCreating);
  const createError = useSelector(selectLabOrderCreateError);
  const lastCreated = useSelector(selectLastCreatedLabOrder);

  const [form, setForm] = useState<FormState>(initialForm);
  const [items, setItems] = useState<LabOrderItemRequest[]>([{ labItemCode: "" }]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [lastResetId, setLastResetId] = useState<string | null>(null);

  // 진입 시 이전 화면에서 남은 결과 상태 초기화 (가이드 21.6 상태 관리 취지)
  useEffect(() => {
    dispatch(resetLabOrderResult());
  }, [dispatch]);

  // 접수 성공 시 입력값 초기화 (재접수 대비).
  // 외부(store) 값 변화에 따른 로컬 state 조정은 effect 가 아니라 렌더 중 수행한다.
  // (React 권장 패턴 — 새 오더ID 일 때 1회만 초기화하여 무한 렌더 방지)
  const createdId = lastCreated?.labOrderId ?? null;
  if (createdId && createdId !== lastResetId) {
    setLastResetId(createdId);
    setForm(initialForm);
    setItems([{ labItemCode: "" }]);
    setErrors({});
  }

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleItemChange(index: number, value: string) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { labItemCode: value } : item)),
    );
  }

  function addItemRow() {
    setItems((prev) => [...prev, { labItemCode: "" }]);
  }

  function removeItemRow(index: number) {
    // 최소 1건은 유지한다 (백엔드 @NotEmpty)
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  /** 백엔드 @NotBlank/@NotEmpty 와 동일 기준으로 인라인 검증한다. */
  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!form.labOrderNo.trim()) next.labOrderNo = "오더번호는 필수입니다.";
    if (!form.systemCode.trim()) next.systemCode = "시스템코드는 필수입니다.";
    if (!form.patientNo.trim()) next.patientNo = "환자번호는 필수입니다.";
    if (!form.treatTypeCode) next.treatTypeCode = "진료유형을 선택해주세요.";
    if (!form.receivedById.trim()) next.receivedById = "접수자ID는 필수입니다.";
    if (items.every((item) => !item.labItemCode.trim())) {
      next.orderItems = "검사항목을 최소 1건 입력해주세요.";
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

    const request: LabOrderCreateRequest = {
      labOrderNo: form.labOrderNo.trim(),
      systemCode: form.systemCode.trim(),
      patientNo: form.patientNo.trim(),
      physicianNo: form.physicianNo.trim() || undefined,
      treatTypeCode: form.treatTypeCode,
      urgencyYn: form.urgencyYn,
      receivedById: form.receivedById.trim(),
      // 빈 행은 제거하고 유효 항목만 전송
      orderItems: items
        .filter((item) => item.labItemCode.trim())
        .map((item) => ({ labItemCode: item.labItemCode.trim() })),
    };

    // 컴포넌트는 액션만 dispatch — 실제 API 호출은 saga 가 수행 (가이드 10.3)
    dispatch(createLabOrderRequest(request));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 서버 통신 결과 (성공/실패) — 공통 Toast 도입 전 인라인 대체 영역 */}
      {lastCreated ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          검사 접수가 생성되었습니다. (접수번호: {lastCreated.receptionNo})
        </p>
      ) : null}
      {createError ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {resolveLabSpecimenMessage(createError)}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">
            오더번호 <span className="text-rose-500">*</span>
          </span>
          <input
            name="labOrderNo"
            value={form.labOrderNo}
            onChange={handleChange}
            maxLength={20}
            disabled={creating}
            placeholder="예: EXT-LO-20260715-001"
            className={inputClass}
          />
          {errors.labOrderNo ? (
            <span className="text-xs text-rose-500">{errors.labOrderNo}</span>
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

      {/* 검사항목 목록 (동적 행 추가/삭제) */}
      <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700">
            검사항목 <span className="text-rose-500">*</span>
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
              value={item.labItemCode}
              onChange={(e) => handleItemChange(index, e.target.value)}
              maxLength={20}
              disabled={creating}
              placeholder="검사항목코드 (예: CBC)"
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

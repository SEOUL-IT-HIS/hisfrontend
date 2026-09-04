"use client";

import { useEffect, useState, type ChangeEvent, type SubmitEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, FormField, Input, Select } from "@/components/common";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import { resolveImageOrderMessage } from "@/features/labimaging/imagingorder/messages";
import {
  createImageOrderRequest,
  resetImageOrderResult,
  selectImageOrderCreateError,
  selectImageOrderCreating,
  selectLastCreatedImageOrder,
} from "@/features/labimaging/imagingorder/slice";
import type {
  ImageOrderCreateRequest,
  ImageOrderItemRequest,
} from "@/features/labimaging/imagingorder/types";
import { URGENCY_YN_OPTIONS } from "@/features/labimaging/imagingorder/types";

/** 스칼라 입력 필드 초기값 (촬영항목 목록은 별도 state) */
const initialForm = {
  imageOrderNo: "",
  systemCode: "",
  patientId: "",
  physicianNo: "",
  physicianId: "",
  treatTypeCode: "",
  urgencyYn: "N" as "Y" | "N",
  receivedById: "",
};

type FormState = typeof initialForm;
type FieldErrors = Partial<Record<keyof FormState | "orderItems", string>>;

/**
 * 영상 오더 접수 폼 (UC-IMG-01 / Jira ZP2-19)
 * - laborder 과 동일 패턴. 제출 시 createImageOrderRequest 액션만 dispatch (가이드 10.3)
 * - 입력 UI 는 전역 공통 컴포넌트(@/components/common)를 사용한다. 자체 스타일을 만들지 않는다.
 * - 공통코드 옵션은 최상단에서 한 번만 조회한다. (상세 설명은 LabOrderReceptionForm 주석 참고)
 * TODO: 서버 통신 결과 표시는 공통 Toast 로 이관 예정 (가이드 15.3, 리더 관리 공통 컴포넌트).
 */
export default function ImageOrderReceptionForm() {
  const dispatch = useDispatch<AppDispatch>();
  const creating = useSelector(selectImageOrderCreating);
  const createError = useSelector(selectImageOrderCreateError);
  const lastCreated = useSelector(selectLastCreatedImageOrder);

  const systemCodes = useCommonCodeOptions("SYSTEM_SOURCE_CD");
  const treatTypes = useCommonCodeOptions("RCPT_TYPE_CD");
  const imageItems = useCommonCodeOptions("IMG_ITEM_CD");

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
    if (!form.imageOrderNo.trim()) next.imageOrderNo = "Order number is required.";
    if (!form.systemCode.trim()) next.systemCode = "System code is required.";
    if (!form.patientId.trim()) next.patientId = "Patient ID is required.";
    if (!form.treatTypeCode) next.treatTypeCode = "Select a treatment type.";
    if (!form.receivedById.trim()) next.receivedById = "Receptionist ID is required.";
    if (items.every((item) => !item.imageItemCode.trim())) {
      next.orderItems = "Enter at least one imaging item.";
    }
    return next;
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const request: ImageOrderCreateRequest = {
      imageOrderNo: form.imageOrderNo.trim(),
      systemCode: form.systemCode.trim(),
      patientId: form.patientId.trim(),
      physicianNo: form.physicianNo.trim() || undefined,
      physicianId: form.physicianId.trim() || undefined,
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
        <Alert variant="success">
          Imaging reception created. (Reception No: {lastCreated.receptionNo})
        </Alert>
      ) : null}
      {createError ? <Alert>{resolveImageOrderMessage(createError)}</Alert> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Order No." required>
          <Input
            name="imageOrderNo"
            value={form.imageOrderNo}
            onChange={handleChange}
            maxLength={20}
            disabled={creating}
            placeholder="e.g. EXT-IO-20260715-001"
          />
          {errors.imageOrderNo ? (
            <span className="text-xs text-rose-500">{errors.imageOrderNo}</span>
          ) : null}
        </FormField>

        <FormField label="System Code" required>
          <Select
            name="systemCode"
            value={form.systemCode}
            onChange={handleChange}
            options={systemCodes.options}
            placeholder={systemCodes.loading ? "Loading..." : "Select"}
            disabled={creating || systemCodes.loading}
          />
          {errors.systemCode ? (
            <span className="text-xs text-rose-500">{errors.systemCode}</span>
          ) : null}
          {systemCodes.error ? (
            <span className="text-xs text-rose-500">{systemCodes.error}</span>
          ) : null}
        </FormField>

        {/* ⚠ 처방 연동 전까지 접수 담당자가 직접 입력하는 임시 필드.
            연동 완료 시 이 입력칸은 없어지고 POST 바디로 자동 채워진다. */}
        <FormField label="Patient ID" required>
          <Input
            name="patientId"
            value={form.patientId}
            onChange={handleChange}
            maxLength={36}
            disabled={creating}
            placeholder="e.g. 3f7b1a20-6c2e-4e7a-9e2a-8b1f2c3d4e5f"
          />
          {errors.patientId ? (
            <span className="text-xs text-rose-500">{errors.patientId}</span>
          ) : null}
        </FormField>

        <FormField label="Physician No.">
          <Input
            name="physicianNo"
            value={form.physicianNo}
            onChange={handleChange}
            maxLength={20}
            disabled={creating}
            placeholder="Optional"
          />
        </FormField>

        <FormField label="Physician ID">
          <Input
            name="physicianId"
            value={form.physicianId}
            onChange={handleChange}
            maxLength={36}
            disabled={creating}
            placeholder="Optional"
          />
        </FormField>

        <FormField label="Treatment Type" required>
          <Select
            name="treatTypeCode"
            value={form.treatTypeCode}
            onChange={handleChange}
            options={treatTypes.options}
            placeholder={treatTypes.loading ? "Loading..." : "Select"}
            disabled={creating || treatTypes.loading}
          />
          {errors.treatTypeCode ? (
            <span className="text-xs text-rose-500">{errors.treatTypeCode}</span>
          ) : null}
          {treatTypes.error ? (
            <span className="text-xs text-rose-500">{treatTypes.error}</span>
          ) : null}
        </FormField>

        <FormField label="Urgency">
          <Select
            name="urgencyYn"
            value={form.urgencyYn}
            onChange={handleChange}
            options={[...URGENCY_YN_OPTIONS]}
            disabled={creating}
          />
        </FormField>

        <FormField label="Receptionist ID" required className="sm:col-span-2">
          <Input
            name="receivedById"
            value={form.receivedById}
            onChange={handleChange}
            maxLength={20}
            disabled={creating}
            placeholder="e.g. staff-uuid-001"
          />
          {errors.receivedById ? (
            <span className="text-xs text-rose-500">{errors.receivedById}</span>
          ) : null}
        </FormField>
      </div>

      {/* 촬영항목 목록 (동적 행 추가/삭제) */}
      <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">
            Imaging Items <span className="text-rose-500">*</span>
          </p>
          <Button variant="secondary" onClick={addItemRow} disabled={creating}>
            + Add Item
          </Button>
        </div>

        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-1">
              <Select
                value={item.imageItemCode}
                onChange={(e) => handleItemChange(index, e.target.value)}
                options={imageItems.options}
                placeholder={imageItems.loading ? "Loading..." : "Imaging Items Select"}
                disabled={creating || imageItems.loading}
              />
            </div>
            <Button
              variant="secondary"
              onClick={() => removeItemRow(index)}
              disabled={creating || items.length <= 1}
              aria-label="Delete item"
            >
              Delete
            </Button>
          </div>
        ))}
        {imageItems.error ? (
          <span className="text-xs text-rose-500">{imageItems.error}</span>
        ) : null}
        {errors.orderItems ? (
          <span className="text-xs text-rose-500">{errors.orderItems}</span>
        ) : null}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={creating}>
          {creating ? "Receiving..." : "Receive"}
        </Button>
      </div>
    </form>
  );
}

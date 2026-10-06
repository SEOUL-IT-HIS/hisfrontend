"use client";

import { useEffect, useState, type ChangeEvent, type SubmitEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, FormField, Input, Select } from "@/components/common";
import DoctorSelect from "@/components/labimaging/common/DoctorSelect";
import LoginActorInput from "@/components/labimaging/common/LoginActorInput";
import { useLoginActor } from "@/features/labimaging/common/hooks/useLoginActor";
import { useStaffDirectory } from "@/features/labimaging/common/hooks/useStaffDirectory";
import { usePatientNames } from "@/features/labimaging/common/hooks/usePatientNames";
import { hasDuplicateItemCode, isUuid, normalizeOrderNo } from "@/features/labimaging/common/validation";
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

  /** 담당자는 로그인 사용자다. (5차 Phase 2 — 예전의 직원ID 직접 입력칸을 대체) */
  const { actorId, actorName, signedIn } = useLoginActor();
  const creating = useSelector(selectImageOrderCreating);
  const createError = useSelector(selectImageOrderCreateError);
  const lastCreated = useSelector(selectLastCreatedImageOrder);

  const systemCodes = useCommonCodeOptions("SYSTEM_SOURCE_CD");
  const treatTypes = useCommonCodeOptions("RCPT_TYPE_CD");
  const imageItems = useCommonCodeOptions("IMG_ITEM_CD");
  /** 직원 디렉터리를 못 불러오면 Physician 입력이 드롭다운 대신 자유 입력(physicianNo)으로 바뀐다. */
  const { failed: staffDirectoryFailed } = useStaffDirectory();

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

  /*
   * 입력한 환자ID 가 실제로 누구인지 확인시켜 준다. (LabOrderReceptionForm 과 같은 패턴 — 그쪽 주석 참고)
   * (04번 지시서 Phase 4-2)
   */
  const typedPatientId = form.patientId.trim();
  const {
    names: typedPatientNames,
    loading: typedPatientNameLoading,
    error: typedPatientNameError,
  } = usePatientNames(typedPatientId.length === 36 ? [typedPatientId] : []);
  const typedPatientName = typedPatientNames[typedPatientId];

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    // 오더번호는 허용 문자 외 입력을 입력 즉시 제거한다. (04번 지시서 Phase 3-E-1)
    const nextValue = name === "imageOrderNo" ? normalizeOrderNo(value) : value;
    setForm((prev) => ({ ...prev, [name]: nextValue }));
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
    // 환자ID 검증 — LabOrderReceptionForm 과 같은 기준(그쪽 주석 참고). (04번 지시서 Phase 4-2)
    if (!typedPatientId) {
      next.patientId = "Patient ID is required.";
    } else if (!isUuid(typedPatientId)) {
      next.patientId = "Patient ID must be a valid UUID.";
    } else if (!typedPatientNameLoading && !typedPatientNameError && !typedPatientName) {
      next.patientId = "Patient not found. Check the patient ID.";
    }
    if (!form.treatTypeCode) next.treatTypeCode = "Select a treatment type.";
    if (!signedIn) next.receivedById = "Sign in to record this action.";
    if (items.every((item) => !item.imageItemCode.trim())) {
      next.orderItems = "Enter at least one imaging item.";
    } else if (hasDuplicateItemCode(items.map((item) => item.imageItemCode))) {
      next.orderItems = "The same imaging item was selected more than once.";
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
      receivedById: actorId,
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
            maxLength={36}
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
          {/*
            입력한 UUID 가 누구인지 바로 보여준다. (LabOrderReceptionForm 과 같은 패턴)
            36자를 다 채웠을 때만 조회하므로 타이핑 중에는 요청이 나가지 않는다.
          */}
          {typedPatientName ? (
            <span className="text-xs text-emerald-600">Patient: {typedPatientName}</span>
          ) : form.patientId.trim().length === 36 ? (
            <span className="text-xs text-amber-600">
              Patient not found. Check the patient ID.
            </span>
          ) : null}
        </FormField>

        {/*
          physicianId/physicianNo 중 디렉터리 조회 성공 여부에 따라 하나만 쓴다(서로 배타적).
          LabOrderReceptionForm 과 같은 패턴 — 그쪽 주석 참고.
        */}
        <FormField label="Physician" className="sm:col-span-2">
          <DoctorSelect
            value={staffDirectoryFailed ? form.physicianNo : form.physicianId}
            onChange={(value) =>
              setForm((prev) =>
                staffDirectoryFailed
                  ? { ...prev, physicianNo: value, physicianId: "" }
                  : { ...prev, physicianId: value, physicianNo: "" },
              )
            }
            disabled={creating}
            placeholder="Select physician (optional)"
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

        <FormField label="Received By" required className="sm:col-span-2">
          <LoginActorInput name="receivedById" actorName={actorName} signedIn={signedIn} />
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

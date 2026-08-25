"use client";

import { useEffect, useState, type ChangeEvent, type SubmitEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, FormField, Input, Select } from "@/components/common";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import { resolveLabOrderMessage } from "@/features/labimaging/laborder/messages";
import {
  createLabOrderRequest,
  resetLabOrderResult,
  selectLabOrderCreateError,
  selectLabOrderCreating,
  selectLastCreatedLabOrder,
} from "@/features/labimaging/laborder/slice";
import type {
  LabOrderCreateRequest,
  LabOrderItemRequest,
} from "@/features/labimaging/laborder/types";
import { URGENCY_YN_OPTIONS } from "@/features/labimaging/laborder/types";

/** 스칼라 입력 필드 초기값 (항목 목록은 별도 state) */
const initialForm = {
  labOrderNo: "",
  systemCode: "",
  patientNo: "",
  patientId: "",
  physicianNo: "",
  physicianId: "",
  treatTypeCode: "",
  urgencyYn: "N" as "Y" | "N",
  receivedById: "",
};

type FormState = typeof initialForm;
/** 필드별 인라인 검증 메시지 (가이드 15.3: 검증은 필드 하단 인라인) */
type FieldErrors = Partial<Record<keyof FormState | "orderItems", string>>;

/**
 * 검사 오더 접수 폼 (UC-SPC-01 / Jira ZP2-12)
 *
 * - presentational 입력 + 검증만 담당하고, 제출 시 slice 의 createLabOrderRequest 액션만 dispatch 한다.
 *   (컴포넌트에서 axios 직접 호출 금지 — 가이드 10.3)
 * - 서버 통신 결과는 slice 상태(creating/createError/lastCreated)를 selector 로 읽어 표시한다.
 * - 입력 UI 는 전역 공통 컴포넌트(@/components/common)를 사용한다. 자체 스타일을 만들지 않는다.
 *
 * ⚠ 공통코드 옵션은 컴포넌트 최상단에서 한 번만 조회한다.
 *   검사항목처럼 행이 여러 개인 필드도 같은 options 를 나눠 쓰므로, 행을 추가해도 재조회가 없다.
 *
 * TODO: 서버 통신 결과 표시는 공통 Toast 로 이관 예정 (가이드 15.3). 공통 Toast 는 리더 관리
 *       공통 컴포넌트라 신규 생성하지 않고, 도입 전까지 인라인 결과 영역으로 대체한다.
 */
export default function LabOrderReceptionForm() {
  const dispatch = useDispatch<AppDispatch>();
  const creating = useSelector(selectLabOrderCreating);
  const createError = useSelector(selectLabOrderCreateError);
  const lastCreated = useSelector(selectLastCreatedLabOrder);

  const systemCodes = useCommonCodeOptions("SYSTEM_SOURCE_CD");
  const treatTypes = useCommonCodeOptions("RCPT_TYPE_CD");
  const testTypes = useCommonCodeOptions("TEST_TYPE_CD");

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
    if (!form.patientId.trim()) next.patientId = "환자ID는 필수입니다.";
    if (!form.treatTypeCode) next.treatTypeCode = "진료유형을 선택해주세요.";
    if (!form.receivedById.trim()) next.receivedById = "접수자ID는 필수입니다.";
    if (items.every((item) => !item.labItemCode.trim())) {
      next.orderItems = "검사항목을 최소 1건 입력해주세요.";
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

    const request: LabOrderCreateRequest = {
      labOrderNo: form.labOrderNo.trim(),
      systemCode: form.systemCode.trim(),
      patientNo: form.patientNo.trim(),
      patientId: form.patientId.trim(),
      physicianNo: form.physicianNo.trim() || undefined,
      physicianId: form.physicianId.trim() || undefined,
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
        <Alert variant="success">
          검사 접수가 생성되었습니다. (접수번호: {lastCreated.receptionNo})
        </Alert>
      ) : null}
      {createError ? <Alert>{resolveLabOrderMessage(createError)}</Alert> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="오더번호" required>
          <Input
            name="labOrderNo"
            value={form.labOrderNo}
            onChange={handleChange}
            maxLength={20}
            disabled={creating}
            placeholder="예: EXT-LO-20260715-001"
          />
          {errors.labOrderNo ? (
            <span className="text-xs text-rose-500">{errors.labOrderNo}</span>
          ) : null}
        </FormField>

        <FormField label="시스템코드" required>
          <Select
            name="systemCode"
            value={form.systemCode}
            onChange={handleChange}
            options={systemCodes.options}
            placeholder={systemCodes.loading ? "불러오는 중..." : "선택"}
            disabled={creating || systemCodes.loading}
          />
          {errors.systemCode ? (
            <span className="text-xs text-rose-500">{errors.systemCode}</span>
          ) : null}
          {systemCodes.error ? (
            <span className="text-xs text-rose-500">{systemCodes.error}</span>
          ) : null}
        </FormField>

        <FormField label="환자번호" required>
          <Input
            name="patientNo"
            value={form.patientNo}
            onChange={handleChange}
            maxLength={20}
            disabled={creating}
            placeholder="예: P00012345"
          />
          {errors.patientNo ? (
            <span className="text-xs text-rose-500">{errors.patientNo}</span>
          ) : null}
        </FormField>

        {/* ⚠ 처방 연동 전까지 접수 담당자가 직접 입력하는 임시 필드.
            연동 완료 시 이 입력칸은 없어지고 POST 바디로 자동 채워진다. */}
        <FormField label="환자ID" required>
          <Input
            name="patientId"
            value={form.patientId}
            onChange={handleChange}
            maxLength={36}
            disabled={creating}
            placeholder="예: 3f7b1a20-6c2e-4e7a-9e2a-8b1f2c3d4e5f"
          />
          {errors.patientId ? (
            <span className="text-xs text-rose-500">{errors.patientId}</span>
          ) : null}
        </FormField>

        <FormField label="처방의번호">
          <Input
            name="physicianNo"
            value={form.physicianNo}
            onChange={handleChange}
            maxLength={20}
            disabled={creating}
            placeholder="선택 입력"
          />
        </FormField>

        <FormField label="처방의ID">
          <Input
            name="physicianId"
            value={form.physicianId}
            onChange={handleChange}
            maxLength={36}
            disabled={creating}
            placeholder="선택 입력"
          />
        </FormField>

        <FormField label="진료유형" required>
          <Select
            name="treatTypeCode"
            value={form.treatTypeCode}
            onChange={handleChange}
            options={treatTypes.options}
            placeholder={treatTypes.loading ? "불러오는 중..." : "선택"}
            disabled={creating || treatTypes.loading}
          />
          {errors.treatTypeCode ? (
            <span className="text-xs text-rose-500">{errors.treatTypeCode}</span>
          ) : null}
          {treatTypes.error ? (
            <span className="text-xs text-rose-500">{treatTypes.error}</span>
          ) : null}
        </FormField>

        <FormField label="긴급여부">
          <Select
            name="urgencyYn"
            value={form.urgencyYn}
            onChange={handleChange}
            options={[...URGENCY_YN_OPTIONS]}
            disabled={creating}
          />
        </FormField>

        <FormField label="접수자ID" required className="sm:col-span-2">
          <Input
            name="receivedById"
            value={form.receivedById}
            onChange={handleChange}
            maxLength={20}
            disabled={creating}
            placeholder="예: staff-uuid-001"
          />
          {errors.receivedById ? (
            <span className="text-xs text-rose-500">{errors.receivedById}</span>
          ) : null}
        </FormField>
      </div>

      {/* 검사항목 목록 (동적 행 추가/삭제) */}
      <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">
            검사항목 <span className="text-rose-500">*</span>
          </p>
          <Button variant="secondary" onClick={addItemRow} disabled={creating}>
            + 항목 추가
          </Button>
        </div>

        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-1">
              <Select
                value={item.labItemCode}
                onChange={(e) => handleItemChange(index, e.target.value)}
                options={testTypes.options}
                placeholder={testTypes.loading ? "불러오는 중..." : "검사항목 선택"}
                disabled={creating || testTypes.loading}
              />
            </div>
            <Button
              variant="secondary"
              onClick={() => removeItemRow(index)}
              disabled={creating || items.length <= 1}
              aria-label="항목 삭제"
            >
              삭제
            </Button>
          </div>
        ))}
        {testTypes.error ? (
          <span className="text-xs text-rose-500">{testTypes.error}</span>
        ) : null}
        {errors.orderItems ? (
          <span className="text-xs text-rose-500">{errors.orderItems}</span>
        ) : null}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={creating}>
          {creating ? "접수 중..." : "접수"}
        </Button>
      </div>
    </form>
  );
}

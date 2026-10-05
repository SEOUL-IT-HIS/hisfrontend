"use client";

import { useEffect, useState, type ChangeEvent, type SubmitEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, FormField, Input, Select } from "@/components/common";
import DoctorSelect from "@/components/labimaging/common/DoctorSelect";
import LoginActorInput from "@/components/labimaging/common/LoginActorInput";
import { useLoginActor } from "@/features/labimaging/common/hooks/useLoginActor";
import { usePatientNames } from "@/features/labimaging/common/hooks/usePatientNames";
import { useStaffDirectory } from "@/features/labimaging/common/hooks/useStaffDirectory";
import { hasDuplicateItemCode, isUuid, normalizeOrderNo } from "@/features/labimaging/common/validation";
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

  /** 담당자는 로그인 사용자다. (5차 Phase 2 — 예전의 직원ID 직접 입력칸을 대체) */
  const { actorId, actorName, signedIn } = useLoginActor();
  const creating = useSelector(selectLabOrderCreating);
  const createError = useSelector(selectLabOrderCreateError);
  const lastCreated = useSelector(selectLastCreatedLabOrder);

  const systemCodes = useCommonCodeOptions("SYSTEM_SOURCE_CD");
  const treatTypes = useCommonCodeOptions("RCPT_TYPE_CD");
  const testTypes = useCommonCodeOptions("TEST_TYPE_CD");
  /** 직원 디렉터리를 못 불러오면 Physician 입력이 드롭다운 대신 자유 입력(physicianNo)으로 바뀐다. */
  const { failed: staffDirectoryFailed } = useStaffDirectory();

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

  /*
   * 입력한 환자ID 가 실제로 누구인지 확인시켜 준다.
   *
   * ⚠ 36자(UUID 길이)를 다 채웠을 때만 조회한다.
   *   타이핑 중에 부르면 글자 하나마다 요청이 나간다.
   * ⚠ 이름이 안 뜨면 존재하지 않는 환자다. UUID 는 사람이 눈으로 검증할 수 없어서
   *   이 확인이 없으면 오입력을 서버 응답(LAB998)으로만 알게 된다.
   */
  const typedPatientId = form.patientId.trim();
  const { names: typedPatientNames, loading: typedPatientNameLoading, error: typedPatientNameError } = usePatientNames(
    typedPatientId.length === 36 ? [typedPatientId] : [],
  );
  const typedPatientName = typedPatientNames[typedPatientId];

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    // 오더번호는 허용 문자 외 입력을 입력 즉시 제거한다. (04번 지시서 Phase 3-E-1)
    const nextValue = name === "labOrderNo" ? normalizeOrderNo(value) : value;
    setForm((prev) => ({ ...prev, [name]: nextValue }));
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
    if (!form.labOrderNo.trim()) next.labOrderNo = "Order number is required.";
    if (!form.systemCode.trim()) next.systemCode = "System code is required.";
    /*
     * 환자ID 는 36자 UUID 형식이 아니면 제출을 막는다. 형식이 맞고 조회가 "성공"했는데
     * 이름이 없으면(= 존재하지 않는 환자) 역시 막는다. 조회 자체가 실패(서비스 장애 등)했을
     * 때는 경고 없이 통과시킨다 — patient-service 장애를 이 폼이 막을 이유가 없다.
     * (04번 지시서 Phase 4-2)
     */
    if (!typedPatientId) {
      next.patientId = "Patient ID is required.";
    } else if (!isUuid(typedPatientId)) {
      next.patientId = "Patient ID must be a valid UUID.";
    } else if (!typedPatientNameLoading && !typedPatientNameError && !typedPatientName) {
      next.patientId = "Patient not found. Check the patient ID.";
    }
    if (!form.treatTypeCode) next.treatTypeCode = "Select a treatment type.";
    if (!signedIn) next.receivedById = "Sign in to record this action.";
    if (items.every((item) => !item.labItemCode.trim())) {
      next.orderItems = "Enter at least one test item.";
    } else if (hasDuplicateItemCode(items.map((item) => item.labItemCode))) {
      next.orderItems = "The same test item was selected more than once.";
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
      patientId: form.patientId.trim(),
      physicianNo: form.physicianNo.trim() || undefined,
      physicianId: form.physicianId.trim() || undefined,
      treatTypeCode: form.treatTypeCode,
      urgencyYn: form.urgencyYn,
      receivedById: actorId,
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
          Lab reception created. (Reception No: {lastCreated.receptionNo})
        </Alert>
      ) : null}
      {createError ? <Alert>{resolveLabOrderMessage(createError)}</Alert> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Order No." required>
          <Input
            name="labOrderNo"
            value={form.labOrderNo}
            onChange={handleChange}
            maxLength={36}
            disabled={creating}
            placeholder="e.g. EXT-LO-20260715-001"
          />
          {errors.labOrderNo ? (
            <span className="text-xs text-rose-500">{errors.labOrderNo}</span>
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
            입력한 UUID 가 누구인지 바로 보여준다.
            36자를 다 채웠을 때만 조회하므로 타이핑 중에는 요청이 나가지 않는다.
            UUID 는 눈으로 검증할 수 없어서, 이름이 안 뜨면 잘못 입력한 것이다.
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
          DoctorSelect 가 같은 useStaffDirectory().failed 를 내부에서도 읽어 드롭다운/자유입력을
          똑같이 전환하므로, 여기서 쓰는 값과 보이는 입력 모양이 항상 일치한다.
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

      {/* 검사항목 목록 (동적 행 추가/삭제) */}
      <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">
            Test Items <span className="text-rose-500">*</span>
          </p>
          <Button variant="secondary" onClick={addItemRow} disabled={creating}>
            + Add Item
          </Button>
        </div>

        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-1">
              <Select
                value={item.labItemCode}
                onChange={(e) => handleItemChange(index, e.target.value)}
                options={testTypes.options}
                placeholder={testTypes.loading ? "Loading..." : "Test Items Select"}
                disabled={creating || testTypes.loading}
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
        {testTypes.error ? (
          <span className="text-xs text-rose-500">{testTypes.error}</span>
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

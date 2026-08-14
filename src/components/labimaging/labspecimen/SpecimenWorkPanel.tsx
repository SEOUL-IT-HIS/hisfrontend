"use client";

import { useEffect, useState, type ChangeEvent, type SubmitEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import {
  Alert,
  Button,
  DataTable,
  FormField,
  Input,
  Select,
} from "@/components/common";
import type { DataTableColumn } from "@/components/common";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import { resolveLabSpecimenMessage } from "@/features/labimaging/labspecimen/messages";
import {
  createSpecimenRequest,
  fetchSpecimensRequest,
  resetSpecimenState,
  selectLastCreatedSpecimen,
  selectSpecimenCreateError,
  selectSpecimenCreating,
  selectSpecimens,
  selectSpecimensError,
  selectSpecimensLoading,
} from "@/features/labimaging/labspecimen/slice";
import {
  FITNESS_STATUS_LABELS,
  SPECIMEN_TYPE_LABELS,
  SPECIMEN_TYPE_OPTIONS,
  type SpecimenSummary,
  type SpecimenType,
} from "@/features/labimaging/labspecimen/types";
import type { LabWorklistItem } from "@/features/labimaging/laborder/types";

/**
 * 워크리스트 오른쪽 "검체" 작업 영역 — 등록 폼 + 이 접수의 검체 목록.
 *
 * ⚠ 검체는 접수 1건에 여러 건 달릴 수 있다(1:N). 그래서 검체를 목록의 행으로 삼지 않고
 *   선택한 접수의 하위 데이터로 여기서 다룬다. 왼쪽 목록은 언제나 접수 단위로 고정된다.
 *
 * ⚠ 등록 후에도 폼이 그대로 남는다. 한 접수에서 검체를 2건 이상 채취하는 경우가 있어
 *   연속 등록이 가능해야 한다. (아래 목록에 방금 등록한 건이 바로 추가된다)
 *
 * ⚠ 검체바코드는 입력받지 않는다. 서버가 채번해서 응답으로 내려준다.
 */

const initialForm = {
  specimenContainerCode: "",
  specimenType: "BLOOD" as SpecimenType,
  collectedAt: "",
  collectedById: "",
};

type FormState = typeof initialForm;
type FieldErrors = Partial<Record<keyof FormState, string>>;

/** 백엔드가 ISO 문자열로 준다. 초 단위는 화면에서 의미가 없어 분까지만 보여준다. */
function formatDateTime(value?: string) {
  if (!value) return "-";
  return value.replace("T", " ").slice(0, 16);
}

export default function SpecimenWorkPanel({ reception }: { reception: LabWorklistItem }) {
  const dispatch = useDispatch<AppDispatch>();

  const specimens = useSelector(selectSpecimens);
  const listLoading = useSelector(selectSpecimensLoading);
  const listError = useSelector(selectSpecimensError);
  const creating = useSelector(selectSpecimenCreating);
  const createError = useSelector(selectSpecimenCreateError);
  const lastCreated = useSelector(selectLastCreatedSpecimen);

  // 검체용기코드는 admin 공통코드다. (검체종류는 서비스 내부 Enum 이라 상수 목록을 쓴다)
  const containerCodes = useCommonCodeOptions("SPECIMEN_CONTAINER_CD");

  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});

  // 선택한 접수가 바뀌면 이전 접수의 목록/결과를 비우고 새로 불러온다.
  useEffect(() => {
    dispatch(resetSpecimenState());
    dispatch(fetchSpecimensRequest(reception.receptionNo));
  }, [dispatch, reception.receptionNo]);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!form.specimenContainerCode) next.specimenContainerCode = "검체용기는 필수입니다.";
    if (!form.collectedAt) next.collectedAt = "채취일시는 필수입니다.";
    if (!form.collectedById.trim()) next.collectedById = "채취자ID는 필수입니다.";
    return next;
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    dispatch(
      createSpecimenRequest(
        {
          labReceptionId: reception.labReceptionId,
          specimenContainerCode: form.specimenContainerCode,
          specimenType: form.specimenType,
          patientNo: reception.patientNo,
          patientId: reception.patientId,
          collectedAt: form.collectedAt,
          collectedById: form.collectedById.trim(),
        },
        reception.receptionNo,
      ),
    );
  }

  const columns: DataTableColumn<SpecimenSummary>[] = [
    {
      key: "specimenBarcode",
      header: "바코드",
      render: (s) => (
        <span className="font-semibold text-slate-700">{s.specimenBarcode}</span>
      ),
    },
    {
      key: "specimenType",
      header: "종류",
      render: (s) => SPECIMEN_TYPE_LABELS[s.specimenType] ?? s.specimenType,
    },
    { key: "collectedAt", header: "채취일시", render: (s) => formatDateTime(s.collectedAt) },
    { key: "collectedById", header: "채취자", render: (s) => s.collectedById },
    {
      key: "fitnessStatus",
      header: "적합성",
      render: (s) =>
        s.fitnessStatus ? (
          <span
            className={
              s.fitnessStatus === "FIT" ? "text-emerald-600" : "text-rose-600"
            }
          >
            {FITNESS_STATUS_LABELS[s.fitnessStatus]}
          </span>
        ) : (
          <span className="text-slate-400">미판정</span>
        ),
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      {/* ---------- 등록 폼 ---------- */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {lastCreated ? (
          <Alert variant="success">
            검체가 등록되었습니다. (바코드: {lastCreated.specimenBarcode})
          </Alert>
        ) : null}
        {createError ? <Alert>{resolveLabSpecimenMessage(createError)}</Alert> : null}
        {containerCodes.error ? <Alert>{containerCodes.error}</Alert> : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="검체용기" required>
            <Select
              name="specimenContainerCode"
              value={form.specimenContainerCode}
              onChange={handleChange}
              options={containerCodes.options}
              placeholder={containerCodes.loading ? "불러오는 중..." : "선택하세요"}
              disabled={creating || containerCodes.loading}
            />
            {errors.specimenContainerCode ? (
              <span className="text-xs text-rose-500">{errors.specimenContainerCode}</span>
            ) : null}
          </FormField>

          <FormField label="검체종류" required>
            <Select
              name="specimenType"
              value={form.specimenType}
              onChange={handleChange}
              options={[...SPECIMEN_TYPE_OPTIONS]}
              disabled={creating}
            />
          </FormField>

          <FormField label="채취일시" required>
            <Input
              type="datetime-local"
              name="collectedAt"
              value={form.collectedAt}
              onChange={handleChange}
              disabled={creating}
            />
            {errors.collectedAt ? (
              <span className="text-xs text-rose-500">{errors.collectedAt}</span>
            ) : null}
          </FormField>

          <FormField label="채취자ID" required>
            <Input
              name="collectedById"
              value={form.collectedById}
              onChange={handleChange}
              maxLength={20}
              disabled={creating}
              placeholder="예: STF00021"
            />
            {errors.collectedById ? (
              <span className="text-xs text-rose-500">{errors.collectedById}</span>
            ) : null}
          </FormField>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={creating}>
            {creating ? "등록 중..." : "검체 등록"}
          </Button>
        </div>
      </form>

      {/* ---------- 이 접수의 검체 목록 ---------- */}
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <p className="text-sm font-semibold text-slate-700">
          등록된 검체 {specimens.length}건
        </p>
        {listError ? <Alert>{resolveLabSpecimenMessage(listError)}</Alert> : null}
        <DataTable
          columns={columns}
          rows={specimens}
          rowKey={(s) => s.specimenId}
          loading={listLoading}
          minWidthClassName="min-w-[560px]"
          emptyMessage="아직 등록된 검체가 없습니다."
        />
      </div>
    </div>
  );
}

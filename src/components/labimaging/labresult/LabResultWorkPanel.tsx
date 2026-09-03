"use client";

import { useEffect, useState, type ChangeEvent, type SubmitEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, FormField, Input } from "@/components/common";
import { usePatientNames } from "@/features/labimaging/common/hooks/usePatientNames";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import type { CommonCodeOption } from "@/features/commonCode/hooks/useCommonCodeOptions";
import { resolveLabResultMessage } from "@/features/labimaging/labresult/messages";
import {
  confirmLabResultRequest,
  createLabResultRequest,
  fetchLabResultItemsRequest,
  resetLabResultState,
  selectLabResultItems,
  selectLabResultItemsError,
  selectLabResultItemsLoading,
  selectLabResultSubmitError,
  selectLabResultSubmitting,
  selectLastSubmittedLabResult,
  updateLabResultRequest,
} from "@/features/labimaging/labresult/slice";
import {
  RESULT_STATUS,
  RESULT_STATUS_LABELS,
  type LabResultItem,
} from "@/features/labimaging/labresult/types";
import type { LabWorklistItem } from "@/features/labimaging/laborder/types";

/**
 * 선택한 접수의 검사항목별 결과를 입력하고 확정하는 영역.
 * 대응 유스케이스: UC-RST-01 일반검사결과등록 (ZP2-13 / 화면연동 ZP2-104)
 *
 * ⚠ 입력 단위는 "검사항목"이라 접수보다 한 단계 아래다. 그래서 목록의 행이 되지 못하고
 *   접수를 고른 뒤 이 안에서 항목을 다시 고르는 2단 구조가 된다.
 *   (검체 판정 패널과 같은 구조 — 오더 1건에 항목이 여러 건 달리는 1:N)
 *
 * ⚠ 등록 → 확정 두 단계다. 확정하면 되돌릴 수 없고 수정도 막힌다.
 *   그래서 확정은 입력 폼 안이 아니라 목록 행에 따로 두고, 한 번 더 누르게 한다.
 *
 * ⚠ 비정상 여부(abnormalYn)는 화면이 정하지 않는다. 참고범위와 결과값을 비교해 서버가 계산한다.
 *   입력자가 직접 고르게 두면 같은 수치가 사람마다 다르게 분류된다. (ZP2-99)
 *   그래서 입력 폼에 그 항목이 없고, 저장 후 목록에서 결과로만 확인한다.
 */

/** 공통코드값 → 코드명. 아직 못 불러왔거나 사전에 없는 값이면 코드값을 그대로 보여준다. */
function toCodeLabel(options: CommonCodeOption[], code?: string) {
  if (!code) return "-";
  return options.find((opt) => opt.value === code)?.label ?? code;
}

/** 백엔드가 ISO 문자열로 준다. 초 단위는 화면에서 의미가 없어 분까지만 보여준다. */
function formatDateTime(value?: string) {
  if (!value) return "-";
  return value.replace("T", " ").slice(0, 16);
}

const initialForm = {
  resultValue: "",
  resultUnit: "",
  referenceRange: "",
  recordedById: "",
};

type FormState = typeof initialForm;
type FieldErrors = Partial<Record<keyof FormState, string>>;

export default function LabResultWorkPanel({
  reception,
}: {
  reception: LabWorklistItem;
}) {
  const dispatch = useDispatch<AppDispatch>();

  const items = useSelector(selectLabResultItems);
  const listLoading = useSelector(selectLabResultItemsLoading);
  const listError = useSelector(selectLabResultItemsError);
  const submitting = useSelector(selectLabResultSubmitting);
  const submitError = useSelector(selectLabResultSubmitError);
  const lastSubmitted = useSelector(selectLastSubmittedLabResult);

  const testTypes = useCommonCodeOptions("TEST_TYPE_CD");

  /*
   * ⚠ 결과는 환자 진료에 직접 쓰이는 값이라, 누구 결과를 입력하는지 폼 옆에서
   *   다시 확인할 수 있게 이름을 띄운다. (검체 판정 패널과 같은 이유)
   */
  const { names: patientNames } = usePatientNames([reception.patientId]);

  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  /** 확정 버튼을 누른 항목. 한 번 더 눌러야 실제로 확정된다. */
  const [confirmTargetId, setConfirmTargetId] = useState<string>("");

  /*
   * 접수가 바뀌면 이전 접수의 목록·결과·오류를 지우고 새로 불러온다.
   *
   * ⚠ 여기서는 resetLabResultState 를 부른다. 검체 패널에서 안 부른 것과 다르다.
   *   검체는 "검체" 탭과 같은 slice 를 공유해서 지우면 방금 등록한 검체까지 사라지는데,
   *   결과는 이 패널만 쓰는 slice 라 지워도 잃을 게 없다. 오히려 남겨 두면
   *   접수를 바꾼 직후 이전 접수의 항목이 스쳐 보인다.
   */
  useEffect(() => {
    dispatch(resetLabResultState());
    dispatch(fetchLabResultItemsRequest(reception.receptionNo));
  }, [dispatch, reception.receptionNo]);

  const selected = items.find((i) => i.labOrderItemId === selectedItemId) ?? null;
  const unregistered = items.filter((i) => !i.result);

  /** 수정 중인가 — 고른 항목에 이미 결과가 있으면 수정, 없으면 신규 등록이다. */
  const isEditing = Boolean(selected?.result);

  /**
   * 항목을 고른다. 이미 결과가 있으면 그 값을 폼에 채워 수정할 수 있게 한다.
   *
   * ⚠ 확정된 항목은 고를 수 없다. 서버가 LAB040 으로 막고, 화면에서도 버튼을 잠근다.
   */
  function handleSelectItem(item: LabResultItem) {
    setSelectedItemId(item.labOrderItemId);
    setErrors({});
    setConfirmTargetId("");

    if (item.result) {
      setForm({
        resultValue: item.result.resultValue,
        resultUnit: item.result.resultUnit ?? "",
        referenceRange: item.result.referenceRange ?? "",
        // 수정에는 입력자를 보내지 않는다. 최초 입력자를 바꾸는 건 기록 조작이다.
        recordedById: item.result.recordedById,
      });
    } else {
      setForm(initialForm);
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!form.resultValue.trim()) next.resultValue = "Result value is required.";
    // 등록일 때만 입력자가 필요하다. 수정 요청에는 이 값이 들어가지 않는다.
    if (!isEditing && !form.recordedById.trim())
      next.recordedById = "Recording staff ID is required.";
    return next;
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!selected) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // 빈 문자열은 "값 없음"으로 보낸다. 서버에서 빈 문자열은 값이 있는 것으로 취급된다.
    const resultUnit = form.resultUnit.trim() || undefined;
    const referenceRange = form.referenceRange.trim() || undefined;

    if (selected.result) {
      dispatch(
        updateLabResultRequest(
          selected.result.labResultId,
          { resultValue: form.resultValue.trim(), resultUnit, referenceRange },
          reception.receptionNo,
        ),
      );
    } else {
      dispatch(
        createLabResultRequest(
          {
            labOrderItemId: selected.labOrderItemId,
            resultValue: form.resultValue.trim(),
            resultUnit,
            referenceRange,
            recordedById: form.recordedById.trim(),
          },
          reception.receptionNo,
        ),
      );
    }

    setSelectedItemId("");
    setForm(initialForm);
    setErrors({});
  }

  /**
   * 확정. 한 번 더 눌러야 실제로 보낸다.
   *
   * ⚠ 확정은 되돌릴 수 없고 그 뒤로는 수정도 막힌다. 목록에서 잘못 눌러 확정되면
   *   고칠 방법이 없어 두 단계로 나눈다. (공통 ConfirmDialog 는 사유 입력이 없어 쓰지 않고,
   *   버튼 자체를 2단으로 만드는 편이 목록 안에서는 덜 방해된다)
   */
  function handleConfirmClick(item: LabResultItem) {
    if (!item.result) return;

    if (confirmTargetId !== item.labOrderItemId) {
      setConfirmTargetId(item.labOrderItemId);
      return;
    }
    dispatch(
      confirmLabResultRequest(
        item.result.labResultId,
        // 확정자는 입력자와 다를 수 있으나, 별도 입력칸을 두면 목록이 폼이 된다.
        // 지금은 입력자ID를 그대로 쓴다. 로그인 사용자가 붙으면 그 값으로 바꾼다.
        // TODO(인증 연동): confirmedById 를 로그인 사용자 ID 로 교체한다.
        { confirmedById: item.result.recordedById },
        reception.receptionNo,
      ),
    );
    setConfirmTargetId("");
  }

  /** 결과 상태 표시. 미등록이면 회색. */
  function statusCell(item: LabResultItem) {
    if (!item.result) return <span className="text-slate-400">Not recorded</span>;

    const confirmed = item.result.resultStatusCode === RESULT_STATUS.CONFIRMED;
    return (
      <span className={confirmed ? "text-emerald-600" : "text-sky-600"}>
        {RESULT_STATUS_LABELS[item.result.resultStatusCode] ??
          item.result.resultStatusCode}
      </span>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      {listError ? <Alert>{resolveLabResultMessage(listError)}</Alert> : null}
      {submitError ? <Alert>{resolveLabResultMessage(submitError)}</Alert> : null}
      {lastSubmitted ? (
        <Alert variant="success">
          {toCodeLabel(testTypes.options, lastSubmitted.labItemCode)} —{" "}
          {lastSubmitted.resultValue}
          {lastSubmitted.resultUnit ? ` ${lastSubmitted.resultUnit}` : ""} (
          {lastSubmitted.abnormalYn === "Y" ? "Abnormal" : "Normal"},{" "}
          {RESULT_STATUS_LABELS[lastSubmitted.resultStatusCode] ??
            lastSubmitted.resultStatusCode}
          )
        </Alert>
      ) : null}

      <p className="text-sm text-slate-500">
        Patient{" "}
        <span className="font-semibold text-slate-800">
          {patientNames[reception.patientId] ?? "Unknown"}
        </span>
      </p>

      {/* ---------- 검사항목 목록 ---------- */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-slate-700">
          Test Items{" "}
          {listLoading ? "" : `(${unregistered.length} of ${items.length} pending)`}
        </p>

        {listLoading ? (
          <p className="text-sm text-slate-400">Loading test items...</p>
        ) : items.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
            This reception has no test items.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {items.map((item) => {
              const confirmed =
                item.result?.resultStatusCode === RESULT_STATUS.CONFIRMED;
              const isSelected = item.labOrderItemId === selectedItemId;
              return (
                <li
                  key={item.labOrderItemId}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm ${
                    isSelected ? "bg-sky-50" : ""
                  }`}
                >
                  {/*
                    확정된 항목은 고를 수 없다. 확정 후 수정은 서버가 LAB040 으로 막는다.
                    미확정 항목은 결과가 있어도 고를 수 있다 — 그게 수정이다.
                  */}
                  <button
                    type="button"
                    disabled={confirmed || submitting}
                    onClick={() => handleSelectItem(item)}
                    className={`flex flex-1 items-center gap-3 text-left ${
                      confirmed
                        ? "cursor-not-allowed text-slate-400"
                        : "text-slate-700 hover:text-sky-600"
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        isSelected ? "bg-sky-500" : "bg-slate-200"
                      }`}
                    />
                    <span className="w-32 shrink-0 font-semibold">
                      {toCodeLabel(testTypes.options, item.labItemCode)}
                    </span>
                    <span className="w-28 shrink-0">
                      {item.result ? (
                        <>
                          {item.result.resultValue}
                          {item.result.resultUnit ? ` ${item.result.resultUnit}` : ""}
                        </>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </span>
                    <span className="w-24 shrink-0 text-slate-400">
                      {item.result?.referenceRange ?? "-"}
                    </span>
                    {/* 비정상은 서버가 계산한 값이다. 눈에 띄어야 하므로 색을 준다. */}
                    <span className="w-20 shrink-0">
                      {item.result?.abnormalYn === "Y" ? (
                        <span className="rounded bg-rose-50 px-1.5 py-0.5 text-xs font-medium text-rose-600">
                          Abnormal
                        </span>
                      ) : null}
                    </span>
                    <span className="flex-1">{statusCell(item)}</span>
                  </button>

                  {/* 확정 — 결과가 있고 아직 확정 전인 항목에만 뜬다. */}
                  {item.result && !confirmed ? (
                    <Button
                      variant={
                        confirmTargetId === item.labOrderItemId ? "danger" : "secondary"
                      }
                      onClick={() => handleConfirmClick(item)}
                      disabled={submitting}
                      className="shrink-0"
                    >
                      {confirmTargetId === item.labOrderItemId
                        ? "Confirm?"
                        : "Confirm"}
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ---------- 결과 입력 ---------- */}
      {selected === null ? (
        items.length > 0 && unregistered.length === 0 ? (
          <p className="text-sm text-slate-400">
            All test items have a result. Confirm them to finish.
          </p>
        ) : items.length > 0 ? (
          <p className="text-sm text-slate-400">Select a test item above to record a result.</p>
        ) : null
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-slate-500">
            {isEditing ? "Editing" : "Recording"}{" "}
            <span className="font-semibold text-slate-800">
              {toCodeLabel(testTypes.options, selected.labItemCode)}
            </span>
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Result Value" required>
              <Input
                name="resultValue"
                value={form.resultValue}
                onChange={handleChange}
                maxLength={200}
                disabled={submitting}
                placeholder="e.g. 4.2 or Negative"
              />
              {errors.resultValue ? (
                <span className="text-xs text-rose-500">{errors.resultValue}</span>
              ) : null}
            </FormField>

            <FormField label="Unit" hint="Leave empty for qualitative results.">
              <Input
                name="resultUnit"
                value={form.resultUnit}
                onChange={handleChange}
                maxLength={20}
                disabled={submitting}
                placeholder="e.g. mg/dL"
              />
            </FormField>

            <FormField
              label="Reference Range"
              className="sm:col-span-2"
              hint={
                "Values considered normal. Numeric \"3.5-5.5\" or qualitative \"Negative\". " +
                "Separate several normal values with commas. Leave empty to skip the abnormal check."
              }
            >
              <Input
                name="referenceRange"
                value={form.referenceRange}
                onChange={handleChange}
                maxLength={50}
                disabled={submitting}
                placeholder="e.g. 3.5-5.5"
              />
            </FormField>

            {/*
              수정할 때는 입력자를 바꾸지 않는다. 최초 입력자를 바꾸는 건 기록 조작이라
              서버도 수정 요청에서 이 필드를 받지 않는다. 화면에서는 읽기 전용으로 보여준다.
            */}
            <FormField label="Recording Staff ID" required={!isEditing}>
              <Input
                name="recordedById"
                value={form.recordedById}
                onChange={handleChange}
                maxLength={20}
                disabled={submitting || isEditing}
                placeholder="e.g. STF00021"
              />
              {errors.recordedById ? (
                <span className="text-xs text-rose-500">{errors.recordedById}</span>
              ) : null}
            </FormField>

            {isEditing && selected.result ? (
              <div className="text-xs text-slate-400 sm:self-end sm:pb-2">
                Recorded {formatDateTime(selected.result.recordedAt)}
              </div>
            ) : null}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedItemId("");
                setForm(initialForm);
                setErrors({});
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Saving..."
                : isEditing
                  ? "Update Result"
                  : "Record Result"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

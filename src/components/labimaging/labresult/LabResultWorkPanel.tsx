"use client";

import { useEffect, useState, type ChangeEvent, type SubmitEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import {
  Alert,
  Button,
  ConfirmDialog,
  FormField,
  Input,
} from "@/components/common";
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

/**
 * 비정상 결과가 참고범위의 어느 쪽을 벗어났는지 알아낸다. (표시 전용)
 *
 * ⚠ 정상/비정상 판정 자체는 하지 않는다. 그건 서버가 정해서 abnormalYn 으로 내려주고,
 *   이 함수는 이미 "비정상"으로 확정된 값에 대해 화면 문구만 고른다.
 *   여기서 Y/N 을 다시 계산하면 서버와 화면이 서로 다르게 판단하기 시작한다.
 *
 * ⚠ 참고범위가 "3.5-5.5" 형태이고 결과값이 숫자일 때만 방향을 알 수 있다.
 *   정성 결과("양성")는 위아래 개념이 없어 방향 없이 "Abnormal" 로만 표시한다.
 *   (서버 LabResultService.decideAbnormalYn 의 정량/정성 구분과 같은 기준)
 */
function abnormalDirection(
  resultValue: string,
  referenceRange?: string,
): "High" | "Low" | "Abnormal" {
  if (!referenceRange) return "Abnormal";

  const bounds = referenceRange.split("-");
  if (bounds.length !== 2) return "Abnormal";

  const min = Number(bounds[0].trim());
  const max = Number(bounds[1].trim());
  const value = Number(resultValue.trim());

  if ([min, max, value].some((n) => Number.isNaN(n))) return "Abnormal";

  if (value > max) return "High";
  if (value < min) return "Low";
  // 서버는 비정상이라 했는데 범위 안이면, 참고범위가 그 뒤에 바뀐 경우다. 방향은 말하지 않는다.
  return "Abnormal";
}

/**
 * 확정 확인 문구.
 *
 * ⚠ "정말 확정하시겠습니까?" 로 끝내지 않는다. 무엇을 확정하는지(항목·결과값)를 같이 보여줘야
 *   목록에서 엉뚱한 줄의 버튼을 눌렀을 때 다이얼로그에서 알아챌 수 있다.
 * ⚠ 되돌릴 수 없다는 사실을 문구에 넣는다. 확정 후에는 수정이 서버에서 막힌다(LAB040).
 */
function confirmMessage(
  target: LabResultItem | null,
  testTypeOptions: CommonCodeOption[],
) {
  if (!target?.result) return "";

  const itemLabel = toCodeLabel(testTypeOptions, target.labItemCode);
  const unit = target.result.resultUnit ? ` ${target.result.resultUnit}` : "";

  return (
    `Confirm ${itemLabel} = ${target.result.resultValue}${unit}? ` +
    "A confirmed result can no longer be edited."
  );
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
  /** 확정 확인 다이얼로그의 대상 항목. null 이면 닫힌 상태다. */
  const [confirmTarget, setConfirmTarget] = useState<LabResultItem | null>(null);

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
    setConfirmTarget(null);

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
   * 확정을 실제로 보낸다. 다이얼로그에서 [Confirm] 을 눌렀을 때만 호출된다.
   *
   * ⚠ 확정은 되돌릴 수 없고 그 뒤로는 수정도 막힌다(서버가 LAB040 으로 거절).
   *   그래서 목록에서 바로 보내지 않고 공통 ConfirmDialog 로 한 번 더 묻는다.
   *   버튼 라벨만 바꾸는 2단 클릭도 검토했지만, 그 방식은 "되돌릴 수 없다"는 사실을
   *   전달하지 못한다. 되돌릴 수 있는 접수 제외조차 모달로 확인받고 있어(ReceptionExcludeDialog)
   *   더 위험한 확정이 더 가벼운 확인을 받는 건 앞뒤가 맞지 않는다.
   */
  function handleConfirm() {
    if (!confirmTarget?.result) return;

    dispatch(
      confirmLabResultRequest(
        confirmTarget.result.labResultId,
        // 확정자는 입력자와 다를 수 있으나, 별도 입력칸을 두면 목록이 폼이 된다.
        // 지금은 입력자ID를 그대로 쓴다. 로그인 사용자가 붙으면 그 값으로 바꾼다.
        // TODO(인증 연동): confirmedById 를 로그인 사용자 ID 로 교체한다.
        { confirmedById: confirmTarget.result.recordedById },
        reception.receptionNo,
      ),
    );
    setConfirmTarget(null);
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
            {/*
              ⚠ 머리글을 둔다. 값과 참고범위가 나란히 있는데 어느 쪽이 무엇인지 표시가 없으면
                "7.0 / 3.5-5.5" 를 보고도 무엇이 기준인지 알 수 없다.
                DataTable 을 쓰지 않는 이유는 행 안에 [Confirm] 버튼이 들어가야 하기 때문이다.
            */}
            <li className="flex items-center gap-3 bg-slate-50/70 px-4 py-2 text-xs font-medium text-slate-400">
              <span className="h-2.5 w-2.5 shrink-0" />
              <span className="w-32 shrink-0">Test Item</span>
              <span className="w-28 shrink-0">Result</span>
              <span className="w-24 shrink-0">Reference</span>
              <span className="w-20 shrink-0">Flag</span>
              <span className="flex-1">Status</span>
            </li>
            {items.map((item) => {
              const confirmed =
                item.result?.resultStatusCode === RESULT_STATUS.CONFIRMED;
              const abnormal = item.result?.abnormalYn === "Y";
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
                    {/*
                      ⚠ 비정상이면 결과값 자체를 빨갛고 굵게 쓴다.
                        배지만 따로 두면 값 열을 훑을 때 어느 값이 문제인지 눈에 안 들어온다.
                        참고범위를 바로 옆 칸에 붙여 둔 것도 같은 이유다 — 값과 범위를 나란히 봐야
                        "얼마나 벗어났는지"를 알 수 있다.
                    */}
                    <span
                      className={`w-28 shrink-0 ${
                        abnormal ? "font-semibold text-rose-600" : ""
                      }`}
                    >
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
                    {/*
                      ⚠ 비정상 여부는 서버가 계산한 값(abnormalYn)이다.
                        방향(High/Low)만 화면에서 덧붙인다 — 판정이 아니라 이미 나온 판정의 표현이다.
                        정성 결과("양성")는 위아래가 없어 방향 없이 Abnormal 로만 뜬다.
                    */}
                    <span className="w-20 shrink-0">
                      {abnormal && item.result ? (
                        <span className="rounded bg-rose-50 px-1.5 py-0.5 text-xs font-medium text-rose-600">
                          {abnormalDirection(
                            item.result.resultValue,
                            item.result.referenceRange,
                          )}
                        </span>
                      ) : null}
                    </span>
                    <span className="flex-1">{statusCell(item)}</span>
                  </button>

                  {/* 확정 — 결과가 있고 아직 확정 전인 항목에만 뜬다. */}
                  {item.result && !confirmed ? (
                    <Button
                      variant="secondary"
                      onClick={() => setConfirmTarget(item)}
                      disabled={submitting}
                      className="shrink-0"
                    >
                      Confirm
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

      {/*
        ⚠ 확정은 되돌릴 수 없다. 무엇을 확정하는지(항목·결과값)와 그 사실을 문구로 함께 밝힌다.
          danger 로 두어 되돌릴 수 없는 동작임을 색으로도 구분한다.
        ⚠ 공통 ConfirmDialog 의 기본 라벨은 한글("확인"/"취소")이라 영문으로 덮어쓴다.
          공용 컴포넌트 자체는 손대지 않는다. (12.4 화면 텍스트 언어 원칙)
      */}
      <ConfirmDialog
        open={confirmTarget !== null}
        title="Confirm Test Result"
        message={confirmMessage(confirmTarget, testTypes.options)}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        danger
        submitting={submitting}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}

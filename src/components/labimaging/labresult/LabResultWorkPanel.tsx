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
import { useLoginActor } from "@/features/labimaging/common/hooks/useLoginActor";
import { formatStaffName, useStaffDirectory } from "@/features/labimaging/common/hooks/useStaffDirectory";
import LoginActorInput from "@/components/labimaging/common/LoginActorInput";
import MicrobiologyResultWorkPanel from "@/components/labimaging/microbiologyresult/MicrobiologyResultWorkPanel";
import PathologyResultWorkPanel from "@/components/labimaging/pathologyresult/PathologyResultWorkPanel";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import type { CommonCodeOption } from "@/features/commonCode/hooks/useCommonCodeOptions";
import { resolveLabResultMessage } from "@/features/labimaging/labresult/messages";
import { isSuspiciouslyExtreme, validateNumericResult } from "@/features/labimaging/common/validation";
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
  type LabResultDetailRequest,
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
 * 결과항목(상세) 방식인가 (6차). entryItems 가 있으면(비어있지 않으면) 이 검사는
 * 단일 Result Value 대신 항목별 입력행으로 값을 받는다.
 */
function isDetailMode(item: LabResultItem): boolean {
  return Boolean(item.entryItems && item.entryItems.length > 0);
}

/** 목록 행의 결과값 열에 보여줄 문구. 결과항목 방식이면 값들을 쉼표로 나열한다. */
function resultSummaryText(item: LabResultItem): string {
  if (!item.result) return "";
  if (item.result.details && item.result.details.length > 0) {
    return item.result.details
      .map((d) => `${d.resultValue}${d.resultUnit ? ` ${d.resultUnit}` : ""}`)
      .join(", ");
  }
  return `${item.result.resultValue ?? ""}${
    item.result.resultUnit ? ` ${item.result.resultUnit}` : ""
  }`;
}

/** 입력한 항목별 값 중 빈 값을 뺀 나머지만 요청 형태로 담는다. (부분 입력 허용 — 6차) */
function buildDetailsPayload(
  detailValues: Record<string, string>,
): LabResultDetailRequest[] {
  return Object.entries(detailValues)
    .filter(([, value]) => value.trim().length > 0)
    .map(([resultItemCode, value]) => ({
      resultItemCode,
      resultValue: value.trim(),
    }));
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

  if (target.result.details && target.result.details.length > 0) {
    return (
      `Confirm ${itemLabel} (${target.result.details.length} result item(s))? ` +
      "A confirmed result can no longer be edited."
    );
  }

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
  /** 결과항목(상세) 방식의 입력값 — 항목코드 → 입력값 (6차) */
  detailValues: {} as Record<string, string>,
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
  /** 결과항목 방식(6차)의 항목명 표시용. 서비스 내부 Enum 이 아니라 admin 공통코드다. */
  const resultItemCodes = useCommonCodeOptions("RESULT_ITEM_CD");

  /*
   * ⚠ 결과는 환자 진료에 직접 쓰이는 값이라, 누구 결과를 입력하는지 폼 옆에서
   *   다시 확인할 수 있게 이름을 띄운다. (검체 판정 패널과 같은 이유)
   */
  const { names: patientNames } = usePatientNames([reception.patientId]);
  // 수정 시 "Recorded By" 에 보여줄 최초 입력자 이름. (직원ID 화면 노출 정리, 2026-10-05)
  const { nameById: staffNameById, loading: staffLoading } = useStaffDirectory();

  /** 입력자·확정자는 로그인 사용자다. (5차 Phase 2 — 예전의 직원ID 직접 입력칸을 대체) */
  const { actorId, actorName, signedIn } = useLoginActor();

  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  /** 결과항목(상세) 방식에서 "하나도 입력 안 함" 같은 폼 전체 단위 오류. (6차) */
  const [detailsError, setDetailsError] = useState("");
  /** 결과항목(상세) 방식의 행별 숫자 형식 오류. 항목코드 → 메시지. (Phase 3-A) */
  const [detailFieldErrors, setDetailFieldErrors] = useState<Record<string, string>>({});
  /** 비정상적으로 크거나 작은 값 확인창(04번 지시서 Phase 4-4) — true 면 한 번 더 확인받는다. */
  const [extremeConfirmOpen, setExtremeConfirmOpen] = useState(false);
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
  /**
   * 이 목록의 폼으로 결과를 받는 건 일반검사(GENERAL) 항목뿐이다. (5차 D1)
   * 미생물·병리 항목은 아래 전용 패널에서 등록한다 — 서버도 일반 결과 API 로는 LAB079 로 막는다.
   */
  const isGeneral = (item: LabResultItem) => (item.resultType ?? "GENERAL") === "GENERAL";
  const unregistered = items.filter((i) => isGeneral(i) && !i.result);
  const microItems = items.filter((i) => i.resultType === "MICROBIOLOGY");
  const pathologyItems = items.filter((i) => i.resultType === "PATHOLOGY");

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
    setDetailsError("");
    setDetailFieldErrors({});
    setConfirmTarget(null);

    if (isDetailMode(item)) {
      // 결과항목 방식: 항목별 입력값을 채운다. 기존 결과가 있으면 그 값으로, 없으면 빈 칸으로.
      const detailValues: Record<string, string> = {};
      for (const entryItem of item.entryItems ?? []) {
        const existing = item.result?.details?.find(
          (d) => d.resultItemCode === entryItem.resultItemCode,
        );
        detailValues[entryItem.resultItemCode] = existing?.resultValue ?? "";
      }
      setForm({
        ...initialForm,
        detailValues,
        recordedById: item.result?.recordedById ?? "",
      });
    } else if (item.result) {
      setForm({
        ...initialForm,
        resultValue: item.result.resultValue ?? "",
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

  function handleDetailChange(resultItemCode: string, value: string) {
    setForm((prev) => ({
      ...prev,
      detailValues: { ...prev.detailValues, [resultItemCode]: value },
    }));
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    // 결과항목 방식은 단일 Result Value 가 없다 — 항목별 입력은 제출 시 별도로 확인한다.
    if (!(selected && isDetailMode(selected))) {
      if (!form.resultValue.trim()) {
        next.resultValue = "Result value is required.";
      } else {
        // 서버(LAB105/106)와 같은 기준 — 참고범위가 수치 범위인데 결과값이 숫자가 아니거나
        // 범위 자체가 뒤집혀 있으면 미리 막는다. (04번 지시서 Phase 3-A)
        const numericError = validateNumericResult(form.resultValue, form.referenceRange);
        if (numericError) next.resultValue = numericError;
      }
    }
    // 등록일 때만 입력자가 필요하다. 입력자는 로그인 사용자라 로그인 여부만 본다.
    if (!isEditing && !signedIn) next.recordedById = "Sign in to register a result.";
    return next;
  }

  /**
   * 결과항목(상세) 방식의 행별 숫자 형식 오류. (Phase 3-A)
   * 참고범위는 서버가 정해서 읽기 전용으로 보여주는 값(entryItem.referenceRange)이라,
   * 입력값만 그 범위에 맞는 숫자 형식인지 확인한다.
   */
  function validateDetailValues(): Record<string, string> {
    const next: Record<string, string> = {};
    if (!selected) return next;
    for (const entryItem of selected.entryItems ?? []) {
      const value = form.detailValues[entryItem.resultItemCode] ?? "";
      if (!value.trim()) continue;
      const numericError = validateNumericResult(value, entryItem.referenceRange ?? "");
      if (numericError) next[entryItem.resultItemCode] = numericError;
    }
    return next;
  }

  /** 선택한 항목·입력값 중 비정상적으로 크거나 작은 값이 있는지. (Phase 4-4) */
  function hasExtremeValue(): boolean {
    if (!selected) return false;
    if (isDetailMode(selected)) {
      return (selected.entryItems ?? []).some((entryItem) => {
        const value = form.detailValues[entryItem.resultItemCode] ?? "";
        return value.trim() && isSuspiciouslyExtreme(value, entryItem.referenceRange ?? "");
      });
    }
    return isSuspiciouslyExtreme(form.resultValue, form.referenceRange);
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!selected) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (isDetailMode(selected)) {
      const details = buildDetailsPayload(form.detailValues);
      if (details.length === 0) {
        setDetailsError("Enter at least one result item.");
        return;
      }
      // 서버(LAB105/106)와 같은 기준으로 행별 숫자 형식을 먼저 확인한다. (Phase 3-A)
      const nextDetailFieldErrors = validateDetailValues();
      setDetailFieldErrors(nextDetailFieldErrors);
      if (Object.keys(nextDetailFieldErrors).length > 0) return;
      setDetailsError("");
    }

    // 비정상적으로 크거나 작은 값은 한 번 더 확인받는다(제출을 막지 않는다). (Phase 4-4)
    if (hasExtremeValue()) {
      setExtremeConfirmOpen(true);
      return;
    }
    submitResult();
  }

  function handleConfirmExtreme() {
    setExtremeConfirmOpen(false);
    submitResult();
  }

  function submitResult() {
    if (!selected) return;

    if (isDetailMode(selected)) {
      const details = buildDetailsPayload(form.detailValues);

      if (selected.result) {
        dispatch(
          updateLabResultRequest(
            selected.result.labResultId,
            { details },
            reception.receptionNo,
          ),
        );
      } else {
        dispatch(
          createLabResultRequest(
            { labOrderItemId: selected.labOrderItemId, recordedById: actorId, details },
            reception.receptionNo,
          ),
        );
      }
    } else {
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
              recordedById: actorId,
            },
            reception.receptionNo,
          ),
        );
      }
    }

    setSelectedItemId("");
    setForm(initialForm);
    setErrors({});
    setDetailsError("");
    setDetailFieldErrors({});
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
        // 확정자는 로그인 사용자다(UC-RST-05). 서버도 세션 기준으로 기록하고, 이 값은 과도기(D2)용이다.
        // (예전 TODO(인증 연동) — 입력자ID 를 확정자로 보내던 임시 처리를 해소했다. 5차 Phase 2)
        { confirmedById: actorId },
        reception.receptionNo,
      ),
    );
    setConfirmTarget(null);
  }

  /** 결과 상태 표시. 미등록이면 회색. */
  function statusCell(item: LabResultItem) {
    if (item.resultType === "MICROBIOLOGY")
      return <span className="text-slate-500">Microbiology — see panel below</span>;
    if (item.resultType === "PATHOLOGY")
      return <span className="text-slate-500">Pathology — see panel below</span>;
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
          {lastSubmitted.details && lastSubmitted.details.length > 0
            ? `${lastSubmitted.details.length} result item(s)`
            : `${lastSubmitted.resultValue}${
                lastSubmitted.resultUnit ? ` ${lastSubmitted.resultUnit}` : ""
              }`}{" "}
          (
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
                    disabled={confirmed || submitting || !isGeneral(item)}
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
                        resultSummaryText(item)
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </span>
                    <span className="w-24 shrink-0 text-slate-400">
                      {item.result?.details && item.result.details.length > 0
                        ? "Multiple"
                        : (item.result?.referenceRange ?? "-")}
                    </span>
                    {/*
                      ⚠ 비정상 여부는 서버가 계산한 값(abnormalYn)이다.
                        방향(High/Low)만 화면에서 덧붙인다 — 판정이 아니라 이미 나온 판정의 표현이다.
                        정성 결과("양성")는 위아래가 없어 방향 없이 Abnormal 로만 뜬다.
                        결과항목 방식(resultValue 없음)은 방향을 알 수 없어 Abnormal 로만 뜬다.
                    */}
                    <span className="w-20 shrink-0">
                      {abnormal && item.result ? (
                        <span className="rounded bg-rose-50 px-1.5 py-0.5 text-xs font-medium text-rose-600">
                          {item.result.resultValue
                            ? abnormalDirection(
                                item.result.resultValue,
                                item.result.referenceRange,
                              )
                            : "Abnormal"}
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
            {isDetailMode(selected) ? (
              /*
                ⚠ 결과항목 방식(6차)에서는 단일 Result Value 대신 검사별 결과항목 기준(entryItems)
                  으로 입력행을 만든다. 단위·참고범위는 서버가 정한 값이라 읽기 전용으로만 보여준다
                  (버릴 필요 없이 그대로 서버가 다시 계산해 응답한다).
                ⚠ 부분 입력을 허용한다(partialDetailsAllowed) — 모든 행을 채우지 않아도 제출할 수
                  있고, 빈 칸은 handleSubmit 에서 걸러진다.
              */
              <div className="space-y-3 sm:col-span-2">
                <div className="flex items-center gap-3 px-1 text-xs font-medium text-slate-400">
                  <span className="w-32 shrink-0">Result Item</span>
                  <span className="flex-1">Value</span>
                  <span className="w-20 shrink-0">Unit</span>
                  <span className="w-24 shrink-0">Reference</span>
                </div>
                {(selected.entryItems ?? []).map((entryItem) => {
                  const existingDetail = selected.result?.details?.find(
                    (d) => d.resultItemCode === entryItem.resultItemCode,
                  );
                  const unit = existingDetail?.resultUnit ?? entryItem.defaultUnit;
                  const referenceRange =
                    existingDetail?.referenceRange ?? entryItem.referenceRange;
                  const abnormalDetail = existingDetail?.abnormalYn === "Y";
                  const fieldError = detailFieldErrors[entryItem.resultItemCode];
                  return (
                    <div key={entryItem.resultItemCode} className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="w-32 shrink-0 text-sm font-medium text-slate-700">
                          {toCodeLabel(resultItemCodes.options, entryItem.resultItemCode)}
                        </span>
                        <Input
                          className={`flex-1 ${
                            fieldError
                              ? "border-rose-400"
                              : abnormalDetail
                                ? "border-rose-400 text-rose-600"
                                : ""
                          }`}
                          value={form.detailValues[entryItem.resultItemCode] ?? ""}
                          onChange={(e) =>
                            handleDetailChange(entryItem.resultItemCode, e.target.value)
                          }
                          maxLength={200}
                          disabled={submitting}
                          placeholder="e.g. 4.2 or Negative"
                        />
                        <span className="w-20 shrink-0 text-xs text-slate-400">
                          {unit ?? "-"}
                        </span>
                        <span className="w-24 shrink-0 text-xs text-slate-400">
                          {referenceRange ?? "-"}
                        </span>
                      </div>
                      {fieldError ? (
                        <span className="block pl-[8.75rem] text-xs text-rose-500">
                          {fieldError}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
                {detailsError ? (
                  <span className="text-xs text-rose-500">{detailsError}</span>
                ) : null}
              </div>
            ) : (
              <>
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
              </>
            )}

            {/*
              수정할 때는 입력자를 바꾸지 않는다. 최초 입력자를 바꾸는 건 기록 조작이라
              서버도 수정 요청에서 이 필드를 받지 않는다. 화면에서는 읽기 전용으로 보여준다.
            */}
            <FormField label="Recorded By" required={!isEditing}>
              {/* 등록: 로그인 사용자로 기록된다. 수정: 최초 입력자를 그대로 보여준다(바꿀 수 없다). */}
              {isEditing ? (
                <Input
                  name="recordedById"
                  value={formatStaffName(form.recordedById, staffNameById, staffLoading).text}
                  title={formatStaffName(form.recordedById, staffNameById, staffLoading).title}
                  readOnly
                  disabled
                />
              ) : (
                <LoginActorInput name="recordedById" actorName={actorName} signedIn={signedIn} />
              )}
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
                setDetailsError("");
                setDetailFieldErrors({});
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
      {/* ---------- 미생물 결과 (5차 Phase 3) — 접수당 미생물 항목 1개일 때만 입력할 수 있다 ---------- */}
      {microItems.length === 1 ? (
        <MicrobiologyResultWorkPanel reception={reception} microItem={microItems[0]} />
      ) : microItems.length > 1 ? (
        <Alert>
          This reception has more than one microbiology test item. Only one is supported per reception.
        </Alert>
      ) : null}

      {/* ---------- 병리 결과 (5차 Phase 4) — 병리 항목마다 결과 1건 ---------- */}
      {pathologyItems.length > 0 ? (
        <PathologyResultWorkPanel reception={reception} pathologyItems={pathologyItems} />
      ) : null}

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

      {/* 비정상적으로 크거나 작은 값 확인창 — 제출을 막지 않고 한 번 더 확인만 받는다. (Phase 4-4) */}
      <ConfirmDialog
        open={extremeConfirmOpen}
        title="Unusual Value"
        message="This value is unusually large or small. Please check the decimal point or unit before continuing."
        confirmLabel="Continue"
        cancelLabel="Cancel"
        submitting={submitting}
        onConfirm={handleConfirmExtreme}
        onCancel={() => setExtremeConfirmOpen(false)}
      />
    </div>
  );
}

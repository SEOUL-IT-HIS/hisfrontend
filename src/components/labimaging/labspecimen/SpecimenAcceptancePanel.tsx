"use client";

import { useEffect, useState, type ChangeEvent, type SubmitEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, FormField, Input, Select } from "@/components/common";
import { usePatientNames } from "@/features/labimaging/common/hooks/usePatientNames";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import { resolveLabSpecimenMessage } from "@/features/labimaging/labspecimen/messages";
import {
  acceptSpecimenRequest,
  fetchSpecimensRequest,
  selectLastAcceptedSpecimen,
  selectSpecimenAcceptError,
  selectSpecimenAccepting,
  selectSpecimens,
  selectSpecimensError,
  selectSpecimensLoading,
} from "@/features/labimaging/labspecimen/slice";
import {
  FITNESS_STATUS_LABELS,
  FITNESS_STATUS_OPTIONS,
  RECOLLECTION_YN_OPTIONS,
  SPECIMEN_TYPE_LABELS,
  type FitnessStatus,
  type SpecimenSummary,
} from "@/features/labimaging/labspecimen/types";
import type { LabWorklistItem } from "@/features/labimaging/laborder/types";

/**
 * 선택한 접수의 검체를 인수하고 적합/부적합을 판정하는 영역.
 * 대응 유스케이스: UC-SPC-04 검체적합성판정 (ZP2-75 인수 / ZP2-78 판정 / ZP2-74 부적합·재채취)
 *
 * ⚠ 판정 대상은 "검체"라 접수보다 한 단계 아래다. 그래서 목록의 행이 되지 못하고
 *   접수를 고른 뒤 이 안에서 검체를 다시 고르는 2단 구조가 된다.
 *   (접수 1건에 검체가 여러 건 달리는 1:N 구조 — 목록을 접수로 고정한 이유)
 *
 * ⚠ 인수와 판정을 한 번에 보낸다. SPECIMEN_ACCEPTANCE 는 인수정보와 판정결과가 한 행이고
 *   accepted_at / accepted_by_id / fitness_status_code 가 모두 NOT NULL 이라,
 *   "인수만 하고 판정은 나중에" 라는 중간 상태를 테이블이 표현하지 못한다.
 *
 * ⚠ 적합(FIT)을 고르면 부적합사유와 재채취 입력을 잠근다.
 *   서버가 "적합인데 사유 있음", "적합인데 재채취 요청"을 LAB998 로 거절하는데,
 *   화면에서 아예 못 넣게 하면 그 왕복이 생기지 않는다. (최종 판단은 여전히 서버가 한다)
 */

/** 부적합 사유 공통코드 그룹. */
const SPECIMEN_REJECT_CD = "SPECIMEN_REJECT_CD";

const initialForm = {
  acceptedAt: "",
  acceptedById: "",
  fitnessStatus: "FIT" as FitnessStatus,
  unfitReasonCode: "",
  recollectionRequestedYn: "N" as "Y" | "N",
};

type FormState = typeof initialForm;
type FieldErrors = Partial<Record<keyof FormState, string>>;

/** 백엔드가 ISO 문자열로 준다. 초 단위는 화면에서 의미가 없어 분까지만 보여준다. */
function formatDateTime(value?: string) {
  if (!value) return "-";
  return value.replace("T", " ").slice(0, 16);
}

export default function SpecimenAcceptancePanel({
  reception,
}: {
  reception: LabWorklistItem;
}) {
  const dispatch = useDispatch<AppDispatch>();

  const specimens = useSelector(selectSpecimens);
  const listLoading = useSelector(selectSpecimensLoading);
  const listError = useSelector(selectSpecimensError);
  const accepting = useSelector(selectSpecimenAccepting);
  const acceptError = useSelector(selectSpecimenAcceptError);
  const lastAccepted = useSelector(selectLastAcceptedSpecimen);

  const rejectReasons = useCommonCodeOptions(SPECIMEN_REJECT_CD);

  /*
   * ⚠ 판정은 되돌릴 수 없다. 검체 1건당 판정 1건이라 잘못 누르면 LAB022 로 막히고 수정도 안 된다.
   *   누구 검체를 판정하는지 폼 옆에서 다시 확인할 수 있게 이름을 띄운다.
   */
  const { names: patientNames } = usePatientNames([reception.patientId]);

  const [selectedSpecimenId, setSelectedSpecimenId] = useState<string>("");
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});

  /*
   * 검체 목록은 "검체" 탭과 같은 slice 를 쓴다.
   * 탭을 거치지 않고 바로 들어올 수 있어 여기서도 불러온다.
   * (resetSpecimenState 는 부르지 않는다 — 방금 등록한 검체까지 지워버린다)
   */
  useEffect(() => {
    dispatch(fetchSpecimensRequest(reception.receptionNo));
  }, [dispatch, reception.receptionNo]);

  /*
   * ⚠ 판정 여부를 서버에서 걸러 받지 않고 여기서 나눈다. 백엔드에 judgedYn 필터가 있지만 안 쓴다.
   *   판정이 끝난 검체도 목록에 회색으로 남겨야 "3건 중 2건 판정" 이 보이는데,
   *   서버에서 미판정만 받아오면 방금 판정한 줄이 사라져 결과를 확인할 수 없다.
   *   unjudged 는 "몇 건 남았는지" 세는 용도이고, 표시는 specimens 전체로 한다.
   */
  const unjudged = specimens.filter((s) => !s.fitnessStatus);
  const selected = specimens.find((s) => s.specimenId === selectedSpecimenId) ?? null;
  const isUnfit = form.fitnessStatus === "UNFIT";

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;

    // 적합으로 되돌리면 부적합 전용 입력값을 남기지 않는다. 서버가 거절하는 조합이다.
    if (name === "fitnessStatus" && value === "FIT") {
      setForm((prev) => ({
        ...prev,
        fitnessStatus: "FIT",
        unfitReasonCode: "",
        recollectionRequestedYn: "N",
      }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!form.acceptedAt) next.acceptedAt = "인수일시는 필수입니다.";
    if (!form.acceptedById.trim()) next.acceptedById = "인수자ID는 필수입니다.";
    // 부적합일 때만 사유가 필수다. 서버(SpecimenAcceptanceService.validateJudgment)와 같은 규칙.
    if (isUnfit && !form.unfitReasonCode)
      next.unfitReasonCode = "부적합 판정에는 사유가 필요합니다.";
    return next;
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!selected) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    dispatch(
      acceptSpecimenRequest(
        selected.specimenId,
        {
          acceptedAt: form.acceptedAt,
          acceptedById: form.acceptedById.trim(),
          fitnessStatus: form.fitnessStatus,
          // 적합이면 사유를 아예 보내지 않는다. 빈 문자열도 서버에서는 "값이 있음"이 아니다.
          unfitReasonCode: isUnfit ? form.unfitReasonCode : undefined,
          recollectionRequestedYn: form.recollectionRequestedYn,
        },
        reception.receptionNo,
      ),
    );
    // 판정이 끝난 검체는 목록에서 선택 대상이 아니게 되므로 선택을 푼다.
    setSelectedSpecimenId("");
    setForm(initialForm);
    setErrors({});
  }

  /** 판정 결과 표시. 미판정이면 회색. */
  function fitnessCell(s: SpecimenSummary) {
    if (!s.fitnessStatus) return <span className="text-slate-400">미판정</span>;
    return (
      <span
        className={s.fitnessStatus === "FIT" ? "text-emerald-600" : "text-rose-600"}
      >
        {FITNESS_STATUS_LABELS[s.fitnessStatus]}
      </span>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      {listError ? <Alert>{resolveLabSpecimenMessage(listError)}</Alert> : null}
      {acceptError ? <Alert>{resolveLabSpecimenMessage(acceptError)}</Alert> : null}
      {lastAccepted ? (
        <Alert variant="success">
          {lastAccepted.specimenBarcode} — {FITNESS_STATUS_LABELS[lastAccepted.fitnessStatus]}{" "}
          판정이 등록되었습니다.
        </Alert>
      ) : null}

      <p className="text-sm text-slate-500">
        대상 환자{" "}
        <span className="font-semibold text-slate-800">
          {patientNames[reception.patientId] ?? "미상"}
        </span>
      </p>

      {/* ---------- 판정 대상 검체 고르기 ---------- */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-slate-700">
          판정 대상 검체 {listLoading ? "" : `${unjudged.length}건 / 전체 ${specimens.length}건`}
        </p>

        {listLoading ? (
          <p className="text-sm text-slate-400">검체를 불러오는 중입니다...</p>
        ) : specimens.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
            등록된 검체가 없습니다. [검체] 탭에서 먼저 등록하세요.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {specimens.map((s) => {
              const judged = Boolean(s.fitnessStatus);
              const isSelected = s.specimenId === selectedSpecimenId;
              return (
                <li key={s.specimenId}>
                  {/*
                    판정이 끝난 검체는 고를 수 없다. 검체 1건당 판정 1건이라
                    다시 보내면 서버가 LAB022 로 거절한다.
                  */}
                  <button
                    type="button"
                    disabled={judged || accepting}
                    onClick={() => setSelectedSpecimenId(s.specimenId)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                      judged
                        ? "cursor-not-allowed bg-slate-50/60 text-slate-400"
                        : isSelected
                          ? "bg-sky-50 text-slate-800"
                          : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        isSelected ? "bg-sky-500" : "bg-slate-200"
                      }`}
                    />
                    <span className="w-36 shrink-0 font-semibold">
                      {s.specimenBarcode}
                    </span>
                    <span className="w-12 shrink-0">
                      {SPECIMEN_TYPE_LABELS[s.specimenType] ?? s.specimenType}
                    </span>
                    <span className="flex-1 text-slate-500">
                      {formatDateTime(s.collectedAt)}
                    </span>
                    <span className="shrink-0">{fitnessCell(s)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ---------- 판정 입력 ---------- */}
      {selected === null ? (
        specimens.length > 0 && unjudged.length === 0 ? (
          <p className="text-sm text-slate-400">
            모든 검체의 판정이 끝났습니다.
          </p>
        ) : specimens.length > 0 ? (
          <p className="text-sm text-slate-400">위에서 판정할 검체를 고르세요.</p>
        ) : null
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-slate-500">
            대상 검체{" "}
            <span className="font-semibold text-slate-800">
              {selected.specimenBarcode}
            </span>
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="인수일시" required>
              <Input
                type="datetime-local"
                name="acceptedAt"
                value={form.acceptedAt}
                onChange={handleChange}
                disabled={accepting}
              />
              {errors.acceptedAt ? (
                <span className="text-xs text-rose-500">{errors.acceptedAt}</span>
              ) : null}
            </FormField>

            <FormField label="인수자ID" required>
              <Input
                name="acceptedById"
                value={form.acceptedById}
                onChange={handleChange}
                maxLength={20}
                disabled={accepting}
                placeholder="예: STF00021"
              />
              {errors.acceptedById ? (
                <span className="text-xs text-rose-500">{errors.acceptedById}</span>
              ) : null}
            </FormField>

            <FormField label="적합상태" required>
              <Select
                name="fitnessStatus"
                value={form.fitnessStatus}
                onChange={handleChange}
                options={[...FITNESS_STATUS_OPTIONS]}
                disabled={accepting}
              />
            </FormField>

            <FormField
              label="부적합사유"
              required={isUnfit}
              hint={isUnfit ? undefined : "부적합을 선택하면 입력할 수 있습니다."}
            >
              <Select
                name="unfitReasonCode"
                value={form.unfitReasonCode}
                onChange={handleChange}
                options={rejectReasons.options}
                placeholder={rejectReasons.loading ? "불러오는 중..." : "선택하세요"}
                disabled={!isUnfit || accepting || rejectReasons.loading}
              />
              {errors.unfitReasonCode ? (
                <span className="text-xs text-rose-500">{errors.unfitReasonCode}</span>
              ) : null}
            </FormField>

            <FormField
              label="재채취"
              hint={isUnfit ? undefined : "부적합을 선택하면 입력할 수 있습니다."}
            >
              <Select
                name="recollectionRequestedYn"
                value={form.recollectionRequestedYn}
                onChange={handleChange}
                options={[...RECOLLECTION_YN_OPTIONS]}
                disabled={!isUnfit || accepting}
              />
            </FormField>
          </div>

          {rejectReasons.error ? <Alert>{rejectReasons.error}</Alert> : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={accepting}>
              {accepting ? "판정 중..." : "판정 등록"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

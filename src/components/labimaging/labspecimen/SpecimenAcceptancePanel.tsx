"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type SubmitEvent,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, FormField, Input, Select } from "@/components/common";
import { usePatientNames } from "@/features/labimaging/common/hooks/usePatientNames";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import { resolveLabSpecimenMessage } from "@/features/labimaging/labspecimen/messages";
import {
  acceptSpecimenRequest,
  fetchSpecimensRequest,
  lookupSpecimenByBarcodeRequest,
  resetBarcodeLookup,
  selectBarcodeLookupError,
  selectBarcodeLookupLoading,
  selectBarcodeLookupResult,
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
  type BarcodeMatch,
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
 *
 * ⚠ 검체를 지목하는 방법이 두 가지다. (ZP2-75)
 *   1) 아래 목록에서 클릭  2) 위쪽 칸에 바코드 입력
 *   2번이 1번을 대체하지 않는다. 검사실에 도착한 용기의 바코드를 보고 치는 입력 수단을 하나 더한 것이고,
 *   어느 쪽으로 골라도 판정은 같은 API 로 간다.
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

/**
 * 바코드로 찾은 검체가 지금 보고 있는 접수의 것인지 판단한다. (ZP2-75)
 *
 * ⚠ 이 판단을 서버에 맡기지 않는다. 서버는 화면이 어느 접수를 보고 있는지 모른다.
 *   접수번호를 파라미터로 보내 비교시키면 화면이 이미 아는 값을 왕복시키는 꼴이 된다.
 *
 * ⚠ 접수번호만 비교하면 환자·오더 대조까지 끝난다.
 *   SPECIMEN → LAB_RECEPTION → LAB_ORDER → patient_id 로 이어지므로
 *   접수번호가 같으면 환자와 오더도 같다. 환자를 따로 조회하지 않는 이유다.
 */
function matchBarcode(
  found: SpecimenSummary | null,
  receptionNo: string,
): BarcodeMatch | null {
  if (!found) return null;
  if (found.receptionNo !== receptionNo) {
    return { kind: "OTHER_RECEPTION", specimen: found };
  }
  if (found.fitnessStatus) return { kind: "JUDGED", specimen: found };
  return { kind: "OK", specimen: found };
}

/**
 * 대조 결과 문구.
 *
 * ⚠ 서버 메시지가 아니라 화면 문구다. resolveLabSpecimenMessage 는 서버 코드(LAB020 등)를
 *   문구로 바꾸는 함수인데, 이 판단은 애초에 서버가 하지 않아 대응하는 코드가 없다.
 *
 * ⚠ 다른 접수일 때 그 검체의 접수번호를 함께 보여준다.
 *   "아니다"만 알려주면 담당자가 어느 접수로 가야 하는지 알 수 없다.
 */
function barcodeMatchMessage(match: BarcodeMatch): string {
  switch (match.kind) {
    case "OTHER_RECEPTION":
      return `This specimen does not belong to the selected reception. (Reception No. of the entered specimen: ${match.specimen.receptionNo})`;
    case "JUDGED":
      return `This specimen has already been accepted and assessed. (${match.specimen.specimenBarcode})`;
    default:
      return `${match.specimen.specimenBarcode} has been selected for assessment.`;
  }
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

  const barcodeLookupLoading = useSelector(selectBarcodeLookupLoading);
  const barcodeLookupError = useSelector(selectBarcodeLookupError);
  const barcodeLookupResult = useSelector(selectBarcodeLookupResult);

  const rejectReasons = useCommonCodeOptions(SPECIMEN_REJECT_CD);

  /*
   * ⚠ 판정은 되돌릴 수 없다. 검체 1건당 판정 1건이라 잘못 누르면 LAB022 로 막히고 수정도 안 된다.
   *   누구 검체를 판정하는지 폼 옆에서 다시 확인할 수 있게 이름을 띄운다.
   */
  const { names: patientNames } = usePatientNames([reception.patientId]);

  /** 목록에서 직접 클릭해 고른 검체. 바코드로 고른 것과 구분한다. (아래 selectedSpecimenId 주석 참고) */
  const [manualSelectedId, setManualSelectedId] = useState<string>("");
  const [barcodeInput, setBarcodeInput] = useState<string>("");
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});

  /*
   * 검체 목록은 "검체" 탭과 같은 slice 를 쓴다.
   * 탭을 거치지 않고 바로 들어올 수 있어 여기서도 불러온다.
   * (resetSpecimenState 는 부르지 않는다 — 방금 등록한 검체까지 지워버린다)
   *
   * ⚠ 바코드 조회 결과는 여기서 따로 지운다.
   *   이 컴포넌트는 부모가 key={labReceptionId} 로 접수마다 새로 마운트시키지만,
   *   그렇게 초기화되는 건 위의 useState 들뿐이다. 조회 결과는 store 에 있어 리마운트로 사라지지 않는다.
   *   지우지 않으면 접수를 바꿨는데 이전 접수에서 조회한 검체가 그대로 선택돼 있다.
   */
  useEffect(() => {
    dispatch(resetBarcodeLookup());
    dispatch(fetchSpecimensRequest(reception.receptionNo));
  }, [dispatch, reception.receptionNo]);

  /*
   * ⚠ 판정 여부를 서버에서 걸러 받지 않고 여기서 나눈다. 백엔드에 judgedYn 필터가 있지만 안 쓴다.
   *   판정이 끝난 검체도 목록에 회색으로 남겨야 "3건 중 2건 판정" 이 보이는데,
   *   서버에서 미판정만 받아오면 방금 판정한 줄이 사라져 결과를 확인할 수 없다.
   *   unjudged 는 "몇 건 남았는지" 세는 용도이고, 표시는 specimens 전체로 한다.
   */
  const unjudged = specimens.filter((s) => !s.fitnessStatus);

  /*
   * ⚠ 바코드 조회 결과를 useEffect 안에서 setSelectedSpecimenId 로 옮기지 않는다.
   *   그게 react-hooks/set-state-in-effect 에 걸린다(ConsentWorkPanel 에서 겪었던 규칙).
   *   대신 렌더 중에 계산한다. 상태가 하나 줄고, "무엇이 선택인가"가 한 줄에 드러난다.
   */
  const barcodeMatch = useMemo(
    () => matchBarcode(barcodeLookupResult, reception.receptionNo),
    [barcodeLookupResult, reception.receptionNo],
  );

  /*
   * 실제로 선택된 검체.
   *
   * ⚠ 목록 클릭과 바코드 조회 중 "나중에 한 쪽"이 이긴다.
   *   클릭하면 조회 결과를 지우고(handleSelectSpecimen), 조회하면 클릭 선택을 지운다(handleBarcodeLookup).
   *   그래서 둘 중 하나만 값을 갖고, 아래 || 는 우선순위가 아니라 "남아 있는 쪽"을 고르는 것이다.
   *
   * ⚠ OK 가 아닌 대조 결과(다른 접수·판정 완료)는 선택하지 않는다.
   *   선택해 버리면 판정 폼이 열린다. 폼은 selected 가 있으면 열리게 돼 있어서,
   *   판정 완료 검체를 선택하면 다시 판정을 보낼 수 있게 되고 서버가 LAB022 로 막는다.
   *   목록에서도 판정 완료 행은 클릭을 막아 뒀으니(disabled) 바코드 쪽도 같아야 한다.
   */
  const selectedSpecimenId =
    manualSelectedId ||
    (barcodeMatch?.kind === "OK" ? barcodeMatch.specimen.specimenId : "");

  const selected = specimens.find((s) => s.specimenId === selectedSpecimenId) ?? null;
  const isUnfit = form.fitnessStatus === "UNFIT";

  /** 바코드로 검체를 찾는다. 직전에 클릭으로 골라 둔 것이 있으면 이 조회가 이긴다. */
  function handleBarcodeLookup() {
    const barcode = barcodeInput.trim();
    if (!barcode) return;

    setManualSelectedId("");
    setErrors({});
    dispatch(lookupSpecimenByBarcodeRequest(barcode));
  }

  /** 목록에서 검체를 클릭했다. 직전 바코드 조회 결과와 그 문구를 지운다. */
  function handleSelectSpecimen(specimenId: string) {
    setManualSelectedId(specimenId);
    setBarcodeInput("");
    dispatch(resetBarcodeLookup());
  }

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
    if (!form.acceptedAt) next.acceptedAt = "Acceptance date and time is required.";
    if (!form.acceptedById.trim()) next.acceptedById = "Accepting staff ID is required.";
    // 부적합일 때만 사유가 필수다. 서버(SpecimenAcceptanceService.validateJudgment)와 같은 규칙.
    if (isUnfit && !form.unfitReasonCode)
      next.unfitReasonCode = "An unfit assessment requires a reason.";
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
    /*
     * 판정이 끝난 검체는 목록에서 선택 대상이 아니게 되므로 선택을 푼다.
     *
     * ⚠ 바코드 조회 결과도 같이 지운다. 그 결과는 조회 시점의 값이라 fitnessStatus 가 비어 있고,
     *   남겨두면 방금 판정한 검체가 계속 "판정 대상"으로 선택된 채로 있다.
     */
    setManualSelectedId("");
    setBarcodeInput("");
    dispatch(resetBarcodeLookup());
    setForm(initialForm);
    setErrors({});
  }

  /** 판정 결과 표시. 미판정이면 회색. */
  function fitnessCell(s: SpecimenSummary) {
    if (!s.fitnessStatus) return <span className="text-slate-400">Not assessed</span>;
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
          assessment registered.
        </Alert>
      ) : null}

      <p className="text-sm text-slate-500">
        Patient{" "}
        <span className="font-semibold text-slate-800">
          {patientNames[reception.patientId] ?? "Unknown"}
        </span>
      </p>

      {/* ---------- 바코드로 검체 지목 (ZP2-75) ---------- */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-slate-700">Specimen Barcode</p>

        {/*
          ⚠ 아래 판정 <form> 바깥에 둔다. 안에 넣으면 Enter 가 판정 제출로 새어 나간다.
            (공통 Button 의 type 기본값이 "button" 이라 조회 버튼 자체는 제출하지 않는다)
          ⚠ 스캐너 장치는 쓰지 않는다. 검체 등록 때 서버가 채번한 문자열을 눈으로 읽거나
            복사해서 붙여넣는 방식이라 텍스트 입력칸 하나면 된다.
        */}
        <div className="flex gap-2">
          <Input
            name="barcodeInput"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onKeyDown={(e) => {
              // 붙여넣고 Enter 를 누르는 게 실제 사용 흐름이다.
              if (e.key === "Enter") {
                e.preventDefault();
                handleBarcodeLookup();
              }
            }}
            placeholder="e.g. SP-A1B2C3D4"
            disabled={barcodeLookupLoading || accepting}
          />
          <Button
            variant="secondary"
            onClick={handleBarcodeLookup}
            disabled={barcodeLookupLoading || accepting || !barcodeInput.trim()}
            className="shrink-0"
          >
            {barcodeLookupLoading ? "Searching..." : "Search"}
          </Button>
        </div>

        {/*
          없는 바코드(LAB020)는 서버 문구를 그대로 보여준다.
          그 문구에 입력한 바코드가 들어 있어 오타를 바로 확인할 수 있다.
        */}
        {barcodeLookupError ? <Alert>{barcodeLookupError}</Alert> : null}

        {/* 대조 결과는 서버가 아니라 화면이 낸 판단이다. OK 일 때만 초록색. */}
        {barcodeMatch ? (
          <Alert variant={barcodeMatch.kind === "OK" ? "success" : "error"}>
            {barcodeMatchMessage(barcodeMatch)}
          </Alert>
        ) : null}
      </div>

      {/* ---------- 판정 대상 검체 고르기 ---------- */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-slate-700">
          Specimens to Assess {listLoading ? "" : `(${unjudged.length} of ${specimens.length})`}
        </p>

        {listLoading ? (
          <p className="text-sm text-slate-400">Loading specimens...</p>
        ) : specimens.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
            No specimens registered. Register one on the [Specimen] tab first.
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
                    onClick={() => handleSelectSpecimen(s.specimenId)}
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
            All specimens have been assessed.
          </p>
        ) : specimens.length > 0 ? (
          <p className="text-sm text-slate-400">Select a specimen above to assess.</p>
        ) : null
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-slate-500">
            Specimen{" "}
            <span className="font-semibold text-slate-800">
              {selected.specimenBarcode}
            </span>
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Accepted At" required>
              <Input
                /*
                  ⚠ 날짜 위젯의 안내 문구("연도-월-일 --:--")는 우리 문자열이 아니라 브라우저가 그린다.
                    Chrome 은 그 언어를 element 가 물려받은 lang 으로 정하는데, 루트가 <html lang="ko"> 라
                    한글로 나온다. 루트 레이아웃은 공용(가이드 5.3)이라 손대지 않고 이 입력칸에만 en 을 건다.
                */
                lang="en"
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

            <FormField label="Accepting Staff ID" required>
              <Input
                name="acceptedById"
                value={form.acceptedById}
                onChange={handleChange}
                maxLength={20}
                disabled={accepting}
                placeholder="e.g. STF00021"
              />
              {errors.acceptedById ? (
                <span className="text-xs text-rose-500">{errors.acceptedById}</span>
              ) : null}
            </FormField>

            <FormField label="Fitness Status" required>
              <Select
                name="fitnessStatus"
                value={form.fitnessStatus}
                onChange={handleChange}
                options={[...FITNESS_STATUS_OPTIONS]}
                disabled={accepting}
              />
            </FormField>

            <FormField
              label="Unfit Reason"
              required={isUnfit}
              hint={isUnfit ? undefined : "Enabled when Unfit is selected."}
            >
              <Select
                name="unfitReasonCode"
                value={form.unfitReasonCode}
                onChange={handleChange}
                options={rejectReasons.options}
                placeholder={rejectReasons.loading ? "Loading..." : "Select"}
                disabled={!isUnfit || accepting || rejectReasons.loading}
              />
              {errors.unfitReasonCode ? (
                <span className="text-xs text-rose-500">{errors.unfitReasonCode}</span>
              ) : null}
            </FormField>

            <FormField
              label="Recollection"
              hint={isUnfit ? undefined : "Enabled when Unfit is selected."}
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
              {accepting ? "Submitting..." : "Submit Assessment"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

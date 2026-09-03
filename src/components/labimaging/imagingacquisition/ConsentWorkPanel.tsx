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
import { resolveConsentMessage } from "@/features/labimaging/imagingacquisition/messages";
import {
  createConsentRequest,
  fetchConsentsRequest,
  resetConsentState,
  selectConsentCreateError,
  selectConsentCreating,
  selectConsents,
  selectConsentsError,
  selectConsentsLoading,
  selectLastCreatedConsent,
  selectLoadedConsentOrderId,
} from "@/features/labimaging/imagingacquisition/slice";
import {
  CONSENT_YN_OPTIONS,
  hasValidConsent,
  type ConsentSummary,
} from "@/features/labimaging/imagingacquisition/types";

/**
 * 선택한 영상오더의 동의 작업 영역 — 등록 폼 + 동의 이력.
 * 대응 유스케이스: UC-IMG-05 (Jira ZP2-84 등록 / ZP2-83 검증 / ZP2-80 상태 확인)
 *
 * ⚠ 동의는 접수(IMAGE_RECEPTION)가 아니라 오더(IMAGE_ORDER)에 붙는다.
 *   같은 오더로 접수가 여러 건 생겨도 동의는 오더 단위로 한 번만 받으면 되기 때문이다.
 *   그래서 등록·조회 모두 imageOrderId 를 키로 쓴다.
 *
 * ⚠ 등록 후에도 폼이 남는다. 한 오더에 조영제 동의와 침습검사 동의를 각각 받는 경우가 있어
 *   유형만 바꿔 연속 등록할 수 있어야 한다. (같은 유형 중복은 서버가 LAB031 로 막는다)
 *
 * ⚠ 동의 철회는 1차 배포 범위 밖이다 (4차 이월). 이력의 철회 상태를 표시만 한다.
 */

const initialForm = {
  consentTypeCode: "",
  documentTemplateId: "",
  consentYn: "Y" as "Y" | "N",
  consentDt: "",
  signedByName: "",
  witnessId: "",
};

type FormState = typeof initialForm;
type FieldErrors = Partial<Record<keyof FormState, string>>;

/** 백엔드가 ISO 문자열로 준다. 초 단위는 화면에서 의미가 없어 분까지만 보여준다. */
function formatDateTime(value?: string) {
  if (!value) return "-";
  return value.replace("T", " ").slice(0, 16);
}

/**
 * ⚠ 프롭 타입을 특정 DTO 로 고정하지 않고 필요한 필드만 받는다.
 *   이 패널은 동의 화면(ImageReceptionSummary)과 영상 워크리스트(ImageWorklistItem)
 *   양쪽에서 쓰이는데, 정작 쓰는 값은 아래 두 개뿐이다.
 *   DTO 를 통째로 요구하면 목록이 하나 늘 때마다 이 파일을 고쳐야 한다.
 */
type ConsentWorkTarget = {
  /** 동의는 접수가 아니라 오더에 붙는다. (CONSENT.image_order_id) */
  imageOrderId: string;
  patientId: string;
};

export default function ConsentWorkPanel({
  reception,
}: {
  reception: ConsentWorkTarget;
}) {
  const dispatch = useDispatch<AppDispatch>();

  const consents = useSelector(selectConsents);
  const listLoading = useSelector(selectConsentsLoading);
  const listError = useSelector(selectConsentsError);
  const loadedOrderId = useSelector(selectLoadedConsentOrderId);
  const creating = useSelector(selectConsentCreating);
  const createError = useSelector(selectConsentCreateError);
  const lastCreated = useSelector(selectLastCreatedConsent);

  // 동의서유형은 admin 공통코드다. (영상은 CONTRAST/INVASIVE 를 쓰고, 01~03 은 수술 쪽 값이다)
  const consentTypes = useCommonCodeOptions("CONSENT_TYPE_CD");

  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});

  /*
   * 선택한 오더가 바뀌면 이전 오더의 이력/결과를 비우고 새로 불러온다.
   *
   * ⚠ 폼 입력값은 여기서 초기화하지 않는다. 부모가 key={imageOrderId} 로 리마운트시켜서
   *   이 효과가 도는 시점에는 form 이 이미 초기값이다. 하는 일 없이 렌더만 한 번 더 유발한다.
   *   (react-hooks/set-state-in-effect 규칙에도 걸린다)
   */
  useEffect(() => {
    dispatch(resetConsentState());
    dispatch(fetchConsentsRequest(reception.imageOrderId));
  }, [dispatch, reception.imageOrderId]);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!form.consentTypeCode) next.consentTypeCode = "Consent type is required.";
    if (!form.documentTemplateId.trim())
      next.documentTemplateId = "Consent template ID is required.";
    if (!form.consentDt) next.consentDt = "Consent date is required.";
    if (!form.signedByName.trim()) next.signedByName = "Signer name is required.";
    if (!form.witnessId.trim()) next.witnessId = "Witness ID is required.";
    return next;
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    dispatch(
      createConsentRequest({
        imageOrderId: reception.imageOrderId,
        patientId: reception.patientId,
        consentTypeCode: form.consentTypeCode,
        documentTemplateId: form.documentTemplateId.trim(),
        consentYn: form.consentYn,
        consentDt: form.consentDt,
        signedByName: form.signedByName.trim(),
        witnessId: form.witnessId.trim(),
      }),
    );
  }

  /** 공통코드 값(CONTRAST)을 화면 문구(조영제사용동의)로 바꾼다. 못 찾으면 원본 값 그대로. */
  function consentTypeLabel(code: string) {
    return consentTypes.options.find((o) => o.value === code)?.label ?? code;
  }

  const columns: DataTableColumn<ConsentSummary>[] = [
    {
      key: "consentTypeCode",
      header: "Type",
      render: (c) => (
        <span className="font-semibold text-slate-700">
          {consentTypeLabel(c.consentTypeCode)}
        </span>
      ),
    },
    {
      key: "consentYn",
      header: "Consent",
      render: (c) =>
        c.consentYn === "Y" ? (
          <span className="text-emerald-600">Consented</span>
        ) : (
          <span className="text-rose-600">Declined</span>
        ),
    },
    { key: "consentDt", header: "Consent Date", render: (c) => c.consentDt ?? "-" },
    { key: "signedByName", header: "Signer", render: (c) => c.signedByName },
    { key: "witnessId", header: "Witness", render: (c) => c.witnessId },
    {
      key: "withdrawnYn",
      header: "Withdrawal",
      render: (c) =>
        c.withdrawnYn === "Y" ? (
          <span className="text-rose-600" title={c.withdrawnReasonCode}>
            Withdrawn ({formatDateTime(c.withdrawnAt)})
          </span>
        ) : (
          <span className="text-slate-400">-</span>
        ),
    },
  ];

  /*
   * 화면에 보이는 이력이 정말 "이 오더의 것"인지.
   *
   * ⚠ 오더를 바꾼 직후 첫 렌더에는 redux 에 아직 이전 오더의 이력이 남아 있다.
   *   위 효과는 렌더가 끝난 뒤에 돌기 때문에 그 프레임을 막지 못한다.
   *   이 대조가 없으면 다른 환자의 "유효한 동의가 등록되어 있습니다"가 잠깐 보인다.
   *   (WorklistReceptionHeader 에서 접수번호를 대조하는 것과 같은 방어)
   */
  const loaded = loadedOrderId === reception.imageOrderId;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      {/* ---------- 현재 동의 상태 (ZP2-80) ---------- */}
      {!loaded || listLoading ? null : hasValidConsent(consents) ? (
        <Alert variant="success">A valid consent is on file.</Alert>
      ) : (
        <Alert>No valid consent on file. Consent must be obtained before imaging.</Alert>
      )}

      {/* ---------- 등록 폼 ---------- */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {lastCreated ? (
          <Alert variant="success">
            Consent registered. ({consentTypeLabel(lastCreated.consentTypeCode)})
          </Alert>
        ) : null}
        {createError ? <Alert>{resolveConsentMessage(createError)}</Alert> : null}
        {consentTypes.error ? <Alert>{consentTypes.error}</Alert> : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Consent Type" required>
            <Select
              name="consentTypeCode"
              value={form.consentTypeCode}
              onChange={handleChange}
              options={consentTypes.options}
              placeholder={consentTypes.loading ? "Loading..." : "Select"}
              disabled={creating || consentTypes.loading}
            />
            {errors.consentTypeCode ? (
              <span className="text-xs text-rose-500">{errors.consentTypeCode}</span>
            ) : null}
          </FormField>

          <FormField label="Consent" required>
            <Select
              name="consentYn"
              value={form.consentYn}
              onChange={handleChange}
              options={[...CONSENT_YN_OPTIONS]}
              disabled={creating}
            />
          </FormField>

          <FormField label="Consent Date" required>
            <Input
              /*
                ⚠ 날짜 위젯의 안내 문구("연도-월-일 --:--")는 우리 문자열이 아니라 브라우저가 그린다.
                  Chrome 은 그 언어를 element 가 물려받은 lang 으로 정하는데, 루트가 <html lang="ko"> 라
                  한글로 나온다. 루트 레이아웃은 공용(가이드 5.3)이라 손대지 않고 이 입력칸에만 en 을 건다.
              */
              lang="en"
              type="date"
              name="consentDt"
              value={form.consentDt}
              onChange={handleChange}
              disabled={creating}
            />
            {errors.consentDt ? (
              <span className="text-xs text-rose-500">{errors.consentDt}</span>
            ) : null}
          </FormField>

          <FormField label="Signer Name" required>
            <Input
              name="signedByName"
              value={form.signedByName}
              onChange={handleChange}
              maxLength={50}
              disabled={creating}
              placeholder="Patient or legal guardian"
            />
            {errors.signedByName ? (
              <span className="text-xs text-rose-500">{errors.signedByName}</span>
            ) : null}
          </FormField>

          <FormField label="Witness ID" required>
            <Input
              name="witnessId"
              value={form.witnessId}
              onChange={handleChange}
              maxLength={20}
              disabled={creating}
              placeholder="e.g. STF00021"
            />
            {errors.witnessId ? (
              <span className="text-xs text-rose-500">{errors.witnessId}</span>
            ) : null}
          </FormField>

          {/*
            ⚠ 동의서양식ID 는 admin-service DOCUMENT_TEMPLATE 의 논리 참조인데,
              양식 목록을 내려주는 API 가 아직 없어 임시로 직접 입력받는다.
              admin 에 양식 조회 API 가 생기면 Select 로 바꿀 것.
          */}
          <FormField label="Consent Template ID" required>
            <Input
              name="documentTemplateId"
              value={form.documentTemplateId}
              onChange={handleChange}
              maxLength={36}
              disabled={creating}
              placeholder="admin document template UUID (temporary manual entry)"
            />
            {errors.documentTemplateId ? (
              <span className="text-xs text-rose-500">{errors.documentTemplateId}</span>
            ) : null}
          </FormField>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={creating}>
            {creating ? "Registering..." : "Register Consent"}
          </Button>
        </div>
      </form>

      {/* ---------- 이 오더의 동의 이력 ---------- */}
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <p className="text-sm font-semibold text-slate-700">
          Consent History {loaded ? `(${consents.length})` : ""}
        </p>
        {listError ? <Alert>{resolveConsentMessage(listError)}</Alert> : null}
        <DataTable
          columns={columns}
          rows={loaded ? consents : []}
          rowKey={(c) => c.consentId}
          // 아직 이 오더의 이력이 아니면 이전 오더 행을 보여주는 대신 로딩으로 둔다.
          loading={listLoading || !loaded}
          minWidthClassName="min-w-[620px]"
          loadingMessage="Loading..."
          emptyMessage="No consent registered yet."
        />
      </div>
    </div>
  );
}

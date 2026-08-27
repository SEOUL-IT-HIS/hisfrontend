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
import type { ImageReceptionSummary } from "@/features/labimaging/imagingorder/types";

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

export default function ConsentWorkPanel({
  reception,
}: {
  reception: ImageReceptionSummary;
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
    if (!form.consentTypeCode) next.consentTypeCode = "동의서유형은 필수입니다.";
    if (!form.documentTemplateId.trim())
      next.documentTemplateId = "동의서양식ID는 필수입니다.";
    if (!form.consentDt) next.consentDt = "동의일자는 필수입니다.";
    if (!form.signedByName.trim()) next.signedByName = "서명자명은 필수입니다.";
    if (!form.witnessId.trim()) next.witnessId = "확인자ID는 필수입니다.";
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
      header: "유형",
      render: (c) => (
        <span className="font-semibold text-slate-700">
          {consentTypeLabel(c.consentTypeCode)}
        </span>
      ),
    },
    {
      key: "consentYn",
      header: "동의여부",
      render: (c) =>
        c.consentYn === "Y" ? (
          <span className="text-emerald-600">동의</span>
        ) : (
          <span className="text-rose-600">거부</span>
        ),
    },
    { key: "consentDt", header: "동의일자", render: (c) => c.consentDt ?? "-" },
    { key: "signedByName", header: "서명자", render: (c) => c.signedByName },
    { key: "witnessId", header: "확인자", render: (c) => c.witnessId },
    {
      key: "withdrawnYn",
      header: "철회",
      render: (c) =>
        c.withdrawnYn === "Y" ? (
          <span className="text-rose-600" title={c.withdrawnReasonCode}>
            철회됨 ({formatDateTime(c.withdrawnAt)})
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
        <Alert variant="success">유효한 동의가 등록되어 있습니다.</Alert>
      ) : (
        <Alert>유효한 동의가 없습니다. 촬영 전 동의를 받아야 합니다.</Alert>
      )}

      {/* ---------- 등록 폼 ---------- */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {lastCreated ? (
          <Alert variant="success">
            동의가 등록되었습니다. ({consentTypeLabel(lastCreated.consentTypeCode)})
          </Alert>
        ) : null}
        {createError ? <Alert>{resolveConsentMessage(createError)}</Alert> : null}
        {consentTypes.error ? <Alert>{consentTypes.error}</Alert> : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="동의서유형" required>
            <Select
              name="consentTypeCode"
              value={form.consentTypeCode}
              onChange={handleChange}
              options={consentTypes.options}
              placeholder={consentTypes.loading ? "불러오는 중..." : "선택하세요"}
              disabled={creating || consentTypes.loading}
            />
            {errors.consentTypeCode ? (
              <span className="text-xs text-rose-500">{errors.consentTypeCode}</span>
            ) : null}
          </FormField>

          <FormField label="동의여부" required>
            <Select
              name="consentYn"
              value={form.consentYn}
              onChange={handleChange}
              options={[...CONSENT_YN_OPTIONS]}
              disabled={creating}
            />
          </FormField>

          <FormField label="동의일자" required>
            <Input
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

          <FormField label="서명자명" required>
            <Input
              name="signedByName"
              value={form.signedByName}
              onChange={handleChange}
              maxLength={50}
              disabled={creating}
              placeholder="환자 또는 법정대리인"
            />
            {errors.signedByName ? (
              <span className="text-xs text-rose-500">{errors.signedByName}</span>
            ) : null}
          </FormField>

          <FormField label="확인자ID" required>
            <Input
              name="witnessId"
              value={form.witnessId}
              onChange={handleChange}
              maxLength={20}
              disabled={creating}
              placeholder="예: STF00021"
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
          <FormField label="동의서양식ID" required>
            <Input
              name="documentTemplateId"
              value={form.documentTemplateId}
              onChange={handleChange}
              maxLength={36}
              disabled={creating}
              placeholder="admin 문서양식 UUID (임시 직접 입력)"
            />
            {errors.documentTemplateId ? (
              <span className="text-xs text-rose-500">{errors.documentTemplateId}</span>
            ) : null}
          </FormField>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={creating}>
            {creating ? "등록 중..." : "동의 등록"}
          </Button>
        </div>
      </form>

      {/* ---------- 이 오더의 동의 이력 ---------- */}
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <p className="text-sm font-semibold text-slate-700">
          동의 이력 {loaded ? `${consents.length}건` : ""}
        </p>
        {listError ? <Alert>{resolveConsentMessage(listError)}</Alert> : null}
        <DataTable
          columns={columns}
          rows={loaded ? consents : []}
          rowKey={(c) => c.consentId}
          // 아직 이 오더의 이력이 아니면 이전 오더 행을 보여주는 대신 로딩으로 둔다.
          loading={listLoading || !loaded}
          minWidthClassName="min-w-[620px]"
          emptyMessage="아직 등록된 동의가 없습니다."
        />
      </div>
    </div>
  );
}

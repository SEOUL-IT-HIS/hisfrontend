"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import {
  Alert,
  DataTable,
  FormActions,
  FormField,
  Input,
  Panel,
  Select,
  type DataTableColumn,
} from "@/components/common";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import { resolveSurgeryMessage } from "@/features/surgery/messages";
import {
  createConsentRequest,
  fetchConsentsRequest,
  selectConsentError,
  selectConsentLoading,
  selectConsentSaving,
  selectConsents,
} from "@/features/surgery/consent/slice";

type Props = { surgeryId: string };

/**
 * 수술 동의서 패널 (SL2-53 확인 기록 / SL2-54 조회)
 *
 * <p>시스템은 종이 동의서를 저장하지 않고 동의 여부·서명자·서명일만 남긴다(§21.5).
 * 수정 기능이 없는 이유는 동의서가 서명 시점의 사실 기록이기 때문이다 — 내용이 바뀌면
 * 새로 동의를 받아 다른 행으로 남긴다(§21.6).</p>
 *
 * <p>서명자 관계는 2026-08-10 제거했다. 프로젝트 범위를 "동의 여부 확인"으로 축소하기로
 * 정해졌고, admin 의 RELATION_CD 코드그룹도 함께 내려갔다. 본인/법정대리인 구분은
 * 종이 동의서에서 관리한다.</p>
 *
 * <p>같은 수술에 같은 종류의 동의서는 한 번만 남길 수 있다. 두 번 등록하면 백엔드가
 * SUR044 로 거절하므로, 이미 기록된 종류는 선택지에서 빼 둔다.</p>
 */

/**
 * 수술이 다루는 동의서 종류.
 *
 * <p>CONSENT_TYPE_CD 는 <b>병원 공통 그룹</b>이라 검사·영상의 CONTRAST(조영제사용동의)·
 * INVASIVE(침습적검사동의)도 같이 들어 있다. 그대로 내려받으면 수술 화면에 남의 동의서가
 * 섞여 보이므로, 여기 적힌 것만 골라 쓴다.</p>
 *
 * <p><b>정규식으로 "숫자면 우리 것"이라 거르지 않는 이유</b> — 검사·영상이 나중에 숫자 코드를
 * 추가하면 조용히 새어 들어온다. 우리가 처리하는 목록을 눈에 보이게 적어두는 편이 안전하다.</p>
 *
 * <p>이 배열의 <b>순서가 곧 화면 표시 순서</b>다. admin 의 sortOrder 가 비어 있어 응답 순서를
 * 믿을 수 없기 때문이며, sortOrder 가 채워지면 이 정렬은 없애도 된다.</p>
 */
const SURGERY_CONSENT_CODES = ["01", "02", "03"];

type FieldErrors = {
  consentTypeCd?: string;
  signedBy?: string;
  signedDt?: string;
};

export default function ConsentPanel({ surgeryId }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const consents = useSelector(selectConsents);
  const loading = useSelector(selectConsentLoading);
  const saving = useSelector(selectConsentSaving);
  const error = useSelector(selectConsentError);

  const [consentTypeCd, setConsentTypeCd] = useState("");
  const [signedBy, setSignedBy] = useState("");
  const [signedDt, setSignedDt] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  const { options: codeOptions } = useCommonCodeOptions("CONSENT_TYPE_CD");

  useEffect(() => {
    dispatch(fetchConsentsRequest(surgeryId));
  }, [dispatch, surgeryId]);

  // 공통 그룹에서 수술이 다루는 것만 골라 SURGERY_CONSENT_CODES 순서로 세운다
  const consentTypeOptions = SURGERY_CONSENT_CODES.map((code) =>
    codeOptions.find((option) => option.value === code),
  ).filter((option): option is (typeof codeOptions)[number] => Boolean(option));

  // 이미 기록된 동의 종류는 다시 고를 수 없다(백엔드 중복 차단과 같은 규칙)
  const recordedTypes = consents.map((consent) => consent.consentTypeCd);
  const availableTypes = consentTypeOptions.filter(
    (option) => !recordedTypes.includes(option.value),
  );

  const consentColumns: DataTableColumn<(typeof consents)[number]>[] = [
    {
      key: "consentTypeCd",
      header: "동의 종류",
      // 코드값 그대로가 아니라 이름으로 보여준다. 아직 못 받았거나 목록에 없는
      //   코드면 값을 그대로 두어 빈칸이 되지 않게 한다
      render: (consent) =>
        codeOptions.find((o) => o.value === consent.consentTypeCd)?.label ??
        consent.consentTypeCd,
    },
    { key: "signedBy", header: "서명자", render: (c) => c.signedBy },
    { key: "signedDt", header: "서명일", render: (c) => c.signedDt },
  ];

  function reset() {
    setConsentTypeCd("");
    setSignedBy("");
    setSignedDt("");
    setErrors({});
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // 백엔드 @NotBlank/@NotNull 과 같은 항목을 화면에서 먼저 잡는다(§15.3)
    const nextErrors: FieldErrors = {};
    if (!consentTypeCd) nextErrors.consentTypeCd = "동의 종류를 선택해주세요.";
    if (!signedBy.trim()) nextErrors.signedBy = "서명자 성명을 입력해주세요.";
    if (!signedDt) nextErrors.signedDt = "서명일을 선택해주세요.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    dispatch(
      createConsentRequest(surgeryId, {
        consentTypeCd,
        signedBy: signedBy.trim(),
        // Input type="date" 값이 이미 yyyy-MM-dd 라 그대로 보낸다(§14.2 `_dt`)
        signedDt,
      }),
    );
    setConsentTypeCd("");
    setSignedBy("");
    setSignedDt("");
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ----- 목록 (SL2-54) ----- */}
      <DataTable
        columns={consentColumns}
        rows={consents}
        rowKey={(consent) => consent.consentId}
        loading={loading}
        emptyMessage="기록된 동의서가 없습니다."
        minWidthClassName="min-w-[480px]"
      />

      {/* ----- 등록 (SL2-53) ----- */}
      {availableTypes.length === 0 ? (
        <p className="text-sm text-slate-500">
          세 종류의 동의서가 모두 기록되었습니다.
        </p>
      ) : (
        <Panel className="p-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-sm font-medium text-slate-700">동의 확인 기록</p>

            <FormField label="동의 종류" required htmlFor="consentTypeCd">
              <Select
                id="consentTypeCd"
                placeholder="선택"
                options={availableTypes}
                value={consentTypeCd}
                onChange={(e) => setConsentTypeCd(e.target.value)}
                disabled={saving}
              />
              {errors.consentTypeCd ? (
                <span className="text-xs text-rose-600">{errors.consentTypeCd}</span>
              ) : null}
            </FormField>

            <FormField label="서명자 성명" required htmlFor="signedBy">
              <Input
                id="signedBy"
                value={signedBy}
                onChange={(e) => setSignedBy(e.target.value)}
                disabled={saving}
              />
              {errors.signedBy ? (
                <span className="text-xs text-rose-600">{errors.signedBy}</span>
              ) : null}
            </FormField>

            <FormField label="서명일" required htmlFor="signedDt">
              <Input
                id="signedDt"
                type="date"
                value={signedDt}
                onChange={(e) => setSignedDt(e.target.value)}
                disabled={saving}
              />
              {errors.signedDt ? (
                <span className="text-xs text-rose-600">{errors.signedDt}</span>
              ) : null}
            </FormField>

            {error ? <Alert>{resolveSurgeryMessage(error)}</Alert> : null}

            <FormActions
              onCancel={reset}
              cancelLabel="초기화"
              submitLabel="동의 확인 기록"
              loading={saving}
              loadingLabel="기록 중…"
            />
          </form>
        </Panel>
      )}
    </div>
  );
}

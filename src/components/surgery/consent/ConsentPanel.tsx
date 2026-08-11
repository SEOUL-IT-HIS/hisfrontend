"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
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

const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-sky-400 disabled:bg-slate-50";

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
        // <input type="date"> 값이 이미 yyyy-MM-dd 라 그대로 보낸다(§14.2 `_dt`)
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
      {loading ? (
        <p className="text-sm text-slate-500">불러오는 중입니다…</p>
      ) : consents.length === 0 ? (
        <p className="text-sm text-slate-500">기록된 동의서가 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2">동의 종류</th>
                <th className="px-3 py-2">서명자</th>
                <th className="px-3 py-2">서명일</th>
              </tr>
            </thead>
            <tbody>
              {consents.map((consent) => (
                <tr
                  key={consent.consentId}
                  className="border-t border-slate-100"
                >
                  {/* 코드값 그대로가 아니라 이름으로 보여준다. 아직 못 받았거나
                      목록에 없는 코드면 값을 그대로 두어 빈칸이 되지 않게 한다 */}
                  <td className="px-3 py-2">
                    {codeOptions.find((o) => o.value === consent.consentTypeCd)
                      ?.label ?? consent.consentTypeCd}
                  </td>
                  <td className="px-3 py-2">{consent.signedBy}</td>
                  <td className="px-3 py-2">{consent.signedDt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ----- 등록 (SL2-53) ----- */}
      {availableTypes.length === 0 ? (
        <p className="text-sm text-slate-500">
          세 종류의 동의서가 모두 기록되었습니다.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-lg border border-slate-200 p-4"
        >
          <p className="text-sm font-medium text-slate-700">동의 확인 기록</p>

          <div className="flex flex-col gap-1">
            <label htmlFor="consentTypeCd" className="text-sm text-slate-700">
              동의 종류
            </label>
            <select
              id="consentTypeCd"
              className={inputClass}
              value={consentTypeCd}
              onChange={(e) => setConsentTypeCd(e.target.value)}
              disabled={saving}
            >
              <option value="">선택</option>
              {availableTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.consentTypeCd && (
              <p className="text-xs text-red-600">{errors.consentTypeCd}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="signedBy" className="text-sm text-slate-700">
              서명자 성명
            </label>
            <input
              id="signedBy"
              className={inputClass}
              value={signedBy}
              onChange={(e) => setSignedBy(e.target.value)}
              disabled={saving}
            />
            {errors.signedBy && (
              <p className="text-xs text-red-600">{errors.signedBy}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="signedDt" className="text-sm text-slate-700">
              서명일
            </label>
            <input
              id="signedDt"
              type="date"
              className={inputClass}
              value={signedDt}
              onChange={(e) => setSignedDt(e.target.value)}
              disabled={saving}
            />
            {errors.signedDt && (
              <p className="text-xs text-red-600">{errors.signedDt}</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600">
              {resolveSurgeryMessage(error)}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="h-10 rounded-lg bg-sky-500 px-4 text-white disabled:bg-slate-300"
          >
            {saving ? "기록 중…" : "동의 확인 기록"}
          </button>
        </form>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { resolveSurgeryMessage } from "@/features/surgery/messages";
import {
  createConsentRequest,
  fetchConsentsRequest,
  selectConsentError,
  selectConsentLoading,
  selectConsentSaving,
  selectConsents,
} from "@/features/surgery/consent/slice";
import { fetchCommonCodeItemsByGroupCode } from "@/features/commonCode/api/commonCodeItemApi";
import type { CommonCodeItem } from "@/features/commonCode/types/commonCodeItemTypes";

type Props = { surgeryId: string };

/**
 * 수술 동의서 패널 (SL2-53 확인 기록 / SL2-54 조회)
 *
 * <p>시스템은 종이 동의서를 저장하지 않고 동의 여부·서명자·서명일만 남긴다(§21.5).
 * 수정 기능이 없는 이유는 동의서가 서명 시점의 사실 기록이기 때문이다 — 내용이 바뀌면
 * 새로 동의를 받아 다른 행으로 남긴다(§21.6).</p>
 *
 * <p>같은 수술에 같은 종류의 동의서는 한 번만 남길 수 있다. 두 번 등록하면 백엔드가
 * SUR044 로 거절하므로, 이미 기록된 종류는 선택지에서 빼 둔다.</p>
 */

/**
 * 동의 종류 — 임시 하드코딩
 *
 * <p>admin-service 에 CONSENT_TYPE_CD(동의서유형코드) 그룹이 이미 있으나, 검사·영상이
 * CONTRAST/INVASIVE 처럼 <b>영문 코드값</b>으로 쓰고 있어 수술의 01/02/03 과 체계가 다르다.
 * 한 그룹에 두 체계를 섞을 수 없으므로, 합류할지 SURG_CONSENT_CD 를 신설할지
 * 검사·영상 담당자와 합의한 뒤 공통코드 조회로 교체한다(§21.4).</p>
 */
const CONSENT_TYPE_OPTIONS = [
  { value: "01", label: "01 수술 동의서" },
  { value: "02", label: "02 마취 동의서" },
  { value: "03", label: "03 비용견적 동의서" },
];

/** 서명자 관계 공통코드 그룹 — admin-service 소유(§21.4). 보호자 관계는 전사 공용이라 재사용한다. */
const RELATION_GROUP_CODE = "RELATION_CD";

const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-sky-400 disabled:bg-slate-50";

type FieldErrors = {
  consentTypeCd?: string;
  signerRelationCd?: string;
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
  const [signerRelationCd, setSignerRelationCd] = useState("");
  const [signedBy, setSignedBy] = useState("");
  const [signedDt, setSignedDt] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  // 서명자 관계는 admin-service 가 소유한 공통코드다. 화면에 목록을 박아두면
  // 관리자가 코드를 고쳐도 여기만 옛 값으로 남는다(§21.4).
  // slice 를 거치지 않는 이유 — 타 서비스 데이터를 수술 상태에 담으면 서비스 간 결합이 생긴다.
  const [relationItems, setRelationItems] = useState<CommonCodeItem[]>([]);
  const [relationLoadError, setRelationLoadError] = useState("");

  useEffect(() => {
    dispatch(fetchConsentsRequest(surgeryId));
  }, [dispatch, surgeryId]);

  useEffect(() => {
    let ignore = false;
    fetchCommonCodeItemsByGroupCode(RELATION_GROUP_CODE)
      .then((items) => {
        if (!ignore) setRelationItems(items);
      })
      .catch((err: unknown) => {
        if (ignore) return;
        setRelationLoadError(
          err instanceof Error ? err.message : "서명자 관계 코드 조회에 실패했습니다.",
        );
      });
    return () => {
      ignore = true;
    };
  }, []);

  /** 코드값 → 코드명. 목록에 없으면 원본 값을 그대로 돌려준다(코드가 지워졌을 때 추적용). */
  function toRelationLabel(codeValue: string | null | undefined): string {
    if (!codeValue) return "-";
    return (
      relationItems.find((item) => item.codeValue === codeValue)?.codeName ??
      codeValue
    );
  }

  // 이미 기록된 동의 종류는 다시 고를 수 없다(백엔드 중복 차단과 같은 규칙)
  const recordedTypes = consents.map((consent) => consent.consentTypeCd);
  const availableTypes = CONSENT_TYPE_OPTIONS.filter(
    (option) => !recordedTypes.includes(option.value),
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // 백엔드 @NotBlank/@NotNull 과 같은 항목을 화면에서 먼저 잡는다(§15.3)
    const nextErrors: FieldErrors = {};
    if (!consentTypeCd) nextErrors.consentTypeCd = "동의 종류를 선택해주세요.";
    if (!signerRelationCd) nextErrors.signerRelationCd = "서명자 관계를 선택해주세요.";
    if (!signedBy.trim()) nextErrors.signedBy = "서명자 성명을 입력해주세요.";
    if (!signedDt) nextErrors.signedDt = "서명일을 선택해주세요.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    dispatch(
      createConsentRequest(surgeryId, {
        consentTypeCd,
        signerRelationCd,
        signedBy: signedBy.trim(),
        // <input type="date"> 값이 이미 yyyy-MM-dd 라 그대로 보낸다(§14.2 `_dt`)
        signedDt,
      }),
    );
    setConsentTypeCd("");
    setSignerRelationCd("");
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
                <th className="px-3 py-2">관계</th>
                <th className="px-3 py-2">서명일</th>
              </tr>
            </thead>
            <tbody>
              {consents.map((consent) => (
                <tr
                  key={consent.consentId}
                  className="border-t border-slate-100"
                >
                  <td className="px-3 py-2">{consent.consentTypeCd}</td>
                  <td className="px-3 py-2">{consent.signedBy}</td>
                  {/* 저장된 값은 코드(01)이고 화면에는 코드명(배우자)을 보여준다.
                      코드가 목록에 없으면 원본을 그대로 노출해 무엇이 저장됐는지 감춘다. */}
                  <td className="px-3 py-2">
                    {toRelationLabel(consent.signerRelationCd)}
                  </td>
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
            <label htmlFor="signerRelationCd" className="text-sm text-slate-700">
              서명자 관계
            </label>
            <select
              id="signerRelationCd"
              className={inputClass}
              value={signerRelationCd}
              onChange={(e) => setSignerRelationCd(e.target.value)}
              disabled={saving}
            >
              <option value="">선택</option>
              {relationItems.map((item) => (
                <option key={item.codeId} value={item.codeValue}>
                  {item.codeName}
                </option>
              ))}
            </select>
            {relationLoadError && (
              <p className="text-xs text-red-600">{relationLoadError}</p>
            )}
            {errors.signerRelationCd && (
              <p className="text-xs text-red-600">{errors.signerRelationCd}</p>
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

"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, Panel } from "@/components/common";
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
 * <p>시스템은 종이 동의서를 저장하지 않는다(§21.5). 원본은 부서에 비치되고,
 * 여기서 남기는 것은 <b>그 종이를 받았는가</b> 하나뿐이다.</p>
 *
 * <h3>폼에서 체크로 바꾼 이유</h3>
 *
 * <p>예전에는 종류를 고르고 서명자 이름과 서명일을 타이핑해 저장하는 폼이었다.
 * 그런데 그 두 값은 <b>종이에 이미 적혀 있는 것</b>이라, 화면이 하는 일은 옮겨 적기였다.
 * 입력만 늘고 오타가 들어갈 자리도 생겼다. 세 종류를 다 기록하려면 같은 폼을
 * 세 번 채워야 했다.</p>
 *
 * <p>이제 세 종류가 체크박스로 놓여 있고, 체크가 곧 "받았다"다. 백엔드도
 * {@code signed_by}·{@code signed_dt} 를 걷어내고 {@code signed_yn} 하나로 바꿨다.
 * 체크한 시각은 {@code createdAt}·{@code updatedAt} 에 남는다.</p>
 *
 * <p><b>해제할 수 있게 둔 이유</b> — 잘못 눌렀을 때 되돌릴 방법이 없으면 행을 지우게
 * 되는데, 지우면 "받은 적 없음"과 "받았다가 취소함"이 구분되지 않는다. 행은 남기고
 * 값만 N 으로 되돌린다(§21.6).</p>
 *
 * <p>체크리스트 패널과 달리 <b>이 체크는 저장된다</b>. 체크리스트의 항목별 체크는
 * 저장할 테이블이 없어 화면 상태로만 있지만, 동의서는 종류마다 행이 있다.</p>
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

const YES = "Y";
const NO = "N";

export default function ConsentPanel({ surgeryId }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const consents = useSelector(selectConsents);
  const loading = useSelector(selectConsentLoading);
  const saving = useSelector(selectConsentSaving);
  const error = useSelector(selectConsentError);

  const { options: codeOptions } = useCommonCodeOptions("CONSENT_TYPE_CD");

  useEffect(() => {
    dispatch(fetchConsentsRequest(surgeryId));
  }, [dispatch, surgeryId]);

  /**
   * 화면에 세울 세 줄. admin 코드명을 붙이되, 못 받았으면 코드값이라도 보여준다.
   *
   * <p>admin 조회가 실패해도 체크는 되어야 한다 — 코드명은 표시용이고,
   * 우리가 보내는 값은 {@link SURGERY_CONSENT_CODES} 에 적힌 코드 그 자체다.</p>
   */
  const rows = SURGERY_CONSENT_CODES.map((code) => {
    const consent = consents.find((c) => c.consentTypeCd === code);
    return {
      code,
      label: codeOptions.find((o) => o.value === code)?.label ?? code,
      checked: consent?.signedYn === YES,
      /** 마지막으로 손댄 시각. 행이 없으면 아직 아무도 건드리지 않은 것이다 */
      updatedAt: consent?.updatedAt ?? null,
    };
  });

  const allChecked = rows.every((r) => r.checked);

  function toggle(code: string, next: boolean) {
    dispatch(
      createConsentRequest(surgeryId, {
        consentTypeCd: code,
        signedYn: next ? YES : NO,
      }),
    );
  }

  /**
   * 세 종류를 한꺼번에 켜거나 끈다.
   *
   * <p>이미 전부 켜져 있으면 전부 끈다 — 켜는 버튼과 끄는 버튼을 따로 두면
   * 둘 중 하나는 늘 아무 일도 하지 않는 상태로 놓인다(체크리스트와 같은 방식).</p>
   *
   * <p><b>이미 원하는 값인 행도 다시 보낸다.</b> 걸러내면 "세 건 보냈는데 두 건만
   * 반영됐다" 같은 상황에서 무엇이 빠졌는지 알기 어렵다. 등록이 멱등이라
   * 같은 값을 다시 보내도 결과가 같다.</p>
   */
  function toggleAll() {
    const next = !allChecked;
    for (const row of rows) {
      toggle(row.code, next);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? <Alert>{resolveSurgeryMessage(error)}</Alert> : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <Panel className="p-4">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-700">
                Consent forms received
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Tick each form once the signed paper copy is in hand.
              </p>
            </div>
            <Button
              variant="secondary"
              className="h-7 shrink-0 px-2 text-xs"
              disabled={saving}
              onClick={toggleAll}
            >
              {allChecked ? "Clear all" : "Check all"}
            </Button>
          </div>

          <ul className="flex flex-col gap-2 text-sm text-slate-700">
            {rows.map((row) => (
              <li key={row.code}>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={row.checked}
                    disabled={saving}
                    onChange={(e) => toggle(row.code, e.target.checked)}
                  />
                  <span className="text-xs text-slate-400">{row.code}</span>
                  {row.label}
                  {row.updatedAt ? (
                    <span className="ml-auto text-xs text-slate-400">
                      {row.updatedAt.slice(0, 16).replace("T", " ")}
                    </span>
                  ) : null}
                </label>
              </li>
            ))}
          </ul>

          {/*
            수술 동의서(01)가 없으면 수술을 시작할 수 없다(SL2-217, SUR047).
            시작 버튼을 눌러 400 을 받고 나서야 알게 되면 늦으므로 여기서 먼저 알린다.
          */}
          {!rows[0].checked ? (
            <p className="mt-3 text-xs text-amber-700">
              The surgical consent (01) is required before the surgery can start.
            </p>
          ) : null}
        </Panel>
      )}
    </div>
  );
}

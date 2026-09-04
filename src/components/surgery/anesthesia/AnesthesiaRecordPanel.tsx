"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import {
  anesthesiaMutationFailure,
  appendVitalSignsRequest,
  createAnesthesiaRecordRequest,
  fetchAnesthesiaRecordsRequest,
  selectAnesthesiaError,
  selectAnesthesiaLoading,
  selectAnesthesiaRecords,
  selectAnesthesiaSaving,
} from "@/features/surgery/anesthesia/slice";
import {
  Alert,
  Button,
  FormActions,
  FormField,
  Input,
  Panel,
  Select,
} from "@/components/common";
import { resolveSurgeryMessage } from "@/features/surgery/messages";

type Props = {
  surgeryId: string;
};

/**
 * 마취 유형·ASA 등급 선택지.
 *
 * <p>값은 백엔드 {@code AnesthesiaRecord} 엔티티에 적힌 정의 그대로다
 * (ANESTHESIA_TYPE_CD 01~04, ASA_GRADE_CD 01~06). 예전에는 코드를 직접 타이핑하게
 * 하고 "01 general / 02 spinal …" 을 힌트로 띄웠는데, 사용자가 코드를 외워야 했고
 * 오타나 없는 코드도 그대로 저장됐다.</p>
 *
 * <p><b>admin 공통코드에서 읽지 않는 이유</b> — 두 그룹 모두 아직 admin 에 등록돼
 * 있지 않다. {@code useCommonCodeOptions} 를 쓰면 목록이 비어 마취기록 등록 자체가
 * 막힌다. 등록이 끝나면 다른 화면들처럼 그쪽으로 옮긴다(§21.4, admin 이관 요청서
 * 13·14번 항목).</p>
 */
const ANESTHESIA_TYPE_OPTIONS = [
  { value: "01", label: "01 General" },
  { value: "02", label: "02 Spinal" },
  { value: "03", label: "03 Local" },
  { value: "04", label: "04 Other" },
];

/** ASA 신체상태 분류 1~6등급. 값은 01~06 이다. */
const ASA_GRADE_OPTIONS = [
  { value: "01", label: "01 · ASA I — healthy" },
  { value: "02", label: "02 · ASA II — mild systemic disease" },
  { value: "03", label: "03 · ASA III — severe systemic disease" },
  { value: "04", label: "04 · ASA IV — constant threat to life" },
  { value: "05", label: "05 · ASA V — moribund" },
  { value: "06", label: "06 · ASA VI — brain-dead donor" },
];

/**
 * 저장된 코드를 선택지 문구로 되돌린다.
 *
 * <p>목록에 없는 값이면 코드를 그대로 보여준다 — 선택지가 바뀌기 전에 저장된
 * 기록이나 API 로 직접 넣은 값이 있을 수 있고, 그때 빈칸으로 두면 기록이
 * 사라진 것처럼 보인다.</p>
 */
function labelOf(
  options: { value: string; label: string }[],
  code: string | null | undefined,
): string {
  if (!code) return "-";
  return options.find((o) => o.value === code)?.label ?? code;
}

/**
 * 마취기록 패널 (SL2-34 조회 / SL2-21 생성 / SL2-18 활력징후)
 *
 * <p>활력징후는 CLOB 한 덩어리에 시각과 함께 누적된다. 항목별 컬럼이 없어 정렬·필터는
 * DB 가 못 하므로, 화면에서는 줄 단위로 끊어 최신순으로 뒤집어 보여준다.</p>
 *
 * <p><b>컴포넌트가 하는 일</b> — 상태를 읽고 액션을 던지는 것뿐이다.
 * API 주소도, 성공하면 무엇을 해야 하는지도 모른다. 그건 saga 의 몫이다.</p>
 * <pre>
 *   useSelector(...)      slice 에 담긴 상태를 읽는다
 *   dispatch(...Request)  "이걸 해달라"고 알린다. 실제 호출은 saga 가 한다
 *   useEffect(...)        화면이 처음 뜰 때 조회 액션을 한 번 던진다
 *   disabled={saving}     저장 중 중복 클릭을 막는다. saving 도 slice 가 관리한다
 * </pre>
 *
 * <p><b>화면에서도 입력값을 검사하는 이유</b> — 백엔드에도 @Valid 가 걸려 있지만,
 * 서버까지 갔다 와야 알 수 있다. 뻔한 실수는 화면에서 먼저 잡아 왕복을 줄인다(§15.3).
 * 화면 검사는 사용자 편의고, <b>진짜 방어선은 백엔드</b>다 — API 를 직접 호출하면
 * 화면 검사는 건너뛰어지기 때문이다.</p>
 */
export default function AnesthesiaRecordPanel({ surgeryId }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const records = useSelector(selectAnesthesiaRecords);
  const loading = useSelector(selectAnesthesiaLoading);
  const saving = useSelector(selectAnesthesiaSaving);
  const error = useSelector(selectAnesthesiaError);

  const [anesthesiaTypeCd, setAnesthesiaTypeCd] = useState("");
  const [asaGradeCd, setAsaGradeCd] = useState("");
  const [vitalInput, setVitalInput] = useState<Record<string, string>>({});

  useEffect(() => {
    dispatch(fetchAnesthesiaRecordsRequest(surgeryId));
  }, [dispatch, surgeryId]);

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    dispatch(
      createAnesthesiaRecordRequest(surgeryId, {
        anesthesiaTypeCd: anesthesiaTypeCd || null,
        asaGradeCd: asaGradeCd || null,
      }),
    );
    setAnesthesiaTypeCd("");
    setAsaGradeCd("");
  }

  /**
   * 활력징후 한 줄 추가.
   *
   * <p>기록마다 입력칸이 따로 있어야 해서 vitalInput 을 하나의 문자열이 아니라
   * {@code { 마취기록ID: 입력값 }} 형태로 들고 있다. 기록이 여러 건이어도 서로 섞이지 않는다.</p>
   */
  function handleAppendVitals(anesthesiaId: string) {
    const value = (vitalInput[anesthesiaId] ?? "").trim();
    if (!value) {
      // 빈 값을 보내면 시각만 붙은 빈 줄이 쌓이므로 화면에서 막는다
      dispatch(anesthesiaMutationFailure("Please enter a vital sign value."));
      return;
    }
    dispatch(
      appendVitalSignsRequest(anesthesiaId, surgeryId, {
        vitalSignsLog: value,
      }),
    );
    setVitalInput((prev) => ({ ...prev, [anesthesiaId]: "" }));
  }

  return (
    <div className="flex flex-col gap-6">
      <Panel className="p-4">
        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-slate-700">New anesthesia record</h3>

          <FormField label="Anesthesia type" htmlFor="anesthesiaTypeCd">
            <Select
              id="anesthesiaTypeCd"
              placeholder="Select"
              options={ANESTHESIA_TYPE_OPTIONS}
              value={anesthesiaTypeCd}
              onChange={(e) => setAnesthesiaTypeCd(e.target.value)}
              disabled={saving}
            />
          </FormField>

          <FormField label="ASA grade" htmlFor="asaGradeCd">
            <Select
              id="asaGradeCd"
              placeholder="Select"
              options={ASA_GRADE_OPTIONS}
              value={asaGradeCd}
              onChange={(e) => setAsaGradeCd(e.target.value)}
              disabled={saving}
            />
          </FormField>

          <FormActions
            onCancel={() => {
              setAnesthesiaTypeCd("");
              setAsaGradeCd("");
            }}
            cancelLabel="Reset"
            submitLabel="New anesthesia record"
            loading={saving}
          />
        </form>
      </Panel>

      {error ? <Alert>{resolveSurgeryMessage(error)}</Alert> : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : null}

      {!loading && records.length === 0 ? (
        <p className="text-sm text-slate-500">No anesthesia record yet.</p>
      ) : null}

      {records.map((record) => {
        // CLOB 누적 로그를 줄 단위로 끊어 최신 기록이 위로 오게 뒤집는다
        const lines = (record.vitalSignsLog ?? "")
          .split("\n")
          .filter((line) => line.trim() !== "")
          .reverse();

        return (
          <Panel key={record.anesthesiaId} className="p-4">
            <div className="mb-3 flex gap-4 text-xs text-slate-600">
              {/* 목록에서도 코드가 아니라 고른 문구로 보여준다 — 입력만 목록으로
                  바꾸고 표시가 "01" 로 남으면 뭘 골랐는지 다시 외워야 한다 */}
              <span>{labelOf(ANESTHESIA_TYPE_OPTIONS, record.anesthesiaTypeCd)}</span>
              <span>{labelOf(ASA_GRADE_OPTIONS, record.asaGradeCd)}</span>
            </div>

            <div className="mb-3 flex gap-2">
              <Input
                placeholder="e.g. BP 120/80, HR 72"
                value={vitalInput[record.anesthesiaId] ?? ""}
                onChange={(e) =>
                  setVitalInput((prev) => ({
                    ...prev,
                    [record.anesthesiaId]: e.target.value,
                  }))
                }
                disabled={saving}
              />
              <Button
                variant="secondary"
                onClick={() => handleAppendVitals(record.anesthesiaId)}
                disabled={saving}
                className="h-10 shrink-0"
              >
                Add vital signs
              </Button>
            </div>

            {lines.length === 0 ? (
              <p className="text-xs text-slate-500">
                No vital signs recorded.
              </p>
            ) : (
              <ul className="flex flex-col gap-1 text-xs text-slate-700">
                {lines.map((line, index) => (
                  <li key={`${record.anesthesiaId}-${index}`}>{line}</li>
                ))}
              </ul>
            )}
          </Panel>
        );
      })}
    </div>
  );
}

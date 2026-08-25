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
} from "@/components/common";
import { resolveSurgeryMessage } from "@/features/surgery/messages";

type Props = {
  surgeryId: string;
};

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
      dispatch(anesthesiaMutationFailure("활력징후 값을 입력해주세요."));
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
          <h3 className="text-sm font-medium text-slate-700">마취기록 등록</h3>

          <FormField
            label="마취 유형 코드"
            htmlFor="anesthesiaTypeCd"
            hint="01전신 / 02척추 / 03국소 / 04기타"
          >
            <Input
              id="anesthesiaTypeCd"
              value={anesthesiaTypeCd}
              onChange={(e) => setAnesthesiaTypeCd(e.target.value)}
              disabled={saving}
            />
          </FormField>

          <FormField label="ASA 등급 코드" htmlFor="asaGradeCd" hint="01~06">
            <Input
              id="asaGradeCd"
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
            cancelLabel="초기화"
            submitLabel="마취기록 등록"
            loading={saving}
          />
        </form>
      </Panel>

      {error ? <Alert>{resolveSurgeryMessage(error)}</Alert> : null}

      {loading ? (
        <p className="text-sm text-slate-500">불러오는 중입니다…</p>
      ) : null}

      {!loading && records.length === 0 ? (
        <p className="text-sm text-slate-500">등록된 마취기록이 없습니다.</p>
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
              <span>마취유형 {record.anesthesiaTypeCd ?? "-"}</span>
              <span>ASA {record.asaGradeCd ?? "-"}</span>
            </div>

            <div className="mb-3 flex gap-2">
              <Input
                placeholder="예: BP 120/80, HR 72"
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
                활력징후 추가
              </Button>
            </div>

            {lines.length === 0 ? (
              <p className="text-xs text-slate-500">
                기록된 활력징후가 없습니다.
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

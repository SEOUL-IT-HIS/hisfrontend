"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import {
  Alert,
  DataTable,
  Panel,
  StatusBadge,
  type DataTableColumn,
} from "@/components/common";
import { fetchEmpApi } from "@/features/emp/api/empApi";
import type { Emp } from "@/features/emp/types/empTypes";
import { usePatientNames } from "@/features/surgery/common/usePatientNames";
import { resolveSurgeryMessage } from "@/features/surgery/messages";
import {
  fetchRoomsRequest,
  selectRooms,
} from "@/features/surgery/room/slice";
import {
  SURGERY_STATUS,
  type SurgeryStatusHistory,
} from "@/features/surgery/schedule/types";
import {
  fetchHistoryRequest,
  fetchSurgeryRequest,
  assignSurgeonRequest,
  selectScheduleError,
  selectScheduleLoading,
  selectScheduleSaving,
  selectSelectedSurgery,
  selectSurgeryHistory,
} from "@/features/surgery/schedule/slice";

/**
 * 수술 배정·일정 상세 (SL2-13 집도의 / SL2-15 수술실 / SL2-43 마취의 / SL2-63 간호사 / SL2-282 이력)
 *
 * <h3>이 화면이 하는 일</h3>
 *
 * <p>수술 <b>한 건의 배정과 일정</b>을 관리한다. 진료·응급이 올린 요청을 배정해 수술이
 * 만들어진 뒤, 수술실이 바뀌거나 마취의가 정해지는 등의 조정이 여기서 일어난다.</p>
 *
 * <h3>기록 패널을 걷어낸 이유</h3>
 *
 * <p>예전에는 이 화면이 동의서·마취기록·수술기록지를 보여줬다. 그런데 여기는
 * {@code /surgery/schedule} 아래, 즉 <b>배정·일정 영역</b>이다. 일정 목록에서 수술을
 * 눌렀는데 기록 작성 화면이 나오면 기대와 어긋나고, 무엇보다 {@code /surgery/worklist} 가
 * 같은 패널 셋을 이미 보여주고 있었다. 기록은 워크리스트가, 배정은 여기가 맡는다.</p>
 *
 * <h3>상태 전이도 마저 넘겼다</h3>
 *
 * <p>8/25 에 기록만 옮기고 <b>시작·종료·취소 버튼은 남겨 두었다.</b> 그래서 동의서를
 * 워크리스트에서 쓰고, 시작하려면 이 화면으로 건너와야 했다. 반쪽만 옮긴 셈이다.</p>
 *
 * <p>이제 이 화면은 <b>누가·어디서·언제</b> 할지만 정한다. 수술이 실제로 벌어지는 동안의
 * 조작은 전부 수술 업무 화면 몫이다. 상태는 여기서 <b>읽기만</b> 한다 — 배정을 고칠 수
 * 있는지가 상태에 달려 있어(예약에서만 가능) 안 보여줄 수는 없다.</p>
 *
 * <h3>배정 수정 범위</h3>
 *
 * <p>예약 상태에서는 집도의 변경을 허용한다. 수술팀이 구두·메신저 등으로 변경 요청을
 * 확인한 뒤 수정하며, 이 변경은 별도 이력으로 기록하지 않는다. 수술실·마취의·간호사
 * 배정은 이 화면에서도 변경할 수 없다.</p>
 */

type Props = { surgeryId: string };

const STATUS_LABEL: Record<string, string> = {
  [SURGERY_STATUS.SCHEDULED]: "Scheduled",
  [SURGERY_STATUS.IN_PROGRESS]: "In progress",
  [SURGERY_STATUS.COMPLETED]: "Completed",
  [SURGERY_STATUS.CANCELLED]: "Cancelled",
};

/** 이력의 statusType 을 사람이 읽는 말로. 서버 내부 구분자라 공통코드에 없다 */
const TYPE_LABEL: Record<string, string> = {
  STATUS: "Status",
  PROGRESS: "Progress",
};

export default function SurgeryScheduleDetail({ surgeryId }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const surgery = useSelector(selectSelectedSurgery);
  const history = useSelector(selectSurgeryHistory);
  const rooms = useSelector(selectRooms);
  const loading = useSelector(selectScheduleLoading);
  const saving = useSelector(selectScheduleSaving);
  const error = useSelector(selectScheduleError);

  // 직원 목록 — 이름을 보여주기 위해서만 받는다.
  //   수술 DB 에는 이름이 없고 식별자만 있어서(§21.9), 이것 없이는 화면에 숫자만 뜬다.
  //   집도의 변경 시 이 목록에서 새 담당자를 선택한다.
  const [employees, setEmployees] = useState<Emp[]>([]);
  const [empError, setEmpError] = useState("");
  const [surgeonDraft, setSurgeonDraft] = useState<{
    currentSurgeonId: string;
    selectedSurgeonId: string;
  } | null>(null);

  // 환자도 같은 이유로 이름을 받아온다. surgery 가 아직 없으면 빈 배열이라 호출도 없다.
  const { names: patientNames } = usePatientNames(
    surgery ? [surgery.patientId] : [],
  );

  useEffect(() => {
    dispatch(fetchSurgeryRequest(surgeryId));
    dispatch(fetchHistoryRequest(surgeryId));
    dispatch(fetchRoomsRequest({ page: 0, size: 100 }));
  }, [dispatch, surgeryId]);

  useEffect(() => {
    let ignore = false;
    fetchEmpApi()
      .then((list) => {
        if (!ignore) setEmployees(list);
      })
      .catch((err: unknown) => {
        if (ignore) return;
        setEmpError(
          err instanceof Error ? err.message : "Failed to load the employee list.",
        );
      });
    return () => {
      ignore = true;
    };
  }, []);

  if (loading && !surgery) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }
  if (!surgery) {
    return <Alert>{resolveSurgeryMessage(error || "SUR035")}</Alert>;
  }

  /** 수술실 코드를 이름으로. 못 찾으면 코드라도 보여준다 — 빈칸보다는 낫다 */
  const roomLabel = (code?: string | null) => {
    if (!code) return "Unassigned";
    const room = (rooms?.items ?? []).find((r) => r.roomCode === code);
    return room ? `${room.roomName} (${room.roomCode})` : code;
  };

  /** 직원 ID 를 이름으로. admin 의 empId 는 number, 수술은 문자열이라 맞춰 비교한다 */
  const empLabel = (id?: string | null) => {
    if (!id) return "Unassigned";
    const emp = employees.find((e) => String(e.empId) === id);
    return emp ? `${emp.empName} (${emp.empNo})` : id;
  };

  const canChangeSurgeon = surgery.statusCd === SURGERY_STATUS.SCHEDULED;
  const selectedSurgeonId =
    surgeonDraft?.currentSurgeonId === surgery.surgeonId
      ? surgeonDraft.selectedSurgeonId
      : surgery.surgeonId;
  const surgeonChanged = selectedSurgeonId !== surgery.surgeonId;

  const historyColumns: DataTableColumn<SurgeryStatusHistory>[] = [
    {
      key: "changedAt",
      header: "Changed at",
      render: (h) => h.changedAt?.replace("T", " ").slice(0, 16) ?? "-",
    },
    {
      key: "statusType",
      header: "Type",
      render: (h) => TYPE_LABEL[h.statusType] ?? h.statusType,
    },
    {
      key: "change",
      header: "Change",
      render: (h) => (
        <span>
          {h.beforeCd ? (STATUS_LABEL[h.beforeCd] ?? h.beforeCd) : "—"}
          <span className="mx-1 text-slate-400">→</span>
          {STATUS_LABEL[h.afterCd] ?? h.afterCd}
        </span>
      ),
    },
    { key: "reasonCd", header: "Reason", render: (h) => h.reasonCd ?? "-" },
    {
      key: "changedBy",
      header: "Changed by",
      // 로그인 세션이 없어 서버가 채우지 못한다(SL2-303·304와 같은 벽)
      render: (h) => h.changedBy ?? "-",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {error ? <Alert>{resolveSurgeryMessage(error)}</Alert> : null}
      {/* 직원 조회는 admin-service 라 그쪽이 내려가도 배정 외 기능은 쓸 수 있어야 한다 */}
      {empError ? <Alert>{empError}</Alert> : null}

      {/* ---- 수술 정보 ---- */}
      <Panel className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-sm font-medium text-slate-800">
            {surgery.surgeryName ?? "No surgery name"}
          </span>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
            {STATUS_LABEL[surgery.statusCd] ?? surgery.statusCd}
          </span>
          {surgery.emergencyYn === "Y" ? (
            <StatusBadge value="Y" activeLabel="Emergency" />
          ) : null}
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-4">
          <div>
            <dt className="text-slate-500">Patient</dt>
            <dd className="text-slate-800">
              {patientNames[surgery.patientId] ?? surgery.patientId}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Date</dt>
            <dd className="text-slate-800">{surgery.surgeryDt}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Actual start</dt>
            <dd className="text-slate-800">
              {surgery.actualStartDt?.replace("T", " ").slice(0, 16) ?? "-"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Actual end</dt>
            <dd className="text-slate-800">
              {surgery.actualEndDt?.replace("T", " ").slice(0, 16) ?? "-"}
            </dd>
          </div>
        </dl>
      </Panel>

      {/* ---- 배정 ---- */}
      <Panel className="p-5">
        <h2 className="mb-1 text-sm font-medium text-slate-700">Assignment</h2>
        <p className="mb-4 text-xs text-slate-500">
          The surgeon can be changed while the surgery is scheduled. Surgeon
          changes are not recorded in the history.
        </p>

        <dl className="grid gap-x-6 gap-y-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-slate-500">Room</dt>
            <dd className="text-slate-800">{roomLabel(surgery.roomCode)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Surgeon</dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2">
              <select
                aria-label="Surgeon"
                className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-800 disabled:bg-slate-100"
                value={selectedSurgeonId}
                onChange={(event) =>
                  setSurgeonDraft({
                    currentSurgeonId: surgery.surgeonId,
                    selectedSurgeonId: event.target.value,
                  })
                }
                disabled={!canChangeSurgeon || saving || Boolean(empError)}
              >
                {!employees.some((emp) => String(emp.empId) === selectedSurgeonId) ? (
                  <option value={selectedSurgeonId}>
                    {empLabel(selectedSurgeonId)}
                  </option>
                ) : null}
                {employees.map((emp) => (
                  <option key={emp.empId} value={String(emp.empId)}>
                    {emp.empName} ({emp.empNo})
                  </option>
                ))}
              </select>
              {canChangeSurgeon ? (
                <button
                  type="button"
                  className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!surgeonChanged || saving || Boolean(empError)}
                  onClick={() =>
                    dispatch(
                      assignSurgeonRequest(surgery.surgeryId, {
                        surgeonId: selectedSurgeonId,
                      }),
                    )
                  }
                >
                  {saving ? "Saving…" : "Update surgeon"}
                </button>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Anesthesiologist</dt>
            <dd className="text-slate-800">
              {/* 무마취 시술은 마취의가 없는 것이 정상이다 — '미배정'으로 보이면
                  누락으로 읽히므로 사유를 밝혀 준다 */}
              {surgery.anesthesiaYn === "N"
                ? "Not applicable (no anesthesia)"
                : empLabel(surgery.anesthesiologistId)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Nurse</dt>
            <dd className="text-slate-800">{empLabel(surgery.nurseId)}</dd>
          </div>
        </dl>
      </Panel>

      {/* ---- 상태변경 이력 ---- */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-slate-700">
          Status change history
        </h2>
        <DataTable
          columns={historyColumns}
          rows={history}
          rowKey={(h) => h.historyId}
          loading={loading}
          emptyMessage="No history."
          minWidthClassName="min-w-[560px]"
        />
      </div>

      {/* 기록도 상태 전이도 워크리스트가 맡는다 — 여기서는 길만 열어둔다 */}
      <p className="text-xs text-slate-500">
        Start / end / cancel, consents, checklist, anesthesia and operative records
        are all handled in{" "}
        <Link href="/surgery/worklist" className="text-sky-600 underline">
          Surgery worklist
        </Link>
        .
      </p>
    </div>
  );
}

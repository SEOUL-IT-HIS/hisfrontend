"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import {
  Alert,
  Button,
  DataTable,
  FormField,
  Panel,
  Select,
  StatusBadge,
  type DataTableColumn,
} from "@/components/common";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import { fetchEmpApi } from "@/features/emp/api/empApi";
import type { Emp } from "@/features/emp/types/empTypes";
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
  assignFieldRequest,
  cancelSurgeryRequest,
  endSurgeryRequest,
  fetchHistoryRequest,
  fetchSurgeryRequest,
  selectScheduleError,
  selectScheduleLoading,
  selectScheduleSaving,
  selectSelectedSurgery,
  selectSurgeryHistory,
  startSurgeryRequest,
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
 * 같은 패널 셋을 이미 보여주고 있었다. 기록은 워크리스트가, 배정은 여기가 맡는다.
 * (2026-08-25)</p>
 *
 * <h3>고르면 바로 저장한다</h3>
 *
 * <p>처음에는 셀렉트마다 '저장' 버튼을 뒀는데, 같은 성격의 조작을 하는 {@code RoomList}·
 * {@code EquipmentList} 는 버튼 없이 {@code onChange} 에서 바로 보내고 있었다. 한 서비스
 * 안에서 어떤 화면은 고르면 끝, 어떤 화면은 고르고 또 눌러야 하는 상태였다.
 * 버튼을 없애 그쪽에 맞췄다. (2026-08-26)</p>
 *
 * <p>항목별로 <b>따로</b> 보내는 것은 그대로다 — 백엔드가 수술실·집도의·마취의·간호사를
 * 각각 다른 PATCH 로 받고(SL2-166), 한 번에 묶어 보내면 수술실만 바꾸려는데 마취의까지
 * 다시 보내게 되어 그 사이 다른 사람이 바꾼 값을 덮어쓴다.</p>
 *
 * <h3>집도의만 비울 수 없다</h3>
 *
 * <p>수술에 집도의가 없는 상태는 업무상 성립하지 않아 백엔드가 막는다. 나머지 셋은
 * 비워 저장하면 배정이 해제된다.</p>
 */

type Props = { surgeryId: string };

const STATUS_LABEL: Record<string, string> = {
  [SURGERY_STATUS.SCHEDULED]: "예약",
  [SURGERY_STATUS.IN_PROGRESS]: "진행중",
  [SURGERY_STATUS.COMPLETED]: "완료",
  [SURGERY_STATUS.CANCELLED]: "취소",
};

/** 이력의 statusType 을 사람이 읽는 말로. 서버 내부 구분자라 공통코드에 없다 */
const TYPE_LABEL: Record<string, string> = {
  STATUS: "상태",
  PROGRESS: "진행단계",
};

export default function SurgeryScheduleDetail({ surgeryId }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const surgery = useSelector(selectSelectedSurgery);
  const history = useSelector(selectSurgeryHistory);
  const rooms = useSelector(selectRooms);
  const loading = useSelector(selectScheduleLoading);
  const saving = useSelector(selectScheduleSaving);
  const error = useSelector(selectScheduleError);

  const { options: cancelOptions } = useCommonCodeOptions("SURGERY_CANCEL_CD");

  // 배정 입력값. 조회 결과가 오면 한 번만 채운다(아래 boundId 참고)
  const [form, setForm] = useState({
    roomCode: "",
    surgeonId: "",
    anesthesiologistId: "",
    nurseId: "",
  });
  const [boundId, setBoundId] = useState<string | null>(null);
  const [cancelReasonCd, setCancelReasonCd] = useState("");

  // 집도의·마취의·간호사 선택 목록 — admin-service 직원 조회
  //   수술 DB 에는 이름이 없고 식별자만 있다(§21.9). 사용자에게 UUID 를 타이핑하게
  //   할 수는 없으므로 배정 화면(SurgeryAssignForm)과 같은 방식으로 목록을 받아 고르게 한다.
  const [employees, setEmployees] = useState<Emp[]>([]);
  const [empError, setEmpError] = useState("");

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
          err instanceof Error ? err.message : "직원 목록 조회에 실패했습니다.",
        );
      });
    return () => {
      ignore = true;
    };
  }, []);

  // 조회 결과가 도착하면 초기값을 채운다. effect 가 아니라 렌더 중에 처리하는 이유 —
  // 사용자가 고치는 중인 값을 뒤늦게 도착한 응답이 덮어쓰지 않게 하기 위해서다.
  if (surgery && surgery.surgeryId !== boundId) {
    setBoundId(surgery.surgeryId);
    setForm({
      roomCode: surgery.roomCode ?? "",
      surgeonId: surgery.surgeonId ?? "",
      anesthesiologistId: surgery.anesthesiologistId ?? "",
      nurseId: surgery.nurseId ?? "",
    });
  }

  if (loading && !surgery) {
    return <p className="text-sm text-slate-500">불러오는 중입니다…</p>;
  }
  if (!surgery) {
    return <Alert>{resolveSurgeryMessage(error || "SUR035")}</Alert>;
  }

  const isScheduled = surgery.statusCd === SURGERY_STATUS.SCHEDULED;
  const isInProgress = surgery.statusCd === SURGERY_STATUS.IN_PROGRESS;

  /**
   * 배정은 <b>예약(01) 상태에서만</b> 고칠 수 있다.
   *
   * <p>처음에는 진행중도 열어뒀는데, 백엔드가 400 SUR039 로 막는 것을 실제 호출로
   * 확인했다(2026-08-25). 환자가 이미 수술대에 있는데 수술실을 바꾸는 것은 업무상
   * 성립하지 않는다. 열어두면 눌러도 오류만 뜨므로 화면에서도 잠근다.</p>
   */
  const editable = isScheduled;

  // 사용가능(01)한 방만 고르게 하되, 지금 배정된 방은 상태와 무관하게 남긴다 —
  // 빼면 셀렉트가 현재 값을 표시하지 못해 미배정처럼 보인다.
  const roomOptions = (rooms?.items ?? [])
    .filter((r) => r.statusCd === "01" || r.roomCode === surgery.roomCode)
    .map((r) => ({ value: r.roomCode, label: `${r.roomName} (${r.roomCode})` }));

  // admin-service 는 empId 가 number, 수술은 VARCHAR2(36) 문자열이라 변환해 보낸다
  const employeeOptions = employees.map((e) => ({
    value: String(e.empId),
    label: `${e.empName} (${e.empNo})`,
  }));

  const historyColumns: DataTableColumn<SurgeryStatusHistory>[] = [
    {
      key: "changedAt",
      header: "변경일시",
      render: (h) => h.changedAt?.replace("T", " ").slice(0, 16) ?? "-",
    },
    {
      key: "statusType",
      header: "구분",
      render: (h) => TYPE_LABEL[h.statusType] ?? h.statusType,
    },
    {
      key: "change",
      header: "변경",
      render: (h) => (
        <span>
          {h.beforeCd ? (STATUS_LABEL[h.beforeCd] ?? h.beforeCd) : "—"}
          <span className="mx-1 text-slate-400">→</span>
          {STATUS_LABEL[h.afterCd] ?? h.afterCd}
        </span>
      ),
    },
    { key: "reasonCd", header: "사유", render: (h) => h.reasonCd ?? "-" },
    {
      key: "changedBy",
      header: "변경자",
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
            {surgery.surgeryName ?? "수술명 미입력"}
          </span>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
            {STATUS_LABEL[surgery.statusCd] ?? surgery.statusCd}
          </span>
          {surgery.emergencyYn === "Y" ? (
            <StatusBadge value="Y" activeLabel="응급" />
          ) : null}
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-4">
          <div>
            <dt className="text-slate-500">환자</dt>
            <dd className="text-slate-800">{surgery.patientId}</dd>
          </div>
          <div>
            <dt className="text-slate-500">수술일</dt>
            <dd className="text-slate-800">{surgery.surgeryDt}</dd>
          </div>
          <div>
            <dt className="text-slate-500">실제 시작</dt>
            <dd className="text-slate-800">
              {surgery.actualStartDt?.replace("T", " ").slice(0, 16) ?? "-"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">실제 종료</dt>
            <dd className="text-slate-800">
              {surgery.actualEndDt?.replace("T", " ").slice(0, 16) ?? "-"}
            </dd>
          </div>
        </dl>
      </Panel>

      {/* ---- 배정 ---- */}
      <Panel className="p-5">
        <h2 className="mb-1 text-sm font-medium text-slate-700">배정</h2>
        <p className="mb-4 text-xs text-slate-500">
          고르면 바로 저장됩니다. 집도의를 뺀 셋은 비워 두면 배정이 해제됩니다.
          {!editable
            ? isInProgress
              ? " 진행중인 수술은 배정을 바꿀 수 없습니다."
              : " 끝난 수술은 배정을 바꿀 수 없습니다."
            : ""}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="수술실" htmlFor="a-room">
            <Select
              id="a-room"
              placeholder="미배정"
              options={roomOptions}
              value={form.roomCode}
              disabled={saving || !editable}
              onChange={(e) => {
                setForm({ ...form, roomCode: e.target.value });
                dispatch(
                  assignFieldRequest(surgeryId, "room", {
                    roomCode: e.target.value,
                  }),
                );
              }}
            />
          </FormField>

          <FormField
            label="집도의"
            htmlFor="a-surgeon"
            required
            hint="비울 수 없습니다."
          >
            <Select
              id="a-surgeon"
              placeholder="선택"
              options={employeeOptions}
              value={form.surgeonId}
              disabled={saving || !editable}
              onChange={(e) => {
                setForm({ ...form, surgeonId: e.target.value });
                // 빈 값은 보내지 않는다 — 집도의 해제는 백엔드가 막으므로(400)
                // 그대로 보내면 사용자는 "선택"을 골랐을 뿐인데 오류만 본다.
                // RoomList 의 턴오버가 쓰는 것과 같은 방식이다.
                if (!e.target.value) return;
                dispatch(
                  assignFieldRequest(surgeryId, "surgeon", {
                    surgeonId: e.target.value,
                  }),
                );
              }}
            />
          </FormField>

          <FormField label="마취의" htmlFor="a-anes">
            <Select
              id="a-anes"
              placeholder="미배정"
              options={employeeOptions}
              value={form.anesthesiologistId}
              disabled={saving || !editable}
              onChange={(e) => {
                setForm({ ...form, anesthesiologistId: e.target.value });
                dispatch(
                  assignFieldRequest(surgeryId, "anesthesiologist", {
                    anesthesiologistId: e.target.value,
                  }),
                );
              }}
            />
          </FormField>

          <FormField label="간호사" htmlFor="a-nurse">
            <Select
              id="a-nurse"
              placeholder="미배정"
              options={employeeOptions}
              value={form.nurseId}
              disabled={saving || !editable}
              onChange={(e) => {
                setForm({ ...form, nurseId: e.target.value });
                dispatch(
                  assignFieldRequest(surgeryId, "nurse", {
                    nurseId: e.target.value,
                  }),
                );
              }}
            />
          </FormField>
        </div>
      </Panel>

      {/* ---- 상태 전이 ---- */}
      <Panel className="p-5">
        <h2 className="mb-1 text-sm font-medium text-slate-700">상태</h2>
        <p className="mb-4 text-xs text-slate-500">
          예약 → 진행중 → 완료 순으로만 넘어갑니다. 취소는 예약 상태에서만 됩니다.
        </p>

        <div className="flex flex-wrap items-end gap-3">
          <Button
            disabled={saving || !isScheduled}
            onClick={() => dispatch(startSurgeryRequest(surgeryId))}
          >
            수술 시작
          </Button>
          <Button
            disabled={saving || !isInProgress}
            onClick={() => dispatch(endSurgeryRequest(surgeryId))}
          >
            수술 종료
          </Button>

          {/*
            취소 사유는 필수다(SL2-178). 고르지 않으면 버튼이 잠긴다 —
            그냥 보내면 백엔드 @NotBlank 가 400 으로 막아, 사용자는 왜 안 되는지 모른 채
            오류만 본다. 화면에서 미리 막는 편이 낫다.
          */}
          <div className="flex items-end gap-2">
            <FormField
              label="취소 사유"
              htmlFor="cancel-reason"
              required
              hint={
                cancelOptions.length === 0
                  ? "사유 코드를 불러오지 못했습니다. admin 서비스를 확인하세요."
                  : undefined
              }
            >
              <Select
                id="cancel-reason"
                placeholder="선택"
                options={cancelOptions}
                value={cancelReasonCd}
                disabled={saving || !isScheduled}
                onChange={(e) => setCancelReasonCd(e.target.value)}
              />
            </FormField>
            <Button
              disabled={saving || !isScheduled || !cancelReasonCd}
              onClick={() =>
                dispatch(
                  cancelSurgeryRequest(surgeryId, {
                    cancelReasonCd,
                  }),
                )
              }
            >
              수술 취소
            </Button>
          </div>
        </div>
      </Panel>

      {/* ---- 상태변경 이력 ---- */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-slate-700">
          상태 변경 이력
        </h2>
        <DataTable
          columns={historyColumns}
          rows={history}
          rowKey={(h) => h.historyId}
          loading={loading}
          emptyMessage="이력이 없습니다."
          minWidthClassName="min-w-[560px]"
        />
      </div>

      {/* 기록은 워크리스트가 맡는다 — 여기서는 길만 열어둔다 */}
      <p className="text-xs text-slate-500">
        동의서·체크리스트·마취기록·수술기록지는{" "}
        <Link href="/surgery/worklist" className="text-sky-600 underline">
          수술 업무
        </Link>{" "}
        화면에서 작성합니다.
      </p>
    </div>
  );
}

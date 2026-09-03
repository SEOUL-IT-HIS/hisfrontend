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
  selectScheduleError,
  selectScheduleLoading,
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
 * <h3>배정도 읽기만 한다</h3>
 *
 * <p>얼마 전까지 이 화면에서 수술실·집도의·마취의·간호사를 셀렉트로 바꿀 수 있었다.
 * 고르면 바로 개별 배정 API 로 날아갔다.</p>
 *
 * <p>그 기능을 없앴다. 이유는 두 가지다.</p>
 *
 * <p>첫째, <b>아무 흔적도 남지 않았다.</b> 개별 배정 API 는 이력을 기록하지 않아서
 * 수술실이 3번에서 5번으로 바뀌어도 아래 이력 표에는 아무것도 뜨지 않았다.
 * 같은 화면에 이력 표를 두고 그 표에 안 잡히는 변경 수단을 나란히 놓고 있었던 셈이다.</p>
 *
 * <p>둘째, <b>배정 승인 때 걸어 둔 검증이 무너졌다.</b> 마취를 시행하는 수술이라
 * 마취의를 필수로 받아 놓고는, 여기서 마취의를 '미배정'으로 되돌릴 수 있었다.</p>
 *
 * <p>이제 배정은 <b>승인하는 순간 한 번에 확정</b>되고(배정 대기 목록의 배정 폼),
 * 그 뒤로는 바꿀 수 없다. 백엔드도 SUR059 로 거절한다. 잘못 배정했으면 수술 업무에서
 * 취소하고 다시 요청받는다 — 그 경로는 사유가 남고 진료 쪽도 결과를 안다.</p>
 *
 * <p>그래서 이 화면은 지금 <b>전부 읽기 전용</b>이다. 배정 조합과 그 수술이 어떤 상태
 * 변화를 거쳐 왔는지를 보여주는 것이 하는 일의 전부다.</p>
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
  const error = useSelector(selectScheduleError);

  // 직원 목록 — 이름을 보여주기 위해서만 받는다.
  //   수술 DB 에는 이름이 없고 식별자만 있어서(§21.9), 이것 없이는 화면에 숫자만 뜬다.
  //   고르게 하려는 것이 아니다 — 배정은 여기서 바꿀 수 없다.
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

  if (loading && !surgery) {
    return <p className="text-sm text-slate-500">불러오는 중입니다…</p>;
  }
  if (!surgery) {
    return <Alert>{resolveSurgeryMessage(error || "SUR035")}</Alert>;
  }

  /** 수술실 코드를 이름으로. 못 찾으면 코드라도 보여준다 — 빈칸보다는 낫다 */
  const roomLabel = (code?: string | null) => {
    if (!code) return "미배정";
    const room = (rooms?.items ?? []).find((r) => r.roomCode === code);
    return room ? `${room.roomName} (${room.roomCode})` : code;
  };

  /** 직원 ID 를 이름으로. admin 의 empId 는 number, 수술은 문자열이라 맞춰 비교한다 */
  const empLabel = (id?: string | null) => {
    if (!id) return "미배정";
    const emp = employees.find((e) => String(e.empId) === id);
    return emp ? `${emp.empName} (${emp.empNo})` : id;
  };

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

      {/* ---- 배정 (읽기 전용) ---- */}
      <Panel className="p-5">
        <h2 className="mb-1 text-sm font-medium text-slate-700">배정</h2>
        <p className="mb-4 text-xs text-slate-500">
          배정은 요청을 승인할 때 확정되며 이후에는 바꿀 수 없습니다. 바꿔야 하면{" "}
          <Link href="/surgery/worklist" className="text-sky-600 underline">
            수술 업무
          </Link>
          에서 수술을 취소하고 진료 쪽에서 다시 요청받아야 합니다.
        </p>

        <dl className="grid gap-x-6 gap-y-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-slate-500">수술실</dt>
            <dd className="text-slate-800">{roomLabel(surgery.roomCode)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">집도의</dt>
            <dd className="text-slate-800">{empLabel(surgery.surgeonId)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">마취의</dt>
            <dd className="text-slate-800">
              {/* 무마취 시술은 마취의가 없는 것이 정상이다 — '미배정'으로 보이면
                  누락으로 읽히므로 사유를 밝혀 준다 */}
              {surgery.anesthesiaYn === "N"
                ? "해당 없음 (무마취 시술)"
                : empLabel(surgery.anesthesiologistId)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">간호사</dt>
            <dd className="text-slate-800">{empLabel(surgery.nurseId)}</dd>
          </div>
        </dl>
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

      {/* 기록도 상태 전이도 워크리스트가 맡는다 — 여기서는 길만 열어둔다 */}
      <p className="text-xs text-slate-500">
        수술 시작·종료·취소와 동의서·체크리스트·마취기록·수술기록지는{" "}
        <Link href="/surgery/worklist" className="text-sky-600 underline">
          수술 업무
        </Link>{" "}
        화면에서 처리합니다.
      </p>
    </div>
  );
}

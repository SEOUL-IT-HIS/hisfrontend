"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import {
  Alert,
  DataTable,
  Pagination,
  Select,
  type DataTableColumn,
} from "@/components/common";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import { resolveSurgeryMessage } from "@/features/surgery/messages";
import type { SurgeryRoom } from "@/features/surgery/room/types";
import {
  changeRoomStatusRequest,
  changeRoomTurnoverRequest,
  fetchRoomsRequest,
  selectRoomError,
  selectRoomLoading,
  selectRoomSaving,
  selectRooms,
} from "@/features/surgery/room/slice";

/**
 * 수술실 목록 (SL2-6 조회 / SL2-8 상태변경 / SL2-50 턴오버)
 *
 * <p>상태·턴오버는 한 필드만 바꾸는 전이라 목록에서 바로 처리한다(백엔드도 PATCH).
 * "제거"는 물리 삭제가 아니라 폐쇄 상태로의 전이이므로 삭제 버튼을 두지 않는다(§21.6).</p>
 *
 * <p>상태·턴오버 선택지는 admin-service 공통코드에서 가져온다(§21.4). 코드명이 바뀌면
 * admin 만 고치면 되고 이 화면은 손대지 않는다. 수술은 코드<b>값</b>만 저장하고
 * 표시명은 저장하지 않는다(§14.1).</p>
 *
 * <p><b>훅을 컴포넌트 맨 위에서 한 번만 부르는 이유</b> — 코드 조회를 셀렉트마다 하는
 * 방식으로 만들면 행마다 admin 을 따로 호출한다. 수술실이 20개면 상태·턴오버 두 열에서만
 * 40번을 부르게 된다. 여기서 한 번 받아 모든 행이 나눠 쓰면 그룹당 1회로 끝난다.</p>
 *
 * <p><b>공통 컴포넌트로 전환</b>(§12.1 "components/ 하위 공통 컴포넌트를 우선 사용한다") —
 * 표·셀렉트·오류문구·페이지네이션을 직접 짜지 않고 components/common 을 쓴다.
 * 표 모양이 바뀌어도 이 화면은 손대지 않아도 되고, 다른 서비스 화면과 생김새가 같아진다.</p>
 */

/** 폐쇄(04)·점검중(03)에서는 턴오버를 바꿀 수 없다 */
const TURNOVER_LOCKED_STATUS = ["03", "04"];

export default function RoomList() {
  const dispatch = useDispatch<AppDispatch>();
  const rooms = useSelector(selectRooms);
  const loading = useSelector(selectRoomLoading);
  const saving = useSelector(selectRoomSaving);
  const error = useSelector(selectRoomError);

  // 공통 Pagination 은 1-base, 백엔드 Pageable 은 0-base 다. 화면 쪽을 1-base 로 두고
  //   보낼 때만 1을 뺀다 — 사용자에게 보이는 번호와 상태값이 어긋나지 않게 하기 위해서다.
  const [page, setPage] = useState(1);

  // admin 이 꺼져 있으면 options 가 빈 배열이라 선택지가 비어 보인다. 그래도 목록 조회는
  // 그대로 되므로 화면 전체가 죽지는 않는다.
  const { options: statusOptions } = useCommonCodeOptions("OR_STATUS_CD");
  const { options: turnoverOptions } = useCommonCodeOptions("OR_TURNOVER_CD");

  useEffect(() => {
    dispatch(fetchRoomsRequest({ page: page - 1 }));
  }, [dispatch, page]);

  const items = rooms?.items ?? [];

  const columns: DataTableColumn<SurgeryRoom>[] = [
    {
      key: "roomCode",
      header: "수술실 코드",
      render: (room) => room.roomCode,
    },
    {
      key: "roomName",
      header: "수술실명",
      render: (room) => room.roomName,
    },
    {
      key: "statusCd",
      header: "상태",
      render: (room) => (
        <Select
          className="h-8 text-xs"
          placeholder="미지정"
          options={statusOptions}
          value={room.statusCd ?? ""}
          disabled={saving}
          onChange={(e) =>
            dispatch(
              changeRoomStatusRequest(room.roomCode, {
                statusCd: e.target.value,
              }),
            )
          }
        />
      ),
    },
    {
      key: "turnoverCd",
      header: "턴오버",
      render: (room) => (
        <Select
          className="h-8 text-xs"
          placeholder="미지정"
          options={turnoverOptions}
          value={room.turnoverCd ?? ""}
          disabled={saving || TURNOVER_LOCKED_STATUS.includes(room.statusCd ?? "")}
          onChange={(e) => {
            // 미지정으로 되돌리는 요청은 보내지 않는다 — 턴오버 해제라는 업무가 없다
            if (!e.target.value) {
              return;
            }
            dispatch(
              changeRoomTurnoverRequest(room.roomCode, {
                turnoverCd: e.target.value,
              }),
            );
          }}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {error ? <Alert>{resolveSurgeryMessage(error)}</Alert> : null}

      <DataTable
        columns={columns}
        rows={items}
        rowKey={(room) => room.roomCode}
        loading={loading}
        emptyMessage="등록된 수술실이 없습니다."
        minWidthClassName="min-w-[640px]"
      />

      {rooms ? (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">전체 {rooms.totalElements}건</p>
          <Pagination
            page={page}
            totalPages={rooms.totalPages}
            onPageChange={setPage}
          />
        </div>
      ) : null}
    </div>
  );
}

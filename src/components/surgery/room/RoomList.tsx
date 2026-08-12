"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import { resolveSurgeryMessage } from "@/features/surgery/messages";
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
 * <p><b>훅을 컴포넌트 맨 위에서 한 번만 부르는 이유</b> — 행마다 &lt;CommonCodeSelect&gt; 를
 * 쓰면 각 인스턴스가 따로 admin 을 호출한다. 수술실이 20개면 상태·턴오버 두 열에서만
 * 40번을 부르게 된다. 여기서 한 번 받아 모든 행이 나눠 쓰면 그룹당 1회로 끝난다.</p>
 */

const selectClass =
  "h-8 rounded-md border border-slate-200 px-2 text-xs outline-none focus:border-sky-400 disabled:bg-slate-50";

export default function RoomList() {
  const dispatch = useDispatch<AppDispatch>();
  const rooms = useSelector(selectRooms);
  const loading = useSelector(selectRoomLoading);
  const saving = useSelector(selectRoomSaving);
  const error = useSelector(selectRoomError);

  // admin 이 꺼져 있으면 options 가 빈 배열이라 선택지가 비어 보인다. 그래도 목록 조회는
  // 그대로 되므로 화면 전체가 죽지는 않는다.
  const { options: statusOptions } = useCommonCodeOptions("OR_STATUS_CD");
  const { options: turnoverOptions } = useCommonCodeOptions("OR_TURNOVER_CD");

  useEffect(() => {
    dispatch(fetchRoomsRequest());
  }, [dispatch]);

  if (loading) {
    return <p className="p-4 text-sm text-slate-500">불러오는 중입니다…</p>;
  }

  if (error) {
    return (
      <p className="p-4 text-sm text-red-600">{resolveSurgeryMessage(error)}</p>
    );
  }

  const items = rooms?.items ?? [];

  if (items.length === 0) {
    return <p className="p-4 text-sm text-slate-500">등록된 수술실이 없습니다.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-3 py-2">수술실 코드</th>
            <th className="px-3 py-2">수술실명</th>
            <th className="px-3 py-2">상태</th>
            <th className="px-3 py-2">턴오버</th>
            <th className="px-3 py-2">수정</th>
          </tr>
        </thead>
        <tbody>
          {items.map((room) => (
            <tr key={room.roomCode} className="border-t border-slate-100">
              <td className="px-3 py-2">{room.roomCode}</td>
              <td className="px-3 py-2">{room.roomName}</td>
              <td className="px-3 py-2">
                <select
                  className={selectClass}
                  value={room.statusCd ?? ""}
                  disabled={saving}
                  onChange={(e) =>
                    dispatch(
                      changeRoomStatusRequest(room.roomCode, {
                        statusCd: e.target.value,
                      }),
                    )
                  }
                >
                  <option value="">미지정</option>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-2">
                <select
                  className={selectClass}
                  value={room.turnoverCd ?? ""}
                  disabled={saving||room.statusCd === "03"||room.statusCd === "04"} // 폐쇄 상태에서는 턴오버 변경 불가
                  onChange={(e) => {
                    if (!e.target.value) return;   // 미지정은 전송하지 않는다
                    dispatch(
                      changeRoomTurnoverRequest(room.roomCode, { turnoverCd: e.target.value }),
                    );
                  }}
                >
                  <option value="" disabled>
                    미지정
                  </option>
                  {turnoverOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {rooms && (
        <p className="px-3 py-2 text-xs text-slate-500">
          전체 {rooms.totalElements}건 / {rooms.page + 1}·{rooms.totalPages}
          페이지
        </p>
      )}
    </div>
  );
}

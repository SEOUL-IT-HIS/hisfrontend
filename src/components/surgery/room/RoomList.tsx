"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
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
 * <p>코드값은 admin-service 공통코드 소관이라 화면에 코드 그대로 노출한다. 한글 표시명이
 * 필요하면 features/commonCode 로 resolve 한다 — 수술이 표시명을 저장하지는 않는다(§14.1).</p>
 */

/** OR_STATUS_CD: 01사용가능/02사용중/03점검중/04폐쇄 */
const ROOM_STATUS_OPTIONS = [
  { value: "01", label: "01 사용가능" },
  { value: "02", label: "02 사용중" },
  { value: "03", label: "03 점검중" },
  { value: "04", label: "04 폐쇄(제거)" },
];

/** TURNOVER_CD: 01정리중/02준비완료 */
const TURNOVER_OPTIONS = [
  { value: "01", label: "01 정리중" },
  { value: "02", label: "02 준비완료" },
];

const selectClass =
  "h-8 rounded-md border border-slate-200 px-2 text-xs outline-none focus:border-sky-400 disabled:bg-slate-50";

export default function RoomList() {
  const dispatch = useDispatch<AppDispatch>();
  const rooms = useSelector(selectRooms);
  const loading = useSelector(selectRoomLoading);
  const saving = useSelector(selectRoomSaving);
  const error = useSelector(selectRoomError);

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
                  {ROOM_STATUS_OPTIONS.map((option) => (
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
                  {TURNOVER_OPTIONS.map((option) => (
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

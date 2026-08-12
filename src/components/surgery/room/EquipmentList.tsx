"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import { resolveSurgeryMessage } from "@/features/surgery/messages";
import {
  changeEquipmentInoutRequest,
  changeEquipmentStatusRequest,
  fetchEquipmentsRequest,
  selectEquipments,
  selectRoomError,
  selectRoomLoading,
  selectRoomSaving,
} from "@/features/surgery/room/slice";

/**
 * 수술장비 목록 (SL2-9 조회 / SL2-11 제거 / SL2-12 출고반입)
 *
 * <p>제거된 장비도 목록에 남는다. 물리 삭제가 아니라 상태 전이로 처리하기 때문이며
 * (§21.6), 과거 수술기록이 장비를 참조하므로 행을 지우면 이력이 깨진다.
 * 백엔드에 DELETE 엔드포인트 자체가 없다.</p>
 *
 * <p>상태·출고반입 선택지는 admin-service 공통코드에서 가져온다(§21.4). RoomList 와 같은
 * 이유로 훅을 컴포넌트 맨 위에서 한 번만 부른다 — 행마다 부르면 장비 수만큼 호출이 늘어난다.</p>
 *
 * <p>"폐기" 코드는 아직 OR_EQUIP_STATUS_CD 에 없다. admin 에 추가되면 이 화면은 손대지 않아도
 * 선택지에 자동으로 나타난다 — 하드코딩을 걷어낸 이득이 여기서 드러난다.</p>
 */

const selectClass =
  "h-8 rounded-md border border-slate-200 px-2 text-xs outline-none focus:border-sky-400 disabled:bg-slate-50";

export default function EquipmentList() {
  const dispatch = useDispatch<AppDispatch>();
  const equipments = useSelector(selectEquipments);
  const loading = useSelector(selectRoomLoading);
  const saving = useSelector(selectRoomSaving);
  const error = useSelector(selectRoomError);

  const { options: statusOptions } = useCommonCodeOptions("OR_EQUIP_STATUS_CD");
  const { options: inoutOptions } = useCommonCodeOptions("EQUIP_INOUT_CD");

  useEffect(() => {
    dispatch(fetchEquipmentsRequest());
  }, [dispatch]);

  if (loading) {
    return <p className="p-4 text-sm text-slate-500">불러오는 중입니다…</p>;
  }

  if (error) {
    return (
      <p className="p-4 text-sm text-red-600">{resolveSurgeryMessage(error)}</p>
    );
  }

  const items = equipments?.items ?? [];

  if (items.length === 0) {
    return <p className="p-4 text-sm text-slate-500">등록된 장비가 없습니다.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-3 py-2">장비 ID</th>
            <th className="px-3 py-2">장비명</th>
            <th className="px-3 py-2">소속 수술실</th>
            <th className="px-3 py-2">상태</th>
            <th className="px-3 py-2">출고/반입</th>
            <th className="px-3 py-2">수정</th>
          </tr>
        </thead>
        <tbody>
          {items.map((equipment) => (
            <tr
              key={equipment.equipmentId}
              className="border-t border-slate-100"
            >
              <td className="px-3 py-2">{equipment.equipmentId}</td>
              <td className="px-3 py-2">{equipment.equipmentName}</td>
              <td className="px-3 py-2">{equipment.roomCode}</td>
              <td className="px-3 py-2">
                <select
                  className={selectClass}
                  value={equipment.statusCd ?? ""}
                  disabled={saving||equipment.inoutCd === "01"} // 출고 상태에서는 상태 변경 불가
                  onChange={(e) => {
                    if (!e.target.value) return;
                    dispatch(
                      changeEquipmentStatusRequest(equipment.equipmentId, {
                        statusCd: e.target.value,
                      }),
                    )
                  }}
                >
                  <option value="" disabled>
                    미지정
                  </option>
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
                  value={equipment.inoutCd ?? ""}
                  disabled={saving}
                  onChange={(e) => {
                    if (!e.target.value) return;  // 미지정은 전송하지 않는다
                    dispatch(
                      changeEquipmentInoutRequest(equipment.equipmentId, {
                        inoutCd: e.target.value,
                      }),
                    )
                  }}
                >
                  <option value="" disabled>
                    미지정
                  </option>
                  {inoutOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-2">
                <Link
                  href={`/surgery/equipment/update/${equipment.equipmentId}`}
                  className="text-sky-600 underline"
                >
                  수정
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {equipments && (
        <p className="px-3 py-2 text-xs text-slate-500">
          전체 {equipments.totalElements}건 / {equipments.page + 1}·
          {equipments.totalPages}페이지
        </p>
      )}
    </div>
  );
}

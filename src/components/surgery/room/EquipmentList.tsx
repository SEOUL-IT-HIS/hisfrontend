"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
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
 */

/**
 * OR_EQUIP_STATUS_CD: 01사용가능/02사용중/03점검중/04고장
 *
 * <p>"폐기" 코드는 아직 admin-service 공통코드에 없다. 등록되면 여기에 추가하고
 * 제거 동작을 그 코드로 전이시킨다(§21.4 — 코드 추가는 admin 소관).</p>
 */
const EQUIPMENT_STATUS_OPTIONS = [
  { value: "01", label: "01 사용가능" },
  { value: "02", label: "02 사용중" },
  { value: "03", label: "03 점검중" },
  { value: "04", label: "04 고장" },
];

/** EQUIP_INOUT_CD: 01출고/02반입 */
const INOUT_OPTIONS = [
  { value: "01", label: "01 출고" },
  { value: "02", label: "02 반입" },
];

const selectClass =
  "h-8 rounded-md border border-slate-200 px-2 text-xs outline-none focus:border-sky-400 disabled:bg-slate-50";

export default function EquipmentList() {
  const dispatch = useDispatch<AppDispatch>();
  const equipments = useSelector(selectEquipments);
  const loading = useSelector(selectRoomLoading);
  const saving = useSelector(selectRoomSaving);
  const error = useSelector(selectRoomError);

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
                  {EQUIPMENT_STATUS_OPTIONS.map((option) => (
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
                  {INOUT_OPTIONS.map((option) => (
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

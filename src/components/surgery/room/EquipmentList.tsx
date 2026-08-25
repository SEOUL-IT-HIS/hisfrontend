"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import {
  Alert,
  DataTable,
  Modal,
  Pagination,
  Select,
  type DataTableColumn,
} from "@/components/common";
import EquipmentUpdateForm from "@/components/surgery/room/EquipmentUpdateForm";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import { resolveSurgeryMessage } from "@/features/surgery/messages";
import type { SurgicalEquipment } from "@/features/surgery/room/types";
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
 *
 * <p>표·셀렉트·페이지네이션은 components/common 을 쓴다(§12.1).</p>
 */

/** 출고(01) 상태에서는 장비 상태를 바꿀 수 없다 — 수술실에 나가 있는 장비다 */
const STATUS_LOCKED_INOUT = "01";

export default function EquipmentList() {
  const dispatch = useDispatch<AppDispatch>();
  const equipments = useSelector(selectEquipments);
  const loading = useSelector(selectRoomLoading);
  const saving = useSelector(selectRoomSaving);
  const error = useSelector(selectRoomError);

  // 공통 Pagination 은 1-base, 백엔드 Pageable 은 0-base 다.
  const [page, setPage] = useState(1);

  /** 수정 모달에 열려 있는 장비. null 이면 닫힌 상태다 */
  const [editingId, setEditingId] = useState<string | null>(null);

  const { options: statusOptions } = useCommonCodeOptions("OR_EQUIP_STATUS_CD");
  const { options: inoutOptions } = useCommonCodeOptions("EQUIP_INOUT_CD");

  useEffect(() => {
    dispatch(fetchEquipmentsRequest({ page: page - 1 }));
  }, [dispatch, page]);

  const items = equipments?.items ?? [];

  const columns: DataTableColumn<SurgicalEquipment>[] = [
    {
      key: "equipmentId",
      header: "장비 ID",
      render: (equipment) => equipment.equipmentId,
    },
    {
      key: "equipmentName",
      header: "장비명",
      render: (equipment) => equipment.equipmentName,
    },
    {
      key: "roomCode",
      header: "소속 수술실",
      render: (equipment) => equipment.roomCode,
    },
    {
      key: "statusCd",
      header: "상태",
      render: (equipment) => (
        <Select
          className="h-8 text-xs"
          placeholder="미지정"
          options={statusOptions}
          value={equipment.statusCd ?? ""}
          disabled={saving || equipment.inoutCd === STATUS_LOCKED_INOUT}
          onChange={(e) => {
            if (!e.target.value) {
              return;
            }
            dispatch(
              changeEquipmentStatusRequest(equipment.equipmentId, {
                statusCd: e.target.value,
              }),
            );
          }}
        />
      ),
    },
    {
      key: "inoutCd",
      header: "출고/반입",
      render: (equipment) => (
        <Select
          className="h-8 text-xs"
          placeholder="미지정"
          options={inoutOptions}
          value={equipment.inoutCd ?? ""}
          disabled={saving}
          onChange={(e) => {
            if (!e.target.value) {
              return;
            }
            dispatch(
              changeEquipmentInoutRequest(equipment.equipmentId, {
                inoutCd: e.target.value,
              }),
            );
          }}
        />
      ),
    },
    {
      key: "actions",
      header: "수정",
      render: (equipment) => (
        // 페이지 이동 대신 모달을 연다 — 장비명 한 칸 고치자고 목록을 떠날 이유가 없다
        <button
          type="button"
          className="text-sky-600 underline"
          onClick={() => setEditingId(equipment.equipmentId)}
        >
          수정
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {error ? <Alert>{resolveSurgeryMessage(error)}</Alert> : null}

      <DataTable
        columns={columns}
        rows={items}
        rowKey={(equipment) => equipment.equipmentId}
        loading={loading}
        emptyMessage="등록된 장비가 없습니다."
      />

      {equipments ? (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            전체 {equipments.totalElements}건
          </p>
          <Pagination
            page={page}
            totalPages={equipments.totalPages}
            onPageChange={setPage}
          />
        </div>
      ) : null}

      {/*
        editingId 가 있을 때만 폼을 그린다 — 미리 그려두면 목록에 장비가 20개일 때
        단건 조회가 20번 나간다. key 를 걸어 다른 장비를 열면 폼 상태가 초기화되게 한다.
      */}
      <Modal
        open={editingId !== null}
        title="수술장비 수정"
        onClose={() => setEditingId(null)}
        closeDisabled={saving}
      >
        {editingId ? (
          <EquipmentUpdateForm
            key={editingId}
            equipmentId={editingId}
            onDone={() => setEditingId(null)}
          />
        ) : null}
      </Modal>
    </div>
  );
}

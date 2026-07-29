"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  DataTable,
  Modal,
  PageHeader,
  type DataTableColumn,
} from "@/components/common";
import CommonCodeGroupUpdateForm from "@/components/commonCode/CommonCodeGroupUpdateForm";
import CommonCodeItemRegisterForm from "@/components/commonCode/CommonCodeItemRegisterForm";
import CommonCodeItemUpdateForm from "@/components/commonCode/CommonCodeItemUpdateForm";
import { fetchCommonCodeItemRequest } from "@/features/commonCode/slice/commonCodeItemSlice";
import type { CommonCodeGroup } from "@/features/commonCode/types/commonCodeGroupTypes";
import type { CommonCodeItem } from "@/features/commonCode/types/commonCodeItemTypes";
import type { RootState } from "@/store/store";

type CommonCodeItemPanelProps = {
  group: CommonCodeGroup | null;
};

/**
 * 공통코드 항목 상세 영역
 * - 헤더 [등록] → 항목 등록 Modal
 * - 헤더 [수정] → 선택된 그룹(그룹명/사용여부) 수정 Modal
 * - 행 [수정] → 항목(코드명/사용여부) 수정 Modal
 */
export default function CommonCodeItemPanel({ group }: CommonCodeItemPanelProps) {
  const dispatch = useDispatch();
  const items = useSelector((state: RootState) => state.commonCodeItem.items);
  const error = useSelector((state: RootState) => state.commonCodeItem.error);
  const loading = useSelector((state: RootState) => state.commonCodeItem.loading);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [groupEditOpen, setGroupEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<CommonCodeItem | null>(null);

  useEffect(() => {
    if (group != null) {
      dispatch(fetchCommonCodeItemRequest(group.groupId));
    }
  }, [dispatch, group]);

  const columns: DataTableColumn<CommonCodeItem>[] = [
    {
      key: "codeValue",
      header: "코드값",
      render: (row) => row.codeValue,
    },
    {
      key: "codeName",
      header: "코드명",
      render: (row) => row.codeName,
    },
    {
      key: "useYn",
      header: "사용여부",
      className: "w-24",
      render: (row) => (
        <span
          className={
            row.useYn === "Y" ? "font-medium text-sky-600" : "text-slate-400"
          }
        >
          {row.useYn}
        </span>
      ),
    },
    {
      key: "edit",
      header: "",
      className: "w-16",
      render: (row) => (
        <button
          type="button"
          className="font-medium text-sky-700 underline-offset-2 hover:underline"
          onClick={() => setEditItem(row)}
        >
          수정
        </button>
      ),
    },
  ];

  if (group === null) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-2">
        <PageHeader title="공통코드 항목" className="px-3 py-2" />
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 text-sm text-slate-400">
          왼쪽에서 그룹코드를 선택하면 항목이 표시됩니다.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <PageHeader
        title={`공통코드 항목 : ${group.groupCode}`}
        className="px-3 py-2"
        actions={
          <>
            <Button variant="primary" onClick={() => setRegisterOpen(true)}>
              등록
            </Button>
            <Button variant="secondary" onClick={() => setGroupEditOpen(true)}>
              수정
            </Button>
          </>
        }
      />

      {error ? <Alert variant="error">{error}</Alert> : null}

      <DataTable
        columns={columns}
        rows={items}
        rowKey={(row) => row.codeId}
        loading={loading}
        emptyMessage="조회된 공통코드 항목이 없습니다."
        minWidthClassName="min-w-[480px]"
      />

      <Modal
        open={registerOpen}
        title="공통코드 항목 등록"
        onClose={() => setRegisterOpen(false)}
      >
        <CommonCodeItemRegisterForm
          groupId={group.groupId}
          onClose={() => setRegisterOpen(false)}
        />
      </Modal>

      <Modal
        open={groupEditOpen}
        title="공통코드 그룹 수정"
        onClose={() => setGroupEditOpen(false)}
      >
        <CommonCodeGroupUpdateForm
          group={group}
          onClose={() => setGroupEditOpen(false)}
        />
      </Modal>

      <Modal
        open={editItem != null}
        title="공통코드 항목 수정"
        onClose={() => setEditItem(null)}
      >
        {editItem ? (
          <CommonCodeItemUpdateForm
            item={editItem}
            onClose={() => setEditItem(null)}
          />
        ) : null}
      </Modal>
    </div>
  );
}

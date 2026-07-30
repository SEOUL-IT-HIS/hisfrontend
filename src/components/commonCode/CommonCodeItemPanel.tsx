"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, Modal, Panel, StatusBadge } from "@/components/common";
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

  if (group === null) {
    return (
      <Panel dashed>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <span className="text-lg font-semibold">+</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">그룹을 선택하세요</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              왼쪽 목록에서 그룹을 클릭하면
              <br />
              해당 그룹의 코드 항목이 여기에 표시됩니다.
            </p>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-sm font-semibold text-slate-900">
              {group.groupName}
            </h2>
            <span className="rounded-md bg-sky-50 px-2 py-0.5 font-mono text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-600/10">
              {group.groupCode}
            </span>
            <StatusBadge value={group.useYn} />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            항목 {items.length}건 · 그룹 정보와 코드 항목을 이 패널에서 관리합니다
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" onClick={() => setGroupEditOpen(true)}>
            그룹 수정
          </Button>
          <Button variant="primary" onClick={() => setRegisterOpen(true)}>
            항목 등록
          </Button>
        </div>
      </div>

      {error ? (
        <div className="px-5 pt-4">
          <Alert variant="error">{error}</Alert>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 backdrop-blur">
            <tr className="text-xs uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3 font-medium">코드값</th>
              <th className="px-5 py-3 font-medium">코드명</th>
              <th className="w-28 px-5 py-3 font-medium">상태</th>
              <th className="w-20 px-5 py-3 font-medium text-right">작업</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-5 py-20 text-center text-slate-400">
                  목록을 불러오는 중입니다...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-20 text-center">
                  <p className="text-sm font-medium text-slate-600">항목이 없습니다</p>
                  <p className="mt-1 text-xs text-slate-400">
                    상단의 항목 등록으로 첫 코드를 추가하세요.
                  </p>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.codeId}
                  className="border-t border-slate-50 transition-colors hover:bg-slate-50/90"
                >
                  <td className="px-5 py-3.5">
                    <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-700">
                      {item.codeValue}
                    </span>
                  </td>
                  <td className="truncate px-5 py-3.5 text-slate-700">{item.codeName}</td>
                  <td className="w-28 px-5 py-3.5">
                    <StatusBadge value={item.useYn} />
                  </td>
                  <td className="w-20 px-5 py-3.5 text-right">
                    <button
                      type="button"
                      className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-50"
                      onClick={() => setEditItem(item)}
                    >
                      수정
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
    </Panel>
  );
}

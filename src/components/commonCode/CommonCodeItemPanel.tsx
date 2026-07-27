"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, Modal, PageHeader } from "@/components/common";
import CommonCodeItemRegisterForm from "@/components/commonCode/CommonCodeItemRegisterForm";
import { fetchCommonCodeItemRequest } from "@/features/commonCode/slice/commonCodeItemSlice";
import type { RootState } from "@/store/store";

type CommonCodeItemPanelProps = {
  /** 선택한 그룹코드. null이면 미선택 안내만 표시 */
  groupCode: string | null;
  groupId: number | null;
};

/**
 * 공통코드 항목 상세 영역
 * - 그룹코드 클릭 시 목록 옆에 표시
 * - 헤더 오른쪽 등록 버튼 → 모달
 */
export default function CommonCodeItemPanel({ groupId, groupCode }: CommonCodeItemPanelProps) {
  const dispatch = useDispatch();
  const items = useSelector((state: RootState) => state.commonCodeItem.items);
  const error = useSelector((state: RootState) => state.commonCodeItem.error);
  const loading = useSelector((state: RootState) => state.commonCodeItem.loading);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (groupId != null) {
      dispatch(fetchCommonCodeItemRequest(groupId));
    }
  }, [dispatch, groupId]);

  if (groupId === null) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 text-sm text-slate-400">
        왼쪽에서 그룹코드를 선택하면 항목이 표시됩니다.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <PageHeader
        title="공통코드 항목"
        actions={
          <Button variant="primary" onClick={() => setOpen(true)}>
            등록
          </Button>
        }
      />

      {error ? <Alert variant="error">{error}</Alert> : null}

      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200 bg-white p-3">
        <p className="text-sm text-slate-500">선택 그룹코드: {groupCode}</p>
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="w-24 px-3 py-3 font-medium">코드ID</th>
              <th className="px-3 py-3 font-medium">코드명</th>
              <th className="w-24 px-3 py-3 font-medium">사용여부</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="px-4 py-16 text-center text-slate-400">
                  목록을 불러오는 중입니다...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-16 text-center text-slate-400">
                  조회된 공통코드 항목이 없습니다.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  className="border-t border-slate-100 hover:bg-slate-50/80"
                  key={item.codeId}
                >
                  <td className="truncate px-3 py-3 text-slate-800">{item.codeId}</td>
                  <td className="px-3 py-3">{item.codeName}</td>
                  <td className="w-24 px-3 py-3">{item.useYn}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={open}
        title="공통코드 항목 등록"
        onClose={() => setOpen(false)}
      >
        <CommonCodeItemRegisterForm
          groupId={groupId}
          onClose={() => setOpen(false)}
        />
      </Modal>
    </div>
  );
}

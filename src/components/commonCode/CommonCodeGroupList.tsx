"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import CommonCodeItemPanel from "@/components/commonCode/CommonCodeItemPanel";
import CommonCodeGroupRegisterForm from "@/components/commonCode/CommonCodeGroupRegisterForm";
import { Alert, Button, Modal, Panel, StatusBadge } from "@/components/common";
import { fetchCommonCodeGroupRequest } from "@/features/commonCode/slice/commonCodeGroupSlice";
import type { RootState } from "@/store/store";

/**
 * 공통코드 그룹 목록 + 항목 상세
 */
export default function CommonCodeGroupList() {
  const dispatch = useDispatch();
  const groups = useSelector((state: RootState) => state.commonCodeGroup.groups);
  const loading = useSelector((state: RootState) => state.commonCodeGroup.loading);
  const error = useSelector((state: RootState) => state.commonCodeGroup.error);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  const selectedGroup =
    selectedGroupId == null
      ? null
      : groups.find((g) => g.groupId === selectedGroupId) ?? null;

  useEffect(() => {
    dispatch(fetchCommonCodeGroupRequest());
  }, [dispatch]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {/* 페이지 헤더 */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-sky-600">SYSTEM</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            공통코드
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            그룹을 선택한 뒤 항목을 등록·수정합니다.
          </p>
        </div>
        <Button variant="primary" onClick={() => setRegisterOpen(true)}>
          그룹 등록
        </Button>
      </header>

      {error ? <Alert variant="error">{error}</Alert> : null}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        {/* 왼쪽: 그룹 */}
        <Panel>
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">코드 그룹</h2>
              <p className="mt-0.5 text-xs text-slate-400">
                행 클릭 시 항목 패널이 열립니다
              </p>
            </div>
            <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-white">
              {groups.length}
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[440px] text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 backdrop-blur">
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">그룹코드</th>
                  <th className="px-5 py-3 font-medium">그룹명</th>
                  <th className="w-28 px-5 py-3 font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-20 text-center text-slate-400">
                      목록을 불러오는 중입니다...
                    </td>
                  </tr>
                ) : groups.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-20 text-center text-slate-400">
                      등록된 그룹이 없습니다. 우측 상단에서 그룹을 등록하세요.
                    </td>
                  </tr>
                ) : (
                  groups.map((row) => {
                    const selected = selectedGroupId === row.groupId;
                    return (
                      <tr
                        key={row.groupId}
                        onClick={() => setSelectedGroupId(row.groupId)}
                        className={
                          selected
                            ? "relative cursor-pointer bg-sky-50/80 transition-colors"
                            : "cursor-pointer border-t border-slate-50 transition-colors hover:bg-slate-50"
                        }
                      >
                        <td className="relative px-5 py-3.5">
                          {selected ? (
                            <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-sky-500" />
                          ) : null}
                          <span
                            className={
                              selected
                                ? "font-semibold tracking-wide text-sky-700"
                                : "font-semibold tracking-wide text-slate-800"
                            }
                          >
                            {row.groupCode}
                          </span>
                        </td>
                        <td className="truncate px-5 py-3.5 text-slate-600">
                          {row.groupName}
                        </td>
                        <td className="w-28 px-5 py-3.5">
                          <StatusBadge value={row.useYn} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* 오른쪽: 항목 */}
        <CommonCodeItemPanel group={selectedGroup} />
      </div>

      <Modal
        open={registerOpen}
        title="공통코드 그룹 등록"
        onClose={() => setRegisterOpen(false)}
      >
        <CommonCodeGroupRegisterForm onClose={() => setRegisterOpen(false)} />
      </Modal>
    </div>
  );
}

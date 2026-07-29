"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import CommonCodeItemPanel from "@/components/commonCode/CommonCodeItemPanel";
import {
  fetchCommonCodeGroupRequest,
} from "@/features/commonCode/slice/commonCodeGroupSlice";
import type { RootState } from "@/store/store";
import { Alert, Button, Modal, PageHeader } from "@/components/common";
import CommonCodeGroupRegisterForm from "@/components/commonCode/CommonCodeGroupRegisterForm";

/**
 * 공통코드 그룹 목록 + 항목 상세
 * - 왼쪽/오른쪽 패널 헤더·테이블 레이아웃을 동일하게 맞춤
 */
export default function CommonCodeGroupList() {
  const dispatch = useDispatch();
  const groups = useSelector((state: RootState) => state.commonCodeGroup.groups);
  const loading = useSelector((state: RootState) => state.commonCodeGroup.loading);
  const error = useSelector((state: RootState) => state.commonCodeGroup.error);
  const [open, setOpen] = useState(false);

  const [selectedGroupCode, setSelectedGroupCode] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  useEffect(() => {
    dispatch(fetchCommonCodeGroupRequest());
  }, [dispatch]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 p-3">
      <h1 className="px-0.5 text-sm font-semibold text-slate-700">공통코드</h1>

      {error ? <Alert variant="error">{error}</Alert> : null}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2">
        {/* 왼쪽: 그룹 목록 */}
        <div className="flex min-h-0 flex-col gap-2">
          <PageHeader
            title="공통코드 그룹"
            className="px-3 py-2"
            actions={
              <Button variant="primary" onClick={() => setOpen(true)}>
                등록
              </Button>
            }
          />

          <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-120 text-left text-sm">
              <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2.5 font-medium">그룹코드</th>
                  <th className="px-3 py-2.5 font-medium">그룹명</th>
                  <th className="w-24 px-3 py-2.5 font-medium">사용여부</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-16 text-center text-slate-400">
                      목록을 불러오는 중입니다...
                    </td>
                  </tr>
                ) : groups.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-16 text-center text-slate-400">
                      조회된 공통코드 그룹이 없습니다.
                    </td>
                  </tr>
                ) : (
                  groups.map((row) => {
                    const selected = selectedGroupCode === row.groupCode;

                    return (
                      <tr
                        key={row.groupId}
                        className={
                          selected
                            ? "border-t border-slate-100 bg-sky-50"
                            : "border-t border-slate-100 hover:bg-slate-50/80"
                        }
                      >
                        <td className="truncate px-3 py-2.5">
                          <button
                            type="button"
                            className="font-medium text-sky-700 underline-offset-2 hover:underline"
                            onClick={() => {
                              setSelectedGroupCode(row.groupCode);
                              setSelectedGroupId(row.groupId);
                            }}
                          >
                            {row.groupCode}
                          </button>
                        </td>
                        <td className="truncate px-3 py-2.5 text-slate-800">{row.groupName}</td>
                        <td className="truncate px-3 py-2.5">
                          <span
                            className={
                              row.useYn === "Y"
                                ? "font-medium text-sky-600"
                                : "text-slate-400"
                            }
                          >
                            {row.useYn}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Modal
            open={open}
            title="공통코드 그룹 등록"
            onClose={() => setOpen(false)}
          >
            <CommonCodeGroupRegisterForm onClose={() => setOpen(false)} />
          </Modal>
        </div>

        {/* 오른쪽: 항목 상세 */}
        <div className="min-h-0">
          <CommonCodeItemPanel
            groupCode={selectedGroupCode}
            groupId={selectedGroupId}
          />
        </div>
      </div>
    </div>
  );
}

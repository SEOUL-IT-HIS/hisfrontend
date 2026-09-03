"use client";

/**
 * [공통코드 항목 패널]
 *
 * props.group:
 * - null → 그룹 미선택 안내
 * - 값 있음 → 해당 groupId 로 항목 목록 조회
 *
 * 기능:
 * - 항목 등록 / 항목 수정 / 그룹 수정(헤더 버튼)
 * - 항목 검색은 프론트 필터 (DB 재조회 없음)
 */
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  FormField,
  Input,
  Modal,
  Panel,
  Select,
  StatusBadge,
} from "@/components/common";
import CommonCodeGroupUpdateForm from "@/components/commonCode/CommonCodeGroupUpdateForm";
import CommonCodeItemRegisterForm from "@/components/commonCode/CommonCodeItemRegisterForm";
import CommonCodeItemUpdateForm from "@/components/commonCode/CommonCodeItemUpdateForm";
import { fetchCommonCodeItemRequest } from "@/features/commonCode/slice/commonCodeItemSlice";
import type { CommonCodeGroup } from "@/features/commonCode/types/commonCodeGroupTypes";
import type { CommonCodeItem } from "@/features/commonCode/types/commonCodeItemTypes";
import type { RootState } from "@/store/store";

type CommonCodeItemPanelProps = {
  /** 왼쪽에서 선택한 그룹. null 이면 빈 안내 화면 */
  group: CommonCodeGroup | null;
};

export default function CommonCodeItemPanel({ group }: CommonCodeItemPanelProps) {
  const dispatch = useDispatch();
  const items = useSelector((state: RootState) => state.commonCodeItem.items);
  const error = useSelector((state: RootState) => state.commonCodeItem.error);
  const loading = useSelector((state: RootState) => state.commonCodeItem.loading);

  const [registerOpen, setRegisterOpen] = useState(false);
  const [groupEditOpen, setGroupEditOpen] = useState(false);
  /** 행 [수정] 클릭 시 선택한 항목 — 수정 Modal 에 전달 */
  const [editItem, setEditItem] = useState<CommonCodeItem | null>(null);

  // ----- 검색 조건 (프론트 전용) -----
  const [keyword, setKeyword] = useState("");
  const [useYnFilter, setUseYnFilter] = useState("");

  /**
   * 그룹이 바뀌면:
   * 1) 해당 groupId 항목 목록 API 호출
   * 2) 이전 그룹의 검색 조건 초기화
   */
  useEffect(() => {
    if (group != null) {
      dispatch(fetchCommonCodeItemRequest(group.groupId));
      setKeyword("");
      setUseYnFilter("");
    }
  }, [dispatch, group]);

  /**
   * 항목 필터
   * - items(원본)는 Redux 유지
   * - codeValue / codeName / useYn 기준
   */
  const filteredItems = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return items.filter((item) => {
      const matchKeyword =
        q === "" ||
        item.codeValue.toLowerCase().includes(q) ||
        item.codeName.toLowerCase().includes(q);
      const matchUseYn = useYnFilter === "" || item.useYn === useYnFilter;
      return matchKeyword && matchUseYn;
    });
  }, [items, keyword, useYnFilter]);

  function resetItemSearch() {
    setKeyword("");
    setUseYnFilter("");
  }

  // 그룹 미선택
  if (group === null) {
    return (
      <Panel dashed>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <span className="text-lg font-semibold">+</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Select a group</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Click a group in the list on the left
              <br />
              to see its items here.
            </p>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      {/* 헤더: 선택 그룹 정보 + 그룹 수정 / 항목 등록 */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-sm font-semibold text-slate-900">
              {group.groupName}
            </h2>
            <span className="rounded-md bg-sky-50 px-2 py-0.5 font-mono text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-600/10">
              {group.groupCode}
            </span>
            <StatusBadge value={group.useYn} activeLabel="Active" inactiveLabel="Inactive" />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {filteredItems.length}
            {filteredItems.length !== items.length ? ` / ${items.length}` : ""}
            {" items · Manage group info and its items here"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" onClick={() => setGroupEditOpen(true)}>
            Edit Group
          </Button>
          <Button variant="primary" onClick={() => setRegisterOpen(true)}>
            Add Item
          </Button>
        </div>
      </div>

      {/* 항목 검색 영역 */}
      <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
        <div className="flex flex-wrap items-end gap-3">
          <FormField
            label="Search"
            htmlFor="itemKeyword"
            className="min-w-[200px] flex-1"
          >
            <Input
              id="itemKeyword"
              value={keyword}
              placeholder="Code Value / Code Name"
              onChange={(e) => setKeyword(e.target.value)}
            />
          </FormField>
          <FormField label="Status" htmlFor="itemUseYn" className="w-36">
            <Select
              id="itemUseYn"
              value={useYnFilter}
              placeholder="All"
              onChange={(e) => setUseYnFilter(e.target.value)}
              options={[
                { value: "Y", label: "Active (Y)" },
                { value: "N", label: "Inactive (N)" },
              ]}
            />
          </FormField>
          <Button type="button" variant="secondary" onClick={resetItemSearch}>
            Reset
          </Button>
        </div>
      </div>

      {error ? (
        <div className="px-5 pt-4">
          <Alert variant="error">{error}</Alert>
        </div>
      ) : null}

      {/* 항목 테이블 — filteredItems 기준 */}
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 backdrop-blur">
            <tr className="text-xs uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3 font-medium">Code Value</th>
              <th className="px-5 py-3 font-medium">Code Name</th>
              <th className="w-28 px-5 py-3 font-medium">Status</th>
              <th className="w-20 px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-5 py-20 text-center text-slate-400">
                  Loading items...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-20 text-center">
                  <p className="text-sm font-medium text-slate-600">
                    {items.length === 0 ? "No items yet" : "No items match your search"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {items.length === 0
                      ? "Add your first item with the Add Item button above."
                      : "Try a different keyword or status."}
                  </p>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
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
                    <StatusBadge value={item.useYn} activeLabel="Active" inactiveLabel="Inactive" />
                  </td>
                  <td className="w-20 px-5 py-3.5 text-right">
                    <button
                      type="button"
                      className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-50"
                      onClick={() => setEditItem(item)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ----- Modals ----- */}
      <Modal
        open={registerOpen}
        title="Add Code Item"
        onClose={() => setRegisterOpen(false)}
      >
        <CommonCodeItemRegisterForm
          groupId={group.groupId}
          onClose={() => setRegisterOpen(false)}
        />
      </Modal>

      <Modal
        open={groupEditOpen}
        title="Edit Code Group"
        onClose={() => setGroupEditOpen(false)}
      >
        <CommonCodeGroupUpdateForm
          group={group}
          onClose={() => setGroupEditOpen(false)}
        />
      </Modal>

      <Modal
        open={editItem != null}
        title="Edit Code Item"
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
